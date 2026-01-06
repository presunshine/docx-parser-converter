#!/usr/bin/env python3
"""
Verify tests using the Test #N format.

Test format in DOCX:
    Test #1: {Test Name}
    {Description of what styles/properties to expect}
    Expected: {JSON with expected properties}

    [CONTENT TO TEST - table, paragraph, list, etc.]

    Test #2: {Next Test Name}
    ...

Expected JSON properties:

=== TABLE TESTS ===
Structure:
    - rows: int - number of rows
    - cols: int - number of columns (in first row)
    - cells: list[str] - expected cell text contents in order
    - has_colspan: bool - whether any cell has colspan > 1
    - has_rowspan: bool - whether any cell has rowspan > 1

Table styles:
    - table_border_top: str - e.g., "1pt solid #000000" or "none"
    - table_border_bottom: str
    - table_border_left: str
    - table_border_right: str
    - table_width: str - e.g., "100%" or "500pt"

Cell styles (first cell):
    - cell_border_*: str - border styles
    - cell_bg: str - background color e.g., "#FFFF00"

=== PARAGRAPH/TEXT TESTS ===
Text styles (first paragraph after test header):
    - text_bold: bool
    - text_italic: bool
    - text_underline: bool or str ("double", "wavy", etc.)
    - text_strike: bool
    - text_color: str - e.g., "#FF0000"
    - text_size: str - e.g., "12pt"
    - text_font: str - e.g., "Arial"
    - text_highlight: str - highlight color e.g., "#FFFF00"

Paragraph styles:
    - para_align: str - "left", "center", "right", "justify"
    - para_margin_left: str - e.g., "36pt"
    - para_margin_top: str
    - para_margin_bottom: str
    - para_line_height: str

=== LIST TESTS ===
    - list_marker: str - the bullet/number marker text
    - list_indent: str - margin-left value e.g., "36pt"
    - has_hanging_indent: bool - whether text-indent is negative
"""

import json
import re
import sys
from pathlib import Path

# Add the package to path
sys.path.insert(0, str(Path(__file__).parent.parent / "docx_parser_converter_python"))

from api import _parse_docx, docx_to_html  # noqa: F401


def extract_tests_from_docx(docx_path: str) -> list[dict]:
    """Extract test definitions from DOCX file.

    Returns list of tests with:
        - name: test name
        - description: test description
        - expected: parsed JSON of expected properties
        - table_index: which table (0-indexed) belongs to this test
    """
    doc, _ = _parse_docx(docx_path)

    tests = []
    current_test = None
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
                # Save previous test if exists
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
                except json.JSONDecodeError as e:
                    print(f"Warning: Invalid JSON in test #{current_test['number']}: {e}")
                continue

            # If we have a current test and this is description text
            if current_test and text and not current_test["description"]:
                current_test["description"] = text

        # Check if it's a table (has 'tr' for table rows)
        elif hasattr(item, "tr"):
            if current_test and current_test["table_index"] is None:
                current_test["table_index"] = table_index
            table_index += 1

    # Don't forget the last test
    if current_test:
        tests.append(current_test)

    return tests


def parse_style_attribute(style_str: str) -> dict[str, str]:
    """Parse a style attribute string into a dict."""
    styles = {}
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

    # Remove extra spaces
    border_str = " ".join(border_str.split())

    # Normalize pt values: "1.0pt" -> "1pt", "0.5pt" stays as "0.5pt"
    def normalize_pt(match: re.Match) -> str:
        value = float(match.group(1))
        if value == int(value):
            return f"{int(value)}pt"
        return f"{value}pt"

    border_str = re.sub(r"(\d+\.?\d*)pt", normalize_pt, border_str)

    # Normalize color to uppercase
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
    """Normalize dimension string for comparison (handles pt and %)."""
    if not dim_str:
        return None

    dim_str = dim_str.strip()

    # Normalize percentage values: "100.0%" -> "100%"
    pct_match = re.match(r"^(\d+\.?\d*)%$", dim_str)
    if pct_match:
        value = float(pct_match.group(1))
        if value == int(value):
            return f"{int(value)}%"
        return f"{value}%"

    # Normalize pt values: "100.0pt" -> "100pt"
    pt_match = re.match(r"^(\d+\.?\d*)pt$", dim_str)
    if pt_match:
        value = float(pt_match.group(1))
        if value == int(value):
            return f"{int(value)}pt"
        return f"{value}pt"

    return dim_str


