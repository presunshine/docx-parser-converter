"""Tagged format integration tests.

Tests using the Test #N format from DOCX files. These tests verify specific
formatting features by parsing expected values embedded in the DOCX files.

Test format in DOCX:
    Test #1: {Test Name}
    {Description of what styles/properties to expect}
    Expected: {JSON with expected properties}

    [CONTENT TO TEST - table, paragraph, list, etc.]

This provides a way to test specific formatting features with expected values
directly in the test documents, making it easy to verify feature parity
between Python and TypeScript implementations.
"""

import json
import re
from pathlib import Path
from typing import Any

import pytest

from docx_parser_converter.api import _parse_docx, docx_to_html

# =============================================================================
# Paths
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
FIXTURES_DIR = PROJECT_ROOT / "fixtures"
TAGGED_TESTS_DIR = FIXTURES_DIR / "tagged_tests"


# =============================================================================
# Test Extraction Helpers
# =============================================================================


def extract_tests_from_docx(docx_path: Path) -> list[dict[str, Any]]:
    """Extract test definitions from DOCX file.

    Returns list of tests with:
        - number: test number
        - name: test name
        - description: test description
        - expected: parsed JSON of expected properties
        - table_index: which table (0-indexed) belongs to this test
    """
    doc, _ = _parse_docx(str(docx_path))

    tests: list[dict[str, Any]] = []
    current_test: dict[str, Any] | None = None
    table_index = 0

    if doc is None or doc.body is None:
        return tests

    for item in doc.body.content:
        # Check if it's a paragraph
        if hasattr(item, "content"):
            # Extract text from paragraph
            text = ""
            for run in item.content:
                if hasattr(run, "content"):
                    for content_item in run.content:
                        if hasattr(content_item, "value"):
                            text += content_item.value

            text = text.strip()

            # Check for test header: "Test #N: Name"
            test_match = re.match(r"^Test\s*#?\s*(\d+)\s*:\s*(.+)$", text, re.IGNORECASE)
            if test_match:
                if current_test:
                    tests.append(current_test)

                current_test = {
                    "number": int(test_match.group(1)),
                    "name": test_match.group(2).strip(),
                    "description": "",
                    "expected": {},
                    "table_index": None,
                }
                continue

            # Check for Expected: {JSON}
            expected_match = re.match(r"^Expected\s*:\s*(\{.+\})\s*$", text)
            if expected_match and current_test:
                try:
                    current_test["expected"] = json.loads(expected_match.group(1))
                except json.JSONDecodeError:
                    pass
                continue

            # If we have a current test and this is description text
            if current_test and text and not current_test["description"]:
                current_test["description"] = text

        # Check if it's a table
        elif hasattr(item, "tr"):
            if current_test and current_test["table_index"] is None:
                current_test["table_index"] = table_index
            table_index += 1

    if current_test:
        tests.append(current_test)

    return tests


def parse_style_attribute(style_str: str) -> dict[str, str]:
    """Parse a style attribute string into a dict."""
    styles: dict[str, str] = {}
    if not style_str:
        return styles

    for part in style_str.split(";"):
        part = part.strip()
        if ":" in part:
            key, value = part.split(":", 1)
            styles[key.strip()] = value.strip()

    return styles


def normalize_border(border_str: str | None) -> str:
    """Normalize border string for comparison."""
    if not border_str or border_str.lower() == "none":
        return "none"

    border_str = " ".join(border_str.split())

    def normalize_pt(match: re.Match[str]) -> str:
        value = float(match.group(1))
        if value == int(value):
            return f"{int(value)}pt"
        return f"{value}pt"

    border_str = re.sub(r"(\d+\.?\d*)pt", normalize_pt, border_str)

    color_match = re.search(r"#([0-9a-fA-F]{6})", border_str)
    if color_match:
        border_str = border_str.replace(color_match.group(0), color_match.group(0).upper())

    return border_str


