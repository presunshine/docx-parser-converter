#!/usr/bin/env python3
"""
verify_tagged_tests.py - Verify tagged test cases in DOCX fixtures

Converts DOCX files to HTML/text, extracts tagged test cases from the output,
and verifies actual vs expected results using exact or semantic comparison.

Usage:
    python scripts/verify_tagged_tests.py                      # Verify all
    python scripts/verify_tagged_tests.py --file formatting    # Specific file
    python scripts/verify_tagged_tests.py --category fmt       # By category
    python scripts/verify_tagged_tests.py --test fmt-bold-001  # Single test
    python scripts/verify_tagged_tests.py --verbose            # Show details
    python scripts/verify_tagged_tests.py --json               # JSON output
"""

import argparse
import difflib
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Literal

# Add Python package to path
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
PYTHON_PKG = PROJECT_DIR / "docx_parser_converter_python"
sys.path.insert(0, str(PYTHON_PKG))
sys.path.insert(0, str(SCRIPT_DIR))

from api import docx_to_html, docx_to_text  # noqa: E402
from parse_test_cases import (  # noqa: E402
    TestCase,
    ExpectMode,
    parse_test_cases_from_html,
)
from style_resolver import (  # noqa: E402
    StyleResolver,
    compare_styles,
)


# Directories
FIXTURES_DIR = PROJECT_DIR / "fixtures"
TAGGED_TESTS_DIR = FIXTURES_DIR / "tagged_tests"


class Colors:
    """ANSI color codes for terminal output."""

    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    MAGENTA = "\033[0;35m"
    NC = "\033[0m"  # No Color


@dataclass
class ComparisonResult:
    """Result of comparing expected vs actual output."""

    match: bool
    mode: str  # "exact" | "semantic" | "text"
    diff: str | None = None  # For exact mode
    style_diff: dict | None = None  # For semantic mode
    details: str = ""


@dataclass
class TestResult:
    """Result of verifying a single test case."""

    test_id: str
    description: str
    category: str
    status: Literal["pass", "fail", "error", "skip"]
    comparisons: list[ComparisonResult] = field(default_factory=list)
    actual_html: str = ""
    error_message: str | None = None


@dataclass
class VerificationReport:
    """Full verification report for a DOCX file."""

    source_file: str
    total_tests: int
    passed: int
    failed: int
    errors: int
    skipped: int
    results: list[TestResult] = field(default_factory=list)


def normalize_html_for_comparison(html: str) -> str:
    """
    Normalize HTML for exact comparison.

    - Remove extra whitespace
    - Normalize quotes
    - Lowercase tag names

    Args:
        html: Raw HTML string

    Returns:
        Normalized HTML string
    """
    # Remove leading/trailing whitespace
    html = html.strip()

    # Normalize whitespace (but preserve single spaces)
    html = re.sub(r"\s+", " ", html)

    # Normalize self-closing tags
    html = re.sub(r"\s*/>", "/>", html)

    # Remove spaces around tags
    html = re.sub(r">\s+<", "><", html)

    return html


def compare_exact(expected: str, actual: str) -> ComparisonResult:
    """
    Compare expected and actual HTML using exact string matching.

    Args:
        expected: Expected HTML string
        actual: Actual HTML string

    Returns:
        ComparisonResult
    """
    norm_expected = normalize_html_for_comparison(expected)
    norm_actual = normalize_html_for_comparison(actual)

    if norm_expected == norm_actual:
        return ComparisonResult(match=True, mode="exact")

    # Generate diff
    diff = "\n".join(
        difflib.unified_diff(
            norm_expected.splitlines(),
            norm_actual.splitlines(),
            fromfile="expected",
            tofile="actual",
            lineterm="",
        )
    )

    return ComparisonResult(
        match=False,
        mode="exact",
        diff=diff,
        details=f"Expected: {norm_expected[:100]}...\nActual: {norm_actual[:100]}...",
    )