def extract_paragraphs_from_html(html: str) -> list[dict]:
    """Extract detailed paragraph information from HTML output."""
    paragraphs = []

    # Find all paragraphs
    para_pattern = re.compile(r"<p([^>]*)>(.*?)</p>", re.DOTALL)

    for para_match in para_pattern.finditer(html):
        para_attrs = para_match.group(1)
        para_content = para_match.group(2)

        info = {
            # Text styles
            "text_bold": False,
            "text_italic": False,
            "text_underline": False,
            "text_strike": False,
            "text_color": None,
            "text_size": None,
            "text_font": None,
            "text_highlight": None,
            # Paragraph styles
            "para_align": None,
            "para_margin_left": None,
            "para_margin_top": None,
            "para_margin_bottom": None,
            "para_line_height": None,
            # List properties
            "list_marker": None,
            "list_indent": None,
            "has_hanging_indent": False,
            # Content
            "text_content": "",
        }

        # Parse paragraph styles
        para_style_match = re.search(r'style="([^"]*)"', para_attrs)
        if para_style_match:
            para_styles = parse_style_attribute(para_style_match.group(1))
            info["para_align"] = para_styles.get("text-align")
            info["para_margin_left"] = normalize_dimension(para_styles.get("margin-left"))
            info["para_margin_top"] = normalize_dimension(para_styles.get("margin-top"))
            info["para_margin_bottom"] = normalize_dimension(para_styles.get("margin-bottom"))
            info["para_line_height"] = para_styles.get("line-height")

            # Check for hanging indent (negative text-indent)
            text_indent = para_styles.get("text-indent", "")
            if text_indent.startswith("-"):
                info["has_hanging_indent"] = True

        # Check for list marker (preserve whitespace)
        marker_match = re.search(r'<span class="list-marker"[^>]*>([^<]*)</span>', para_content)
        if marker_match:
            # Keep the marker as-is (including tabs)
            info["list_marker"] = marker_match.group(1)
            info["list_indent"] = info["para_margin_left"]

        # Extract text content
        text_only = re.sub(r"<[^>]+>", "", para_content).strip()
        info["text_content"] = text_only

        # Extract text styles from first span
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


def extract_tables_from_html(html: str) -> list[dict]:
    """Extract detailed table information from HTML output."""
    tables = []

    # Find all tables with their full HTML
    table_pattern = re.compile(r"<table([^>]*)>(.*?)</table>", re.DOTALL)

    for table_match in table_pattern.finditer(html):
        table_attrs = table_match.group(1)
        table_content = table_match.group(2)

        info = {
            # Structure
            "rows": 0,
            "cols": 0,
            "cells": [],
            "has_colspan": False,
            "has_rowspan": False,
            # Table styles
            "table_border_top": "none",
            "table_border_bottom": "none",
            "table_border_left": "none",
            "table_border_right": "none",
            "table_width": None,
            # Cell styles (first cell)
            "cell_border_top": "none",
            "cell_border_bottom": "none",
            "cell_border_left": "none",
            "cell_border_right": "none",
            "cell_bg": None,
            "cell_valign": None,
            "cell_width": None,
            # Text styles (first text in first cell)
            "text_bold": False,
            "text_italic": False,
            "text_underline": False,
            "text_color": None,
            "text_size": None,
            "text_font": None,
        }

        # Parse table styles
        table_style_match = re.search(r'style="([^"]*)"', table_attrs)
        if table_style_match:
            table_styles = parse_style_attribute(table_style_match.group(1))
            info["table_width"] = normalize_dimension(table_styles.get("width"))

        # Count rows and extract cells
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_content, re.DOTALL)
        info["rows"] = len(rows)

        # Parse all cells to get their styles for outer border detection
        all_row_cells: list[list[tuple[str, str]]] = []
        for row_content in rows:
            cells = re.findall(r"<td([^>]*)>(.*?)</td>", row_content, re.DOTALL)
            all_row_cells.append(cells)

        # Extract outer borders from edge cells
        # (outer borders are now applied to edge cells, not the table element)
        if all_row_cells:
            # Top border: from first row, first cell
            if all_row_cells[0]:
                first_cell_attrs = all_row_cells[0][0][0]
                style_match = re.search(r'style="([^"]*)"', first_cell_attrs)
                if style_match:
                    styles = parse_style_attribute(style_match.group(1))
                    info["table_border_top"] = normalize_border(styles.get("border-top"))
                    info["table_border_left"] = normalize_border(styles.get("border-left"))

            # Bottom border: from last row, first cell
            if all_row_cells[-1]:
                last_row_first_cell_attrs = all_row_cells[-1][0][0]
                style_match = re.search(r'style="([^"]*)"', last_row_first_cell_attrs)
                if style_match:
                    styles = parse_style_attribute(style_match.group(1))
                    info["table_border_bottom"] = normalize_border(styles.get("border-bottom"))

            # Right border: from first row, last cell
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
                # Extract text content (strip HTML tags for cell text)
                cell_text = re.sub(r"<[^>]+>", "", cell_content).strip()
                info["cells"].append(cell_text)

                # Check for colspan/rowspan
                colspan_match = re.search(r'colspan="(\d+)"', cell_attrs)
                if colspan_match and int(colspan_match.group(1)) > 1:
                    info["has_colspan"] = True

                rowspan_match = re.search(r'rowspan="(\d+)"', cell_attrs)
                if rowspan_match and int(rowspan_match.group(1)) > 1:
                    info["has_rowspan"] = True

                # Process first cell styles
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

                    # Extract text styles from first span in cell
                    span_match = re.search(r'<span\s+style="([^"]*)"', cell_content)
                    if span_match:
                        text_styles = parse_style_attribute(span_match.group(1))

                        # Bold
                        if text_styles.get("font-weight") == "bold":
                            info["text_bold"] = True

                        # Italic
                        if text_styles.get("font-style") == "italic":
                            info["text_italic"] = True

                        # Underline
                        text_decoration = text_styles.get("text-decoration", "")
                        if "underline" in text_decoration:
                            if "double" in text_decoration:
                                info["text_underline"] = "double"
                            elif "wavy" in text_decoration:
                                info["text_underline"] = "wavy"
                            elif "dotted" in text_decoration:
                                info["text_underline"] = "dotted"
                            elif "dashed" in text_decoration:
                                info["text_underline"] = "dashed"
                            else:
                                info["text_underline"] = True

                        # Color
                        info["text_color"] = normalize_color(text_styles.get("color"))

                        # Font size
                        info["text_size"] = text_styles.get("font-size")

                        # Font family
                        font_family = text_styles.get("font-family")
                        if font_family:
                            # Remove quotes and get first font
                            font_family = font_family.replace("'", "").replace('"', "")
                            info["text_font"] = font_family.split(",")[0].strip()

                    first_cell_processed = True

        tables.append(info)

    return tables