def normalize_color(color_str: str | None) -> str | None:
    """Normalize color string for comparison."""
    if not color_str:
        return None
    return color_str.upper()


def normalize_dimension(dim_str: str | None) -> str | None:
    """Normalize dimension string for comparison."""
    if not dim_str:
        return None

    dim_str = dim_str.strip()

    pct_match = re.match(r"^(\d+\.?\d*)%$", dim_str)
    if pct_match:
        value = float(pct_match.group(1))
        if value == int(value):
            return f"{int(value)}%"
        return f"{value}%"

    pt_match = re.match(r"^(\d+\.?\d*)pt$", dim_str)
    if pt_match:
        value = float(pt_match.group(1))
        if value == int(value):
            return f"{int(value)}pt"
        return f"{value}pt"

    return dim_str


def extract_tables_from_html(html: str) -> list[dict[str, Any]]:
    """Extract detailed table information from HTML output."""
    tables: list[dict[str, Any]] = []

    table_pattern = re.compile(r"<table([^>]*)>(.*?)</table>", re.DOTALL)

    for table_match in table_pattern.finditer(html):
        table_attrs = table_match.group(1)
        table_content = table_match.group(2)

        info: dict[str, Any] = {
            "rows": 0,
            "cols": 0,
            "cells": [],
            "has_colspan": False,
            "has_rowspan": False,
            "table_border_top": "none",
            "table_border_bottom": "none",
            "table_border_left": "none",
            "table_border_right": "none",
            "table_width": None,
            "cell_border_top": "none",
            "cell_border_bottom": "none",
            "cell_border_left": "none",
            "cell_border_right": "none",
            "cell_bg": None,
            "cell_valign": None,
            "cell_width": None,
            "text_bold": False,
            "text_italic": False,
            "text_underline": False,
            "text_color": None,
            "text_size": None,
            "text_font": None,
        }

        table_style_match = re.search(r'style="([^"]*)"', table_attrs)
        if table_style_match:
            table_styles = parse_style_attribute(table_style_match.group(1))
            info["table_width"] = normalize_dimension(table_styles.get("width"))

        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_content, re.DOTALL)
        info["rows"] = len(rows)

        all_row_cells: list[list[tuple[str, str]]] = []
        for row_content in rows:
            cells = re.findall(r"<td([^>]*)>(.*?)</td>", row_content, re.DOTALL)
            all_row_cells.append(cells)

        if all_row_cells:
            if all_row_cells[0]:
                first_cell_attrs = all_row_cells[0][0][0]
                style_match = re.search(r'style="([^"]*)"', first_cell_attrs)
                if style_match:
                    styles = parse_style_attribute(style_match.group(1))
                    info["table_border_top"] = normalize_border(styles.get("border-top"))
                    info["table_border_left"] = normalize_border(styles.get("border-left"))

            if all_row_cells[-1]:
                last_row_first_cell_attrs = all_row_cells[-1][0][0]
                style_match = re.search(r'style="([^"]*)"', last_row_first_cell_attrs)
                if style_match:
                    styles = parse_style_attribute(style_match.group(1))
                    info["table_border_bottom"] = normalize_border(styles.get("border-bottom"))

            if all_row_cells[0]:
                first_row_last_cell_attrs = all_row_cells[0][-1][0]
                style_match = re.search(r'style="([^"]*)"', first_row_last_cell_attrs)
                if style_match:
                    styles = parse_style_attribute(style_match.group(1))
                    info["table_border_right"] = normalize_border(styles.get("border-right"))

        first_row = True
        first_cell_processed = False

        for row_content in rows:
            cells = re.findall(r"<td([^>]*)>(.*?)</td>", row_content, re.DOTALL)

            if first_row:
                info["cols"] = len(cells)
                first_row = False

            for cell_attrs, cell_content in cells:
                cell_text = re.sub(r"<[^>]+>", "", cell_content).strip()
                info["cells"].append(cell_text)

                colspan_match = re.search(r'colspan="(\d+)"', cell_attrs)
                if colspan_match and int(colspan_match.group(1)) > 1:
                    info["has_colspan"] = True

                rowspan_match = re.search(r'rowspan="(\d+)"', cell_attrs)
                if rowspan_match and int(rowspan_match.group(1)) > 1:
                    info["has_rowspan"] = True

                if not first_cell_processed:
                    cell_style_match = re.search(r'style="([^"]*)"', cell_attrs)
                    if cell_style_match:
                        cell_styles = parse_style_attribute(cell_style_match.group(1))

                        info["cell_border_top"] = normalize_border(cell_styles.get("border-top"))
                        info["cell_border_bottom"] = normalize_border(
                            cell_styles.get("border-bottom")
                        )
                        info["cell_border_left"] = normalize_border(cell_styles.get("border-left"))
                        info["cell_border_right"] = normalize_border(
                            cell_styles.get("border-right")
                        )
                        info["cell_bg"] = normalize_color(cell_styles.get("background-color"))
                        info["cell_valign"] = cell_styles.get("vertical-align")
                        info["cell_width"] = normalize_dimension(cell_styles.get("width"))

                    span_match = re.search(r'<span\s+style="([^"]*)"', cell_content)
                    if span_match:
                        text_styles = parse_style_attribute(span_match.group(1))

                        if text_styles.get("font-weight") == "bold":
                            info["text_bold"] = True

                        if text_styles.get("font-style") == "italic":
                            info["text_italic"] = True

                        text_decoration = text_styles.get("text-decoration", "")
                        if "underline" in text_decoration:
                            if "double" in text_decoration:
                                info["text_underline"] = "double"
                            elif "wavy" in text_decoration:
                                info["text_underline"] = "wavy"
                            else:
                                info["text_underline"] = True

                        info["text_color"] = normalize_color(text_styles.get("color"))
                        info["text_size"] = text_styles.get("font-size")

                        font_family = text_styles.get("font-family")
                        if font_family:
                            font_family = font_family.replace("'", "").replace('"', "")
                            info["text_font"] = font_family.split(",")[0].strip()

                    first_cell_processed = True

        tables.append(info)

    return tables


