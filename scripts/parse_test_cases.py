#!/usr/bin/env python3
"""
parse_test_cases.py - Extract test cases from converted HTML output

Parses the HTML output from docx_to_html() to extract tagged test cases,
their actual converted content, and expected outputs.

Test markers use Unicode diamond: ◆TEST:id:description◆ ... ◆/TEST◆

Usage:
    from parse_test_cases import parse_test_cases_from_html

    test_cases = parse_test_cases_from_html(html_output)
    for tc in test_cases:
        print(f"{tc.id}: {tc.status}")
"""

import html
import re
from dataclasses import dataclass, field
from enum import Enum


class ExpectMode(Enum):
    """Comparison mode for expected output."""

    EXACT = "exact"
    SEMANTIC = "semantic"
    TEXT = "text"


@dataclass
class ExpectedOutput:
    """Expected output specification."""

    mode: ExpectMode
    content: str  # Raw content (HTML string or YAML spec)
    parsed: dict | str | None = None  # Parsed content (for semantic mode)


@dataclass
class TestCase:
    """A single test case extracted from HTML output."""

    id: str
    description: str
    category: str
    feature: str
    actual_html: str  # The actual converted HTML content
    expected_outputs: list[ExpectedOutput] = field(default_factory=list)
    raw_section: str = ""  # Full raw section between TEST markers
    line_number: int = 0  # Approximate line in HTML


# Regex patterns for markers
# Using ◆ (U+25C6 BLACK DIAMOND) as marker character
TEST_START_PATTERN = re.compile(r"◆TEST:([a-zA-Z0-9_-]+):([^◆]+)◆", re.UNICODE)
TEST_END_PATTERN = re.compile(r"◆/TEST◆", re.UNICODE)
EXPECT_START_PATTERN = re.compile(
    r"◆EXPECT:(exact|semantic|text)◆", re.UNICODE | re.IGNORECASE
)
EXPECT_END_PATTERN = re.compile(r"◆/EXPECT◆", re.UNICODE)


def unescape_html_content(content: str) -> str:
    """
    Unescape HTML entities in content.

    The expected output embedded in DOCX gets HTML-escaped during conversion.
    We need to unescape it to get the original expected HTML.

    Args:
        content: HTML-escaped content

    Returns:
        Unescaped content
    """
    return html.unescape(content)


def strip_html_tags(content: str) -> str:
    """
    Remove HTML tags from content, keeping only text.

    Used to extract text from converted paragraphs.

    Args:
        content: HTML content

    Returns:
        Plain text content
    """
    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", "", content)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_text_between_markers(
    content: str, start_pattern: re.Pattern, end_pattern: re.Pattern
) -> list[tuple[int, int, re.Match]]:
    """
    Find all regions between start and end markers.

    Returns:
        List of (start_pos, end_pos, start_match) tuples
    """
    regions = []
    pos = 0

    while pos < len(content):
        start_match = start_pattern.search(content, pos)
        if not start_match:
            break

        end_match = end_pattern.search(content, start_match.end())
        if not end_match:
            # No closing marker - skip this start
            pos = start_match.end()
            continue

        regions.append((start_match.end(), end_match.start(), start_match))
        pos = end_match.end()

    return regions


def parse_yaml_spec(yaml_content: str) -> dict:
    """
    Parse YAML-like semantic specification.

    Simple parser for our subset of YAML - handles:
    - key: value pairs
    - nested dicts via indentation
    - simple lists

    Args:
        yaml_content: YAML-like string

    Returns:
        Parsed dict structure
    """
    try:
        result: dict = {}
        current_dict = result
        dict_stack: list[tuple[dict, int]] = [(result, -1)]
        current_key = None

        lines = yaml_content.strip().split("\n")

        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue

            # Calculate indentation
            stripped = line.lstrip()
            indent = len(line) - len(stripped)

            # Skip comments
            if stripped.startswith("#"):
                continue

            # Pop stack if indent decreased
            while dict_stack and indent <= dict_stack[-1][1]:
                dict_stack.pop()

            if dict_stack:
                current_dict = dict_stack[-1][0]
            else:
                current_dict = result
                dict_stack = [(result, -1)]

            # Parse key: value
            if ":" in stripped:
                key, _, value = stripped.partition(":")
                key = key.strip()
                value = value.strip()

                if value:
                    # Simple value
                    # Remove quotes if present
                    if (value.startswith('"') and value.endswith('"')) or (
                        value.startswith("'") and value.endswith("'")
                    ):
                        value = value[1:-1]
                    current_dict[key] = value
                else:
                    # Nested dict
                    current_dict[key] = {}
                    dict_stack.append((current_dict[key], indent))
                    current_key = key
            elif stripped.startswith("- "):
                # List item
                if current_key and isinstance(current_dict.get(current_key), dict):
                    # Convert to list
                    current_dict[current_key] = []
                if current_key and isinstance(current_dict.get(current_key), list):
                    current_dict[current_key].append(stripped[2:].strip())

        return result

    except Exception as e:
        # Return raw content on parse error
        return {"_parse_error": str(e), "_raw": yaml_content}