def verify_test(test: dict, table_info: dict) -> tuple[bool, list[str]]:
    """Verify a single test against table info.

    Returns (passed, list of failure messages).
    """
    expected = test["expected"]
    failures = []

    for key, expected_value in expected.items():
        if key not in table_info:
            failures.append(f"Unknown expected property: {key}")
            continue

        actual_value = table_info[key]

        # Special handling for cells - check contents match
        if key == "cells":
            if isinstance(expected_value, list):
                if len(expected_value) != len(actual_value):
                    failures.append(
                        f"Cell count mismatch: expected {len(expected_value)}, got {len(actual_value)}"
                    )
                else:
                    for i, (exp_cell, act_cell) in enumerate(zip(expected_value, actual_value)):
                        if exp_cell != act_cell:
                            failures.append(
                                f"Cell {i} mismatch: expected '{exp_cell}', got '{act_cell}'"
                            )

        # Border comparison (normalize both)
        elif (
            key.endswith("_border_top")
            or key.endswith("_border_bottom")
            or key.endswith("_border_left")
            or key.endswith("_border_right")
        ):
            exp_normalized = normalize_border(expected_value)
            act_normalized = normalize_border(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        # Color comparison (case-insensitive)
        elif key in ("cell_bg", "text_color"):
            exp_normalized = normalize_color(expected_value)
            act_normalized = normalize_color(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        # Dimension comparison (normalize pt and % values)
        elif key in ("table_width", "cell_width", "text_size"):
            exp_normalized = normalize_dimension(expected_value)
            act_normalized = normalize_dimension(actual_value)
            if exp_normalized != act_normalized:
                failures.append(f"{key}: expected '{exp_normalized}', got '{act_normalized}'")

        # Direct comparison for everything else
        elif expected_value != actual_value:
            failures.append(f"{key}: expected {repr(expected_value)}, got {repr(actual_value)}")

    return len(failures) == 0, failures


def detect_test_type(expected: dict) -> str:
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
    para_keys = {"para_align", "para_margin_left", "para_margin_top", "para_line_height"}

    exp_keys = set(expected.keys())

    if exp_keys & table_keys:
        return "table"
    if exp_keys & list_keys:
        return "list"
    if exp_keys & para_keys:
        return "paragraph"

    # Default to paragraph for text-only tests
    return "paragraph"


def verify_docx_file(docx_path: str, verbose: bool = False) -> tuple[int, int]:
    """Verify all tests in a DOCX file.

    Returns (passed_count, total_count).
    """
    print(f"\n{'=' * 60}")
    print(f"  Verifying: {Path(docx_path).name}")
    print(f"{'=' * 60}\n")

    # Extract tests from DOCX
    tests = extract_tests_from_docx(docx_path)

    if not tests:
        print("  No tests found in document.")
        return 0, 0

    # Convert to HTML and extract content info
    html = docx_to_html(docx_path)
    tables = extract_tables_from_html(html)
    paragraphs = extract_paragraphs_from_html(html)

    # Count test types
    table_tests = sum(1 for t in tests if detect_test_type(t["expected"]) == "table")
    para_tests = len(tests) - table_tests

    print(f"  Found {len(tests)} tests ({table_tests} table, {para_tests} paragraph/list)")
    print(f"  Extracted {len(tables)} tables, {len(paragraphs)} paragraphs\n")

    passed = 0
    total = len(tests)

    for test in tests:
        test_name = f"Test #{test['number']}: {test['name']}"
        test_type = detect_test_type(test["expected"])

        if test_type == "table":
            # Table test - use table_index
            if test["table_index"] is None:
                print(f"  \033[31m✗\033[0m {test_name}")
                print("      No table found for this test")
                continue

            if test["table_index"] >= len(tables):
                print(f"  \033[31m✗\033[0m {test_name}")
                print(f"      Table index {test['table_index']} out of range")
                continue

            content_info = tables[test["table_index"]]
        else:
            # Paragraph/list test - find the test content paragraph
            content_info = None

            # Find the paragraph index where this test starts
            test_header_idx = None
            for i, para in enumerate(paragraphs):
                if para["text_content"].startswith(f"Test #{test['number']}:"):
                    test_header_idx = i
                    break

            if test_header_idx is not None:
                # Look for content paragraph after the test header
                # Skip: header, description, Expected:, empty paragraphs
                expected_marker = test["expected"].get("list_marker")
                expected_indent = test["expected"].get("list_indent")

                # Find paragraphs after "Expected:" line
                found_expected = False
                for para in paragraphs[test_header_idx + 1 :]:
                    text = para["text_content"]

                    # Skip empty paragraphs
                    if not text:
                        continue

                    # Check for next test
                    if text.startswith("Test #"):
                        break

                    # Mark when we've passed "Expected:"
                    if text.startswith("Expected:"):
                        found_expected = True
                        continue

                    # Skip description (before Expected:)
                    if not found_expected:
                        continue

                    # For list tests, look for paragraphs with list markers
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
                        # For non-list tests, use first paragraph after Expected:
                        content_info = para
                        break

            if content_info is None:
                print(f"  \033[31m✗\033[0m {test_name}")
                print("      No matching paragraph found")
                continue

        success, failures = verify_test(test, content_info)

        if success:
            print(f"  \033[32m✓\033[0m {test_name}")
            passed += 1
        else:
            print(f"  \033[31m✗\033[0m {test_name}")
            for failure in failures:
                print(f"      {failure}")

        if verbose:
            print(f"      Description: {test['description']}")
            print(f"      Expected: {json.dumps(test['expected'], indent=8)}")
            relevant_actual = {k: v for k, v in content_info.items() if k in test["expected"]}
            print(f"      Actual: {json.dumps(relevant_actual, indent=8)}")

    print(f"\n{'-' * 60}")
    if passed == total:
        print(f"  \033[32mPassed: {passed}/{total}\033[0m")
    else:
        print(f"  \033[31mPassed: {passed}/{total}\033[0m")
    print(f"{'-' * 60}\n")

    return passed, total


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Verify tests in DOCX files")
    parser.add_argument("files", nargs="*", help="DOCX files to verify")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--all", action="store_true", help="Verify all *_tests.docx files")
    parser.add_argument(
        "--show-html", action="store_true", help="Show generated HTML for debugging"
    )

    args = parser.parse_args()

    # Determine files to verify
    fixtures_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"

    if args.all:
        files = list(fixtures_dir.glob("*_tests*.docx"))
    elif args.files:
        files = [Path(f) for f in args.files]
    else:
        # Default: look for all test files
        files = list(fixtures_dir.glob("*_tests*.docx"))

    if not files:
        print("No test files found.")
        print("\nUsage:")
        print("  python scripts/verify_tests.py [files...]")
        print("  python scripts/verify_tests.py --all")
        print("\nExpected test format in DOCX:")
        print("  Test #1: Test Name")
        print("  Description of what to expect")
        print('  Expected: {"text_bold": true, "list_marker": "•"}')
        print("  [CONTENT TO TEST]")
        return 1

    total_passed = 0
    total_tests = 0

    for file_path in sorted(files):
        if args.show_html:
            html = docx_to_html(str(file_path))
            print(f"\n--- HTML for {file_path.name} ---")
            print(html)
            print("--- End HTML ---\n")

        p, t = verify_docx_file(str(file_path), verbose=args.verbose)
        total_passed += p
        total_tests += t

    if len(files) > 1:
        print(f"\n{'=' * 60}")
        print("  FINAL SUMMARY")
        if total_passed == total_tests:
            print(f"  \033[32mTotal: {total_passed}/{total_tests} tests passed\033[0m")
        else:
            print(f"  \033[31mTotal: {total_passed}/{total_tests} tests passed\033[0m")
        print(f"{'=' * 60}\n")

    return 0 if total_passed == total_tests else 1


if __name__ == "__main__":
    sys.exit(main())