def extract_paragraphs_from_html(html: str) -> list[dict[str, Any]]:
    """Extract detailed paragraph information from HTML output."""
    paragraphs: list[dict[str, Any]] = []

    para_pattern = re.compile(r"<p([^>]*)>(.*?)</p>", re.DOTALL)

    for para_match in para_pattern.finditer(html):
        para_attrs = para_match.group(1)
        para_content = para_match.group(2)

        info: dict[str, Any] = {
            "text_bold": False,
            "text_italic": False,
            "text_underline": False,
            "text_strike": False,
            "text_color": None,
            "text_size": None,
            "text_font": None,
            "text_highlight": None,
            "para_align": None,
            "para_margin_left": None,
            "para_margin_top": None,
            "para_margin_bottom": None,
            "para_line_height": None,
            "list_marker": None,
            "list_indent": None,
            "has_hanging_indent": False,
            "text_content": "",
        }

        para_style_match = re.search(r'style="([^"]*)"', para_attrs)
        if para_style_match:
            para_styles = parse_style_attribute(para_style_match.group(1))
            info["para_align"] = para_styles.get("text-align")
            info["para_margin_left"] = normalize_dimension(para_styles.get("margin-left"))
            info["para_margin_top"] = normalize_dimension(para_styles.get("margin-top"))
            info["para_margin_bottom"] = normalize_dimension(para_styles.get("margin-bottom"))
            info["para_line_height"] = para_styles.get("line-height")

            text_indent = para_styles.get("text-indent", "")
            if text_indent.startswith("-"):
                info["has_hanging_indent"] = True

        marker_match = re.search(r'<span class="list-marker"[^>]*>([^<]*)</span>', para_content)
        if marker_match:
            info["list_marker"] = marker_match.group(1)
            info["list_indent"] = info["para_margin_left"]

        text_only = re.sub(r"<[^>]+>", "", para_content).strip()
        info["text_content"] = text_only

        span_match = re.search(r"<span\s+style=\"([^\"]*)\"", para_content)
        if span_match:
            text_styles = parse_style_attribute(span_match.group(1))

            if text_styles.get("font-weight") == "bold":
                info["text_bold"] = True

            if text_styles.get("font-style") == "italic":
                info["text_italic"] = True

            text_decoration = text_styles.get("text-decoration", "")
            if "underline" in text_decoration:
                if "double" in text_decoration:
                    info["text_underline"] = "double"
                elif "wavy" in text_decoration:
                    info["text_underline"] = "wavy"
                else:
                    info["text_underline"] = True

            if "line-through" in text_decoration:
                info["text_strike"] = True

            info["text_color"] = normalize_color(text_styles.get("color"))
            info["text_size"] = normalize_dimension(text_styles.get("font-size"))
            info["text_highlight"] = normalize_color(text_styles.get("background-color"))

            font_family = text_styles.get("font-family")
            if font_family:
                font_family = font_family.replace("'", "").replace('"', "")
                info["text_font"] = font_family.split(",")[0].strip()

        paragraphs.append(info)

    return paragraphs