def extract_element_from_html(html: str, spec: dict) -> dict | None:
    """
    Extract element info from HTML based on spec.

    Handles semantic HTML tags as style equivalents:
    - <strong> = font-weight: bold
    - <em>, <i> = font-style: italic
    - <u> = text-decoration: underline
    - <s>, <strike>, <del> = text-decoration: line-through
    - <sub> = vertical-align: sub
    - <sup> = vertical-align: super

    Args:
        html: HTML content
        spec: Semantic spec with element type, text, etc.

    Returns:
        Dict with element tag, attributes, computed styles, text
    """
    target_element = spec.get("element", "p")
    target_text = spec.get("text") or spec.get("contains")
    expected_styles = spec.get("styles", {})

    # Map semantic HTML tags to their style equivalents
    SEMANTIC_TAG_STYLES = {
        "strong": {"font-weight": "bold"},
        "b": {"font-weight": "bold"},
        "em": {"font-style": "italic"},
        "i": {"font-style": "italic"},
        "u": {"text-decoration": "underline"},
        "s": {"text-decoration": "line-through"},
        "strike": {"text-decoration": "line-through"},
        "del": {"text-decoration": "line-through"},
        "sub": {"vertical-align": "sub"},
        "sup": {"vertical-align": "super"},
    }

    # Special handling: if looking for span with styles, try to find text wrapped in semantic tags
    if target_element == "span" and target_text and expected_styles:
        # Find all semantic tag combinations that could wrap the target text
        # Look for the text content and collect all wrapping semantic tags
        text_pattern = (
            re.escape(target_text) if spec.get("text") else re.escape(target_text)
        )

        # Find where the text appears
        for text_match in re.finditer(text_pattern, html, re.IGNORECASE):
            start_pos = text_match.start()
            end_pos = text_match.end()

            # Look backwards to find opening tags
            # and forwards to find closing tags
            # We want a reasonable window around the text
            context_start = max(0, start_pos - 200)
            context_end = min(len(html), end_pos + 200)
            context = html[context_start:context_end]

            # Collect all semantic tags that appear to wrap this text
            implicit_styles = {}
            found_tags = []

            for tag in SEMANTIC_TAG_STYLES:
                # Check if this tag wraps our text in the context
                # Pattern: <tag...> ... target_text ... </tag>
                wrap_pattern = rf"<{tag}[^>]*>[^<]*{text_pattern}[^<]*</{tag}>"
                if re.search(wrap_pattern, context, re.IGNORECASE):
                    implicit_styles.update(SEMANTIC_TAG_STYLES[tag])
                    found_tags.append(tag)
                # Also check for nested wrapping like <em><strong>text</strong></em>
                nested_pattern = rf"<{tag}[^>]*>.*?{text_pattern}.*?</{tag}>"
                if re.search(nested_pattern, context, re.IGNORECASE | re.DOTALL):
                    implicit_styles.update(SEMANTIC_TAG_STYLES[tag])
                    if tag not in found_tags:
                        found_tags.append(tag)

            if implicit_styles:
                return {
                    "tag": "span",
                    "class": None,
                    "style": None,
                    "id": None,
                    "text": target_text,
                    "raw": context,
                    "implicit_styles": implicit_styles,
                    "found_semantic_tags": found_tags,
                }

    # Determine which elements to search for
    elements_to_try = [target_element]

    # If looking for span with specific styles, also try semantic tags
    if target_element == "span" and expected_styles:
        for tag, tag_styles in SEMANTIC_TAG_STYLES.items():
            # Check if this tag's styles match what we're looking for
            if any(k in expected_styles for k in tag_styles):
                elements_to_try.append(tag)

    # Try each element type
    for elem in elements_to_try:
        # Pattern to match element with optional nested content
        pattern = rf"<{elem}([^>]*)>(.*?)</{elem}>"

        for match in re.finditer(pattern, html, re.IGNORECASE | re.DOTALL):
            attrs_str = match.group(1)
            inner_content = match.group(2)

            # Extract text content (removing nested tags)
            text_content = re.sub(r"<[^>]+>", "", inner_content).strip()

            # Check if text matches
            if target_text:
                if spec.get("contains"):
                    if target_text.lower() not in text_content.lower():
                        continue
                elif spec.get("text"):
                    if target_text.strip().lower() != text_content.lower():
                        continue

            # Extract attributes
            # Note: style values can contain quotes (e.g., font-family: 'Times New Roman')
            # So we need to match the entire value up to the closing quote
            class_match = re.search(r'class\s*=\s*["\']([^"\']*)["\']', attrs_str)
            # Handle style with either double or single quotes, allowing inner quotes of the other type
            style_match = re.search(r'style\s*=\s*"([^"]*)"', attrs_str)
            if not style_match:
                style_match = re.search(r"style\s*=\s*'([^']*)'", attrs_str)
            id_match = re.search(r'id\s*=\s*["\']([^"\']*)["\']', attrs_str)

            # Build implicit styles from semantic tag
            implicit_styles = dict(SEMANTIC_TAG_STYLES.get(elem.lower(), {}))

            # Also check for nested semantic tags in inner_content
            for nested_tag in SEMANTIC_TAG_STYLES:
                if f"<{nested_tag}" in inner_content.lower():
                    implicit_styles.update(SEMANTIC_TAG_STYLES[nested_tag])

            return {
                "tag": elem,
                "class": class_match.group(1) if class_match else None,
                "style": style_match.group(1) if style_match else None,
                "id": id_match.group(1) if id_match else None,
                "text": text_content,
                "raw": match.group(0),
                "implicit_styles": implicit_styles,
            }

    return None


