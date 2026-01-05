#!/usr/bin/env python3
"""
verify_outputs.py - Close-the-loop verification for DOCX converter

Compares actual converter output against expected output files.
This is the core "close-the-loop" mechanism that ensures changes
don't break expected behavior.

Usage:
    python scripts/verify_outputs.py                    # Verify all files
    python scripts/verify_outputs.py --file lists_demo  # Verify specific file
    python scripts/verify_outputs.py --update           # Update expected outputs
    python scripts/verify_outputs.py --verbose          # Show diff details
    python scripts/verify_outputs.py --html-only        # Only check HTML
    python scripts/verify_outputs.py --text-only        # Only check text
"""

import argparse
import difflib
import sys
from pathlib import Path

# Add the Python package to path
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
PYTHON_PKG = PROJECT_DIR / "docx_parser_converter_python"
sys.path.insert(0, str(PYTHON_PKG))

from api import docx_to_html, docx_to_text  # noqa: E402

# Directories
FIXTURES_DIR = PROJECT_DIR / "fixtures"
TEST_DOCX_DIR = FIXTURES_DIR / "test_docx_files"
EXPECTED_OUTPUT_DIR = FIXTURES_DIR / "outputs-python"


class Colors:
    """ANSI color codes for terminal output."""

    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    NC = "\033[0m"  # No Color


def get_test_files(specific_file: str | None = None) -> list[Path]:
    """Get list of test DOCX files to verify."""
    if specific_file:
        # Find file matching the name
        matches = list(TEST_DOCX_DIR.glob(f"*{specific_file}*.docx"))
        if not matches:
            print(f"{Colors.RED}No files matching '{specific_file}' found{Colors.NC}")
            sys.exit(1)
        return matches

    return sorted(TEST_DOCX_DIR.glob("*.docx"))


def normalize_output(content: str) -> str:
    """Normalize output for comparison (handle whitespace differences)."""
    # Normalize line endings
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    # Strip trailing whitespace from each line
    lines = [line.rstrip() for line in content.split("\n")]
    # Remove trailing empty lines
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def compare_outputs(
    expected: str, actual: str, verbose: bool = False
) -> tuple[bool, str]:
    """
    Compare expected and actual outputs.

    Returns:
        (is_match, diff_summary)
    """
    expected_normalized = normalize_output(expected)
    actual_normalized = normalize_output(actual)

    if expected_normalized == actual_normalized:
        return True, ""

    # Generate diff
    expected_lines = expected_normalized.splitlines(keepends=True)
    actual_lines = actual_normalized.splitlines(keepends=True)

    diff = list(
        difflib.unified_diff(
            expected_lines,
            actual_lines,
            fromfile="expected",
            tofile="actual",
            lineterm="",
        )
    )

    if verbose:
        diff_text = "\n".join(diff[:50])  # Limit to first 50 lines
        if len(diff) > 50:
            diff_text += f"\n... and {len(diff) - 50} more lines"
    else:
        # Count additions and deletions
        additions = sum(
            1 for line in diff if line.startswith("+") and not line.startswith("+++")
        )
        deletions = sum(
            1 for line in diff if line.startswith("-") and not line.startswith("---")
        )
        diff_text = f"{additions} additions, {deletions} deletions"

    return False, diff_text


def verify_file(
    docx_path: Path,
    check_html: bool = True,
    check_text: bool = True,
    verbose: bool = False,
    update: bool = False,
) -> dict:
    """
    Verify a single DOCX file against expected outputs.

    Returns:
        {
            "name": str,
            "html": {"status": "pass"|"fail"|"skip"|"new", "diff": str},
            "text": {"status": "pass"|"fail"|"skip"|"new", "diff": str}
        }
    """
    name = docx_path.stem
    result = {"name": name, "html": {}, "text": {}}

    # Generate outputs
    try:
        actual_html = docx_to_html(str(docx_path))
        actual_text = docx_to_text(str(docx_path))
    except Exception as e:
        result["html"] = {"status": "error", "diff": str(e)}
        result["text"] = {"status": "error", "diff": str(e)}
        return result

    # Verify HTML
    if check_html:
        html_expected_path = EXPECTED_OUTPUT_DIR / f"{name}.html"

        if update:
            html_expected_path.write_text(actual_html, encoding="utf-8")
            result["html"] = {"status": "updated", "diff": ""}
        elif html_expected_path.exists():
            expected_html = html_expected_path.read_text(encoding="utf-8")
            is_match, diff = compare_outputs(expected_html, actual_html, verbose)
            result["html"] = {"status": "pass" if is_match else "fail", "diff": diff}
        else:
            result["html"] = {"status": "new", "diff": "No expected output file"}
    else:
        result["html"] = {"status": "skip", "diff": ""}

    # Verify Text
    if check_text:
        text_expected_path = EXPECTED_OUTPUT_DIR / f"{name}.txt"

        if update:
            text_expected_path.write_text(actual_text, encoding="utf-8")
            result["text"] = {"status": "updated", "diff": ""}
        elif text_expected_path.exists():
            expected_text = text_expected_path.read_text(encoding="utf-8")
            is_match, diff = compare_outputs(expected_text, actual_text, verbose)
            result["text"] = {"status": "pass" if is_match else "fail", "diff": diff}
        else:
            result["text"] = {"status": "new", "diff": "No expected output file"}
    else:
        result["text"] = {"status": "skip", "diff": ""}

    return result