def detect_test_type(expected: dict[str, Any]) -> str:
    """Detect whether a test is for tables, paragraphs, or lists."""
    table_keys = {
        "rows",
        "cols",
        "cells",
        "has_colspan",
        "has_rowspan",
        "table_border_top",
        "table_border_bottom",
        "cell_border_top",
        "cell_bg",
    }
    list_keys = {"list_marker", "list_indent", "has_hanging_indent"}

    exp_keys = set(expected.keys())

    if exp_keys & table_keys:
        return "table"
    if exp_keys & list_keys:
        return "list"

    return "paragraph"


def verify_test(test: dict[str, Any], content_info: dict[str, Any]) -> tuple[bool, list[str]]:
    """Verify a single test against content info.

    Returns (passed, list of failure messages).
    """
    expected = test["expected"]
    failures: list[str] = []

    for key, expected_value in expected.items():
        if key not in content_info:
            failures.append(f"Unknown expected property: {key}")
            continue

        actual_value = content_info[key]

        if key == "cells":
            if isinstance(expected_value, list):
                if len(expected_value) != len(actual_value):
                    failures.append(
                        f"Cell count mismatch: expected {len(expected_value)}, "
                        f"got {len(actual_value)}"
                    )
                else:
                    for i, (exp_cell, act_cell) in enumerate(
                        zip(expected_value, actual_value, strict=True)
                    ):
                        if exp_cell != act_cell:
                            failures.append(
                                f"Cell {i} mismatch: expected '{exp_cell}', got '{act_cell}'"
                            )

        elif key.endswith(("_border_top", "_border_bottom", "_border_left", "_border_right")):
            exp_normalized = normalize_border(expected_value)
            act_normalized = normalize_border(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        elif key in ("cell_bg", "text_color"):
            exp_normalized = normalize_color(expected_value)
            act_normalized = normalize_color(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        elif key in ("table_width", "cell_width", "text_size"):
            exp_normalized = normalize_dimension(expected_value)
            act_normalized = normalize_dimension(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        elif expected_value != actual_value:
            failures.append(f"{key}: expected {repr(expected_value)}, got {repr(actual_value)}")

    return len(failures) == 0, failures


# =============================================================================
# Test Collection
# =============================================================================


def get_tagged_test_files() -> list[Path]:
    """Get all tagged test DOCX files."""
    if not TAGGED_TESTS_DIR.exists():
        return []
    # image_tests.docx uses image-specific assertions (image_type, width, height)
    # which require different validation than text formatting tests.
    # Image output is verified via output_verification instead.
    excluded = {"image_tests.docx"}
    return sorted(f for f in TAGGED_TESTS_DIR.glob("*_tests*.docx") if f.name not in excluded)


def collect_all_tests() -> list[tuple[Path, dict[str, Any]]]:
    """Collect all tests from all tagged test files."""
    all_tests: list[tuple[Path, dict[str, Any]]] = []

    for docx_file in get_tagged_test_files():
        tests = extract_tests_from_docx(docx_file)
        for test in tests:
            all_tests.append((docx_file, test))

    return all_tests


# Collect tests at module load time for parametrization
ALL_TAGGED_TESTS = collect_all_tests()


# =============================================================================
# Pytest Tests
# =============================================================================


@pytest.mark.parametrize(
    "docx_file,test_def",
    [
        pytest.param(docx_file, test_def, id=f"{docx_file.stem}::Test#{test_def['number']}")
        for docx_file, test_def in ALL_TAGGED_TESTS
    ],
)
def test_tagged_format(docx_file: Path, test_def: dict[str, Any]) -> None:
    """Verify a tagged test from a DOCX file."""
    html = docx_to_html(docx_file)
    tables = extract_tables_from_html(html)
    paragraphs = extract_paragraphs_from_html(html)

    test_type = detect_test_type(test_def["expected"])

    if test_type == "table":
        if test_def["table_index"] is None:
            pytest.fail(f"Test #{test_def['number']}: No table found for this test")

        if test_def["table_index"] >= len(tables):
            pytest.fail(
                f"Test #{test_def['number']}: Table index {test_def['table_index']} out of range"
            )

        content_info = tables[test_def["table_index"]]
    else:
        # Paragraph/list test
        content_info = None

        test_header_idx = None
        for i, para in enumerate(paragraphs):
            if para["text_content"].startswith(f"Test #{test_def['number']}:"):
                test_header_idx = i
                break

        if test_header_idx is not None:
            expected_marker = test_def["expected"].get("list_marker")
            expected_indent = test_def["expected"].get("list_indent")

            found_expected = False
            for para in paragraphs[test_header_idx + 1 :]:
                text = para["text_content"]

                if not text:
                    continue

                if text.startswith("Test #"):
                    break

                if text.startswith("Expected:"):
                    found_expected = True
                    continue

                if not found_expected:
                    continue

                if expected_marker or expected_indent:
                    if para["list_marker"]:
                        if expected_marker and para["list_marker"] == expected_marker:
                            content_info = para
                            break
                        elif expected_indent and para["list_indent"] == expected_indent:
                            content_info = para
                            break
                        elif not expected_marker and not expected_indent:
                            content_info = para
                            break
                else:
                    content_info = para
                    break

        if content_info is None:
            pytest.fail(f"Test #{test_def['number']}: No matching paragraph found")

    success, failures = verify_test(test_def, content_info)

    if not success:
        failure_msg = f"Test #{test_def['number']}: {test_def['name']}\n"
        failure_msg += "\n".join(f"  - {f}" for f in failures)
        pytest.fail(failure_msg)


class TestTaggedTestDiscovery:
    """Tests for tagged test discovery and structure."""

    def test_tagged_test_files_exist(self) -> None:
        """At least one tagged test file exists."""
        files = get_tagged_test_files()
        assert len(files) > 0, "No tagged test files found"

    def test_all_tests_have_expected_values(self) -> None:
        """All tests have expected values defined."""
        for docx_file, test_def in ALL_TAGGED_TESTS:
            assert test_def["expected"], (
                f"{docx_file.stem}::Test#{test_def['number']} has no expected values"
            )

    def test_test_numbers_are_sequential(self) -> None:
        """Test numbers are sequential within each file."""
        for docx_file in get_tagged_test_files():
            tests = extract_tests_from_docx(docx_file)
            numbers = [t["number"] for t in tests]
            expected = list(range(1, len(numbers) + 1))
            assert numbers == expected, (
                f"{docx_file.stem}: Test numbers {numbers} should be {expected}"
            )