def compare_semantic(
    expected_spec: dict, actual_html: str, full_html: str
) -> ComparisonResult:
    """
    Compare using semantic specification.

    Resolves computed styles and compares against expected properties.
    Also considers implicit styles from semantic HTML tags (e.g., <strong> = bold).

    Args:
        expected_spec: Parsed YAML spec
        actual_html: Actual HTML content for this test
        full_html: Full HTML document (for <style> block)

    Returns:
        ComparisonResult
    """
    # Check for parse errors
    if "_parse_error" in expected_spec:
        return ComparisonResult(
            match=False,
            mode="semantic",
            details=f"YAML parse error: {expected_spec['_parse_error']}",
        )

    # Extract the target element from actual HTML
    element_info = extract_element_from_html(actual_html, expected_spec)

    if not element_info:
        return ComparisonResult(
            match=False,
            mode="semantic",
            details=f"Could not find element matching spec: {expected_spec}",
        )

    # Get computed styles from CSS
    resolver = StyleResolver(full_html)
    computed_styles = resolver.get_computed_styles(
        element_info["tag"],
        element_info.get("class"),
        element_info.get("style"),
        element_info.get("id"),
    )

    # Add implicit styles from semantic HTML tags
    implicit_styles = element_info.get("implicit_styles", {})
    for prop, val in implicit_styles.items():
        if prop not in computed_styles:
            computed_styles[prop] = val

    # Compare styles
    expected_styles = expected_spec.get("styles", {})
    if expected_styles:
        style_result = compare_styles(expected_styles, computed_styles)

        if not style_result["match"]:
            return ComparisonResult(
                match=False,
                mode="semantic",
                style_diff=style_result,
                details=f"Style mismatch: {style_result}",
            )

    # Compare attributes if specified
    expected_attrs = expected_spec.get("attributes", {})
    for attr, expected_val in expected_attrs.items():
        actual_val = element_info.get(attr)
        if str(expected_val) != str(actual_val):
            return ComparisonResult(
                match=False,
                mode="semantic",
                details=f"Attribute mismatch: {attr} expected={expected_val}, actual={actual_val}",
            )

    # Compare text if specified
    if "text" in expected_spec:
        expected_text = expected_spec["text"].strip()
        actual_text = element_info.get("text", "").strip()
        if expected_text.lower() != actual_text.lower():
            return ComparisonResult(
                match=False,
                mode="semantic",
                details=f"Text mismatch: expected='{expected_text}', actual='{actual_text}'",
            )

    return ComparisonResult(match=True, mode="semantic")


def compare_text(expected: str, actual: str) -> ComparisonResult:
    """
    Compare plain text output.

    Args:
        expected: Expected text
        actual: Actual text

    Returns:
        ComparisonResult
    """
    norm_expected = " ".join(expected.split())
    norm_actual = " ".join(actual.split())

    if norm_expected == norm_actual:
        return ComparisonResult(match=True, mode="text")

    diff = "\n".join(
        difflib.unified_diff(
            expected.splitlines(),
            actual.splitlines(),
            fromfile="expected",
            tofile="actual",
            lineterm="",
        )
    )

    return ComparisonResult(match=False, mode="text", diff=diff, details="Text differs")


