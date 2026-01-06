#!/usr/bin/env python3
"""
Pre-commit verification hook for Claude Code.
Runs before git commit commands to ensure all tests pass.

This hook:
1. Detects if the command is a git commit
2. Runs pyright, ruff, pytest
3. Runs output verification and tagged tests
4. Runs public API integration tests on all docx fixtures
5. Blocks the commit if any check fails

Reads hook input from stdin and outputs JSON for Claude feedback.
"""

import json
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.parent
PYTHON_PKG = PROJECT_DIR / "docx_parser_converter_python"
FIXTURES_DIR = PROJECT_DIR / "fixtures"


def is_git_commit_command(command: str) -> bool:
    """Check if the command is a git commit."""
    command = command.strip()
    # Match various git commit patterns
    if command.startswith("git commit"):
        return True
    if command.startswith("git ") and " commit" in command:
        return True
    return False


def run_pyright() -> tuple[bool, str]:
    """Run pyright type checking."""
    result = subprocess.run(
        ["pyright"],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.returncode == 0, result.stdout + result.stderr


def run_ruff() -> tuple[bool, str]:
    """Run ruff linting."""
    result = subprocess.run(
        ["ruff", "check", "."],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=60,
    )
    return result.returncode == 0, result.stdout + result.stderr


def run_pytest() -> tuple[bool, str, str]:
    """Run pytest and return (success, summary_line, full_output)."""
    result = subprocess.run(
        ["pytest", "-q", "--tb=short"],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=300,
    )
    # Extract test count
    summary = ""
    for line in result.stdout.split("\n"):
        if "passed" in line:
            summary = line.strip()
            break
    return result.returncode == 0, summary, result.stdout + result.stderr


def run_output_verification() -> tuple[bool, str]:
    """Run output verification script."""
    result = subprocess.run(
        ["python", "scripts/verify_outputs.py"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.returncode == 0, result.stdout + result.stderr


def run_tagged_tests() -> tuple[bool, str, str]:
    """Run tagged tests and return (success, count, full_output)."""
    result = subprocess.run(
        ["python", "scripts/verify_tests.py", "--all"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=120,
    )
    # Extract test count from output
    count = "0"
    for line in result.stdout.split("\n"):
        if "Total:" in line and "tests passed" in line:
            # Extract number like "52/52 tests passed"
            import re

            match = re.search(r"(\d+)/(\d+)", line)
            if match:
                count = match.group(2)
            break
    return result.returncode == 0, count, result.stdout + result.stderr


def run_docx_fixture_tests() -> tuple[bool, str]:
    """Run public API on all docx fixtures to verify they work."""
    # Add python package to path
    sys.path.insert(0, str(PYTHON_PKG))

    try:
        from api import docx_to_html, docx_to_text
    except ImportError as e:
        return False, f"Failed to import API: {e}"

    # Find all docx files in fixtures
    docx_files = list(FIXTURES_DIR.glob("**/*.docx"))

    if not docx_files:
        return True, "No docx fixtures found"

    errors = []
    for docx_file in docx_files:
        try:
            # Test HTML conversion
            html = docx_to_html(str(docx_file))
            if not html or "<!DOCTYPE html>" not in html:
                errors.append(f"{docx_file.name}: HTML conversion produced invalid output")
                continue

            # Test text conversion
            text = docx_to_text(str(docx_file))
            if text is None:
                errors.append(f"{docx_file.name}: Text conversion returned None")
                continue

        except Exception as e:
            errors.append(f"{docx_file.name}: {type(e).__name__}: {e}")

    if errors:
        return False, "\n".join(errors)

    return True, f"All {len(docx_files)} docx fixtures converted successfully"


def run_all_verification() -> tuple[bool, str, list[str]]:
    """Run all verification checks and return (success, summary, details)."""
    results = []
    details = []
    all_passed = True

    # 1. Pyright
    print("Running pyright...", file=sys.stderr)
    ok, output = run_pyright()
    results.append(f"{'✓' if ok else '✗'} pyright")
    if not ok:
        all_passed = False
        details.append(f"Pyright errors:\n{output}")

    # 2. Ruff
    print("Running ruff...", file=sys.stderr)
    ok, output = run_ruff()
    results.append(f"{'✓' if ok else '✗'} ruff")
    if not ok:
        all_passed = False
        details.append(f"Ruff errors:\n{output}")

    # 3. Pytest
    print("Running pytest...", file=sys.stderr)
    ok, summary, output = run_pytest()
    results.append(
        f"{'✓' if ok else '✗'} pytest ({summary})" if summary else f"{'✓' if ok else '✗'} pytest"
    )
    if not ok:
        all_passed = False
        details.append(f"Pytest failures:\n{output}")

    # 4. Output verification
    print("Running output verification...", file=sys.stderr)
    ok, output = run_output_verification()
    results.append(f"{'✓' if ok else '✗'} output verification")
    if not ok:
        all_passed = False
        details.append(f"Output verification failures:\n{output}")

    # 5. Tagged tests
    print("Running tagged tests...", file=sys.stderr)
    ok, count, output = run_tagged_tests()
    results.append(f"{'✓' if ok else '✗'} tagged tests ({count})")
    if not ok:
        all_passed = False
        details.append(f"Tagged test failures:\n{output}")

    # 6. DOCX fixture tests
    print("Running docx fixture tests...", file=sys.stderr)
    ok, output = run_docx_fixture_tests()
    results.append(f"{'✓' if ok else '✗'} docx fixtures")
    if not ok:
        all_passed = False
        details.append(f"DOCX fixture errors:\n{output}")

    summary = "Pre-commit verification: " + ", ".join(results)
    return all_passed, summary, details


def main():
    # Read hook input from stdin
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        # No input or invalid JSON - might be manual run
        hook_input = {}

    # Get command from hook input
    tool_input = hook_input.get("tool_input", {})
    command = tool_input.get("command", "")

    # Only run for git commit commands
    if not is_git_commit_command(command):
        # Not a commit, allow it
        sys.exit(0)

    print("Pre-commit hook: Running verification before commit...", file=sys.stderr)

    # Run full verification
    success, summary, details = run_all_verification()

    if success:
        # All checks passed - allow the commit
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": summary,
            }
        }
        print(json.dumps(output))
        sys.exit(0)
    else:
        # Checks failed - block the commit
        error_msg = f"{summary}\n\nDetails:\n" + "\n".join(details[:3])  # Limit details
        print(error_msg, file=sys.stderr)
        sys.exit(2)  # Exit code 2 blocks the tool


if __name__ == "__main__":
    main()