def print_result(result: dict, verbose: bool = False):
    """Print verification result for a single file."""
    name = result["name"]
    html = result["html"]
    text = result["text"]

    # Determine status icons
    status_icons = {
        "pass": f"{Colors.GREEN}✓{Colors.NC}",
        "fail": f"{Colors.RED}✗{Colors.NC}",
        "skip": f"{Colors.YELLOW}○{Colors.NC}",
        "new": f"{Colors.CYAN}?{Colors.NC}",
        "updated": f"{Colors.BLUE}↑{Colors.NC}",
        "error": f"{Colors.RED}!{Colors.NC}",
    }

    html_icon = status_icons.get(html.get("status", "skip"), "?")
    text_icon = status_icons.get(text.get("status", "skip"), "?")

    print(f"  {name}")
    print(f"    HTML: {html_icon} {html.get('status', 'skip')}", end="")
    if html.get("diff") and html.get("status") == "fail":
        print(f" ({html['diff']})", end="")
    print()

    print(f"    Text: {text_icon} {text.get('status', 'skip')}", end="")
    if text.get("diff") and text.get("status") == "fail":
        print(f" ({text['diff']})", end="")
    print()

    # Show detailed diff if verbose and failed
    if verbose:
        if html.get("status") == "fail" and html.get("diff"):
            print(f"\n    {Colors.RED}HTML Diff:{Colors.NC}")
            for line in html["diff"].split("\n"):
                print(f"      {line}")
        if text.get("status") == "fail" and text.get("diff"):
            print(f"\n    {Colors.RED}Text Diff:{Colors.NC}")
            for line in text["diff"].split("\n"):
                print(f"      {line}")


def main():
    parser = argparse.ArgumentParser(
        description="Verify DOCX converter outputs against expected files"
    )
    parser.add_argument(
        "--file", "-f", help="Specific file to verify (partial name match)"
    )
    parser.add_argument(
        "--update",
        "-u",
        action="store_true",
        help="Update expected output files with current outputs",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Show detailed diff output"
    )
    parser.add_argument(
        "--html-only", action="store_true", help="Only verify HTML output"
    )
    parser.add_argument(
        "--text-only", action="store_true", help="Only verify text output"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output results as JSON (for CI/automation)"
    )

    args = parser.parse_args()

    # Determine what to check
    check_html = not args.text_only
    check_text = not args.html_only

    # Get files to verify
    test_files = get_test_files(args.file)

    if not test_files:
        print(f"{Colors.RED}No test files found{Colors.NC}")
        sys.exit(1)

    print(f"\n{Colors.BLUE}{'=' * 50}{Colors.NC}")
    print(f"{Colors.BLUE}  DOCX Output Verification{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 50}{Colors.NC}")
    print(f"\n  Files to verify: {len(test_files)}")
    if args.update:
        print(
            f"  {Colors.YELLOW}Mode: UPDATE (will overwrite expected outputs){Colors.NC}"
        )
    print()

    # Run verification
    results = []
    passed = 0
    failed = 0
    skipped = 0
    new_files = 0
    updated = 0
    errors = 0

    for docx_path in test_files:
        result = verify_file(
            docx_path,
            check_html=check_html,
            check_text=check_text,
            verbose=args.verbose,
            update=args.update,
        )
        results.append(result)

        # Count results
        for output_type in ["html", "text"]:
            status = result[output_type].get("status", "skip")
            if status == "pass":
                passed += 1
            elif status == "fail":
                failed += 1
            elif status == "skip":
                skipped += 1
            elif status == "new":
                new_files += 1
            elif status == "updated":
                updated += 1
            elif status == "error":
                errors += 1

        if not args.json:
            print_result(result, args.verbose)

    # JSON output for CI
    if args.json:
        import json

        print(
            json.dumps(
                {
                    "results": results,
                    "summary": {
                        "passed": passed,
                        "failed": failed,
                        "skipped": skipped,
                        "new": new_files,
                        "updated": updated,
                        "errors": errors,
                    },
                },
                indent=2,
            )
        )
        sys.exit(0 if failed == 0 and errors == 0 else 1)

    # Print summary
    print(f"\n{Colors.BLUE}{'=' * 50}{Colors.NC}")
    print("  Summary:")
    print(f"    {Colors.GREEN}Passed:  {passed}{Colors.NC}")
    if failed > 0:
        print(f"    {Colors.RED}Failed:  {failed}{Colors.NC}")
    if errors > 0:
        print(f"    {Colors.RED}Errors:  {errors}{Colors.NC}")
    if new_files > 0:
        print(f"    {Colors.CYAN}New:     {new_files}{Colors.NC}")
    if updated > 0:
        print(f"    {Colors.BLUE}Updated: {updated}{Colors.NC}")
    if skipped > 0:
        print(f"    {Colors.YELLOW}Skipped: {skipped}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 50}{Colors.NC}\n")

    # Exit code
    if failed > 0 or errors > 0:
        print(f"{Colors.RED}Verification FAILED{Colors.NC}")
        sys.exit(1)
    else:
        print(f"{Colors.GREEN}Verification PASSED{Colors.NC}")
        sys.exit(0)


if __name__ == "__main__":
    main()