def verify_test_case(
    test_case: TestCase, full_html: str, _full_text: str | None = None
) -> TestResult:
    """
    Verify a single test case.

    Args:
        test_case: The test case to verify
        full_html: Full HTML output (for style resolution)
        full_text: Full text output (optional)

    Returns:
        TestResult
    """
    result = TestResult(
        test_id=test_case.id,
        description=test_case.description,
        category=test_case.category,
        status="pass",
        actual_html=test_case.actual_html,
    )

    if not test_case.expected_outputs:
        result.status = "skip"
        result.error_message = "No expected outputs defined"
        return result

    for expected in test_case.expected_outputs:
        try:
            if expected.mode == ExpectMode.EXACT:
                comparison = compare_exact(expected.content, test_case.actual_html)
            elif expected.mode == ExpectMode.SEMANTIC:
                parsed_spec = (
                    expected.parsed if isinstance(expected.parsed, dict) else {}
                )
                comparison = compare_semantic(
                    parsed_spec, test_case.actual_html, full_html
                )
            elif expected.mode == ExpectMode.TEXT:
                # Replace block-level tags with spaces to preserve word boundaries
                actual_text = test_case.actual_html
                actual_text = re.sub(
                    r"</p>\s*<p[^>]*>", " ", actual_text
                )  # paragraph breaks
                actual_text = re.sub(r"<br\s*/?>", " ", actual_text)  # line breaks
                actual_text = re.sub(r"<[^>]+>", "", actual_text)  # remaining tags
                comparison = compare_text(expected.content, actual_text)
            else:
                comparison = ComparisonResult(
                    match=False,
                    mode=expected.mode.value,
                    details=f"Unknown mode: {expected.mode}",
                )

            result.comparisons.append(comparison)

            if not comparison.match:
                result.status = "fail"

        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
            result.comparisons.append(
                ComparisonResult(
                    match=False, mode=expected.mode.value, details=f"Error: {e}"
                )
            )

    return result


def verify_docx_file(
    docx_path: Path, verbose: bool = False, save_outputs: bool = False
) -> VerificationReport:
    """
    Verify all test cases in a DOCX file.

    Args:
        docx_path: Path to DOCX file
        verbose: Show detailed output
        save_outputs: Save HTML and text outputs alongside DOCX file

    Returns:
        VerificationReport
    """
    report = VerificationReport(
        source_file=docx_path.name,
        total_tests=0,
        passed=0,
        failed=0,
        errors=0,
        skipped=0,
    )

    try:
        # Convert to HTML
        html_output = docx_to_html(str(docx_path))
        text_output = docx_to_text(str(docx_path))

        # Save outputs alongside DOCX file if requested
        if save_outputs:
            html_path = docx_path.with_suffix(".html")
            text_path = docx_path.with_suffix(".txt")
            html_path.write_text(html_output, encoding="utf-8")
            text_path.write_text(text_output, encoding="utf-8")
            if verbose:
                print(f"  Saved: {html_path.name}, {text_path.name}")

    except Exception as e:
        report.errors = 1
        report.results.append(
            TestResult(
                test_id="conversion",
                description="DOCX conversion",
                category="system",
                status="error",
                error_message=str(e),
            )
        )
        return report

    # Parse test cases from HTML output
    test_cases = parse_test_cases_from_html(html_output)
    report.total_tests = len(test_cases)

    if verbose and test_cases:
        print(f"  Found {len(test_cases)} test cases")

    # Verify each test case
    for tc in test_cases:
        result = verify_test_case(tc, html_output, text_output)
        report.results.append(result)

        if result.status == "pass":
            report.passed += 1
        elif result.status == "fail":
            report.failed += 1
        elif result.status == "error":
            report.errors += 1
        else:
            report.skipped += 1

    return report


def print_result(result: TestResult, verbose: bool = False) -> None:
    """Print a single test result."""
    status_icons = {
        "pass": f"{Colors.GREEN}✓{Colors.NC}",
        "fail": f"{Colors.RED}✗{Colors.NC}",
        "error": f"{Colors.RED}!{Colors.NC}",
        "skip": f"{Colors.YELLOW}○{Colors.NC}",
    }

    icon = status_icons.get(result.status, "?")
    print(f"  {icon} {result.test_id}: {result.description}")

    if verbose or result.status in ("fail", "error"):
        for comp in result.comparisons:
            if not comp.match:
                print(f"      Mode: {comp.mode}")
                if comp.diff:
                    print(f"      Diff:\n{comp.diff[:500]}")
                if comp.style_diff:
                    print(f"      Style diff: {comp.style_diff}")
                if comp.details:
                    print(f"      Details: {comp.details[:200]}")

        if result.error_message:
            print(f"      Error: {result.error_message}")