def parse_expected_outputs(section_content: str) -> list[ExpectedOutput]:
    """
    Extract all EXPECT blocks from a test section.

    Args:
        section_content: Content between TEST markers

    Returns:
        List of ExpectedOutput objects
    """
    outputs = []

    # Find all EXPECT regions
    regions = extract_text_between_markers(
        section_content, EXPECT_START_PATTERN, EXPECT_END_PATTERN
    )

    for start_pos, end_pos, start_match in regions:
        mode_str = start_match.group(1).lower()
        mode = ExpectMode(mode_str)

        raw_content = section_content[start_pos:end_pos]
        # Unescape HTML entities
        content = unescape_html_content(raw_content)
        # Strip surrounding whitespace and any wrapping tags
        content = strip_wrapper_tags(content)

        parsed = None
        if mode == ExpectMode.SEMANTIC:
            parsed = parse_yaml_spec(content)

        outputs.append(ExpectedOutput(mode=mode, content=content, parsed=parsed))

    return outputs


def strip_wrapper_tags(content: str) -> str:
    """
    Strip paragraph wrapper tags that may surround the content.

    The expected output might be wrapped in <p> tags from conversion.
    Also handles multiple paragraphs where each line was wrapped.

    Args:
        content: HTML content

    Returns:
        Content with wrapper tags removed, lines joined
    """
    content = content.strip()

    # Check if content is multiple wrapped paragraphs
    # Pattern: </p><p>...</p><p> or similar
    if re.search(r"</p>\s*<p[^>]*>", content, re.IGNORECASE):
        # Multiple paragraphs - extract text from each and join
        # Remove leading </p> or <p> tags
        content = re.sub(r"^</p>\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*<p[^>]*>$", "", content, flags=re.IGNORECASE)

        # Replace </p><p> with newlines
        content = re.sub(r"</p>\s*<p[^>]*>", "\n", content, flags=re.IGNORECASE)

        # Remove any remaining outer tags
        content = re.sub(r"^<p[^>]*>", "", content, flags=re.IGNORECASE)
        content = re.sub(r"</p>$", "", content, flags=re.IGNORECASE)

        # Clean up non-breaking spaces that Word adds
        content = content.replace("\xa0", " ")

        return content.strip()

    # Single paragraph - simple removal
    # Remove outer <p>...</p> if present
    p_match = re.match(r"^<p[^>]*>(.*)</p>$", content, re.DOTALL | re.IGNORECASE)
    if p_match:
        content = p_match.group(1).strip()

    # Remove outer <span>...</span> if present
    span_match = re.match(
        r"^<span[^>]*>(.*)</span>$", content, re.DOTALL | re.IGNORECASE
    )
    if span_match:
        content = span_match.group(1).strip()

    # Clean up non-breaking spaces
    content = content.replace("\xa0", " ")

    return content


def extract_actual_content(section_content: str) -> str:
    """
    Extract the actual converted content from a test section.

    The actual content is everything between the TEST marker and the first EXPECT marker.

    Args:
        section_content: Content between TEST start and TEST end markers

    Returns:
        Actual HTML content (the converted test input)
    """
    # Find first EXPECT marker
    expect_match = EXPECT_START_PATTERN.search(section_content)

    if expect_match:
        actual = section_content[: expect_match.start()]
    else:
        actual = section_content

    # Clean up the actual content
    actual = actual.strip()

    # Remove the marker text itself if present (shouldn't be, but just in case)
    actual = re.sub(r"◆[^◆]*◆", "", actual)

    return actual.strip()


def parse_test_id(test_id: str) -> tuple[str, str]:
    """
    Parse test ID into category and feature.

    Args:
        test_id: Test ID like "fmt-bold-001"

    Returns:
        (category, feature) tuple
    """
    parts = test_id.split("-")
    if len(parts) >= 2:
        category = parts[0]
        feature = "-".join(parts[1:-1]) if len(parts) > 2 else parts[1]
        return category, feature
    return test_id, ""