def print_report(report: VerificationReport, verbose: bool = False) -> None:
    """Print verification report."""
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print(f"  File: {report.source_file}")
    print(f"  Tests: {report.total_tests}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}\n")

    for result in report.results:
        print_result(result, verbose)

    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print(f"  {Colors.GREEN}Passed: {report.passed}{Colors.NC}")
    if report.failed:
        print(f"  {Colors.RED}Failed: {report.failed}{Colors.NC}")
    if report.errors:
        print(f"  {Colors.RED}Errors: {report.errors}{Colors.NC}")
    if report.skipped:
        print(f"  {Colors.YELLOW}Skipped: {report.skipped}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}\n")


def get_tagged_test_files(file_filter: str | None = None) -> list[Path]:
    """Get list of tagged test DOCX files."""
    if not TAGGED_TESTS_DIR.exists():
        return []

    files = list(TAGGED_TESTS_DIR.glob("*.docx"))

    if file_filter:
        files = [f for f in files if file_filter.lower() in f.stem.lower()]

    return sorted(files)


def main():
    parser = argparse.ArgumentParser(
        description="Verify tagged test cases in DOCX fixtures"
    )
    parser.add_argument("--file", "-f", help="Filter by file name (partial match)")
    parser.add_argument(
        "--category", "-c", help="Filter by test category (fmt, para, list, etc.)"
    )
    parser.add_argument("--test", "-t", help="Run specific test by ID")
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Show detailed output"
    )
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument(
        "--save-outputs",
        "-s",
        action="store_true",
        help="Save HTML and text outputs alongside DOCX files",
    )

    args = parser.parse_args()

    # Find test files
    test_files = get_tagged_test_files(args.file)

    if not test_files:
        if not TAGGED_TESTS_DIR.exists():
            print(
                f"{Colors.YELLOW}Tagged tests directory not found: {TAGGED_TESTS_DIR}{Colors.NC}"
            )
            print("Create it and add tagged DOCX files to run tests.")
        else:
            print(f"{Colors.YELLOW}No tagged test files found{Colors.NC}")
        sys.exit(0)

    all_reports = []
    total_passed = 0
    total_failed = 0
    total_errors = 0

    for docx_path in test_files:
        if not args.json:
            print(f"\n{Colors.CYAN}Verifying: {docx_path.name}{Colors.NC}")

        report = verify_docx_file(docx_path, args.verbose, args.save_outputs)

        # Filter by category if specified
        if args.category:
            report.results = [r for r in report.results if r.category == args.category]
            report.total_tests = len(report.results)
            report.passed = sum(1 for r in report.results if r.status == "pass")
            report.failed = sum(1 for r in report.results if r.status == "fail")
            report.errors = sum(1 for r in report.results if r.status == "error")
            report.skipped = sum(1 for r in report.results if r.status == "skip")

        # Filter by test ID if specified
        if args.test:
            report.results = [r for r in report.results if r.test_id == args.test]
            report.total_tests = len(report.results)
            report.passed = sum(1 for r in report.results if r.status == "pass")
            report.failed = sum(1 for r in report.results if r.status == "fail")

        all_reports.append(report)
        total_passed += report.passed
        total_failed += report.failed
        total_errors += report.errors

        if not args.json:
            print_report(report, args.verbose)

    # JSON output
    if args.json:
        output = {
            "reports": [asdict(r) for r in all_reports],
            "summary": {
                "total_files": len(all_reports),
                "total_passed": total_passed,
                "total_failed": total_failed,
                "total_errors": total_errors,
            },
        }
        print(json.dumps(output, indent=2, default=str))
        sys.exit(0 if total_failed == 0 and total_errors == 0 else 1)

    # Final summary
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print("  FINAL SUMMARY")
    print(f"  Files: {len(all_reports)}")
    print(f"  {Colors.GREEN}Total Passed: {total_passed}{Colors.NC}")
    if total_failed:
        print(f"  {Colors.RED}Total Failed: {total_failed}{Colors.NC}")
    if total_errors:
        print(f"  {Colors.RED}Total Errors: {total_errors}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}\n")

    sys.exit(0 if total_failed == 0 and total_errors == 0 else 1)


if __name__ == "__main__":
    main()