def parse_test_cases_from_html(html_content: str) -> list[TestCase]:
    """
    Parse all test cases from converted HTML output.

    Args:
        html_content: Full HTML output from docx_to_html()

    Returns:
        List of TestCase objects
    """
    test_cases = []

    # Find all TEST regions
    regions = extract_text_between_markers(
        html_content, TEST_START_PATTERN, TEST_END_PATTERN
    )

    for start_pos, end_pos, start_match in regions:
        test_id = start_match.group(1)
        description = start_match.group(2).strip()
        category, feature = parse_test_id(test_id)

        section_content = html_content[start_pos:end_pos]

        # Extract actual converted content
        actual_html = extract_actual_content(section_content)

        # Extract expected outputs
        expected_outputs = parse_expected_outputs(section_content)

        # Calculate approximate line number
        line_number = html_content[: start_match.start()].count("\n") + 1

        test_cases.append(
            TestCase(
                id=test_id,
                description=description,
                category=category,
                feature=feature,
                actual_html=actual_html,
                expected_outputs=expected_outputs,
                raw_section=section_content,
                line_number=line_number,
            )
        )

    return test_cases


def parse_test_cases_from_text(text_content: str) -> list[TestCase]:
    """
    Parse test cases from plain text output (docx_to_text).

    Similar to HTML parsing but simpler - no HTML tags to handle.

    Args:
        text_content: Full text output from docx_to_text()

    Returns:
        List of TestCase objects
    """
    test_cases = []

    # Find all TEST regions
    regions = extract_text_between_markers(
        text_content, TEST_START_PATTERN, TEST_END_PATTERN
    )

    for start_pos, end_pos, start_match in regions:
        test_id = start_match.group(1)
        description = start_match.group(2).strip()
        category, feature = parse_test_id(test_id)

        section_content = text_content[start_pos:end_pos]

        # Extract actual content (before EXPECT)
        actual_text = extract_actual_content(section_content)

        # Extract expected outputs
        expected_outputs = parse_expected_outputs(section_content)

        line_number = text_content[: start_match.start()].count("\n") + 1

        test_cases.append(
            TestCase(
                id=test_id,
                description=description,
                category=category,
                feature=feature,
                actual_html=actual_text,  # Using actual_html field for text too
                expected_outputs=expected_outputs,
                raw_section=section_content,
                line_number=line_number,
            )
        )

    return test_cases


def get_test_by_id(test_cases: list[TestCase], test_id: str) -> TestCase | None:
    """
    Find a test case by ID.

    Args:
        test_cases: List of test cases
        test_id: Test ID to find

    Returns:
        TestCase or None
    """
    for tc in test_cases:
        if tc.id == test_id:
            return tc
    return None


def get_tests_by_category(test_cases: list[TestCase], category: str) -> list[TestCase]:
    """
    Filter test cases by category.

    Args:
        test_cases: List of test cases
        category: Category to filter by (e.g., "fmt", "para")

    Returns:
        Filtered list of test cases
    """
    return [tc for tc in test_cases if tc.category == category]


if __name__ == "__main__":
    # Quick test with sample HTML
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
        <p>◆TEST:fmt-bold-001:Bold text should produce strong tag◆</p>
        <p>This is <strong>bold</strong> text.</p>
        <p>◆EXPECT:exact◆</p>
        <p>&lt;p&gt;This is &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;</p>
        <p>◆/EXPECT◆</p>
        <p>◆/TEST◆</p>

        <p>◆TEST:font-size-24-001:24pt font size◆</p>
        <p class="p-1">Large text here.</p>
        <p>◆EXPECT:semantic◆</p>
        <p>element: p</p>
        <p>text: Large text here.</p>
        <p>styles:</p>
        <p>  font-size: 24pt</p>
        <p>◆/EXPECT◆</p>
        <p>◆/TEST◆</p>
    </body>
    </html>
    """

    test_cases = parse_test_cases_from_html(sample_html)

    print(f"Found {len(test_cases)} test cases:\n")

    for tc in test_cases:
        print(f"ID: {tc.id}")
        print(f"Description: {tc.description}")
        print(f"Category: {tc.category}")
        print(f"Actual HTML: {tc.actual_html[:100]}...")
        print(f"Expected outputs: {len(tc.expected_outputs)}")
        for exp in tc.expected_outputs:
            print(f"  - Mode: {exp.mode.value}")
            print(f"    Content: {exp.content[:50]}...")
        print()
