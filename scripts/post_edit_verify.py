#!/usr/bin/env python3
"""
Post-edit verification hook for Claude Code.
Runs after Python files are modified (Write/Edit).

Reads hook input from stdin and outputs JSON for Claude feedback.
"""

import json
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.parent
PYTHON_PKG = PROJECT_DIR / "docx_parser_converter_python"


def get_uncommitted_python_files() -> list[str]:
    """Get all uncommitted Python files."""
    files = set()

    # Modified files
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    for f in result.stdout.strip().split("\n"):
        if f.endswith(".py"):
            files.add(f)

    # Staged files
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    for f in result.stdout.strip().split("\n"):
        if f.endswith(".py"):
            files.add(f)

    # Untracked files
    result = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    for f in result.stdout.strip().split("\n"):
        if f.endswith(".py"):
            files.add(f)

    return [f for f in files if f]


def run_ruff_on_files(files: list[str]) -> None:
    """Run ruff format and check on files."""
    for f in files:
        full_path = PROJECT_DIR / f
        if full_path.exists():
            subprocess.run(
                ["ruff", "format", str(full_path)],
                cwd=PYTHON_PKG,
                capture_output=True,
            )
            subprocess.run(
                ["ruff", "check", str(full_path), "--fix"],
                cwd=PYTHON_PKG,
                capture_output=True,
            )


def run_verification() -> tuple[bool, str]:
    """Run all verification checks and return (success, summary)."""
    results = []

    # 1. Pyright
    result = subprocess.run(
        ["pyright"],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=120,
    )
    pyright_ok = result.returncode == 0
    results.append(f"{'✓' if pyright_ok else '✗'} pyright")

    # 2. Ruff
    result = subprocess.run(
        ["ruff", "check", "."],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=60,
    )
    ruff_ok = result.returncode == 0
    results.append(f"{'✓' if ruff_ok else '✗'} ruff")

    # 3. Pytest
    result = subprocess.run(
        ["pytest", "-q", "--tb=no"],
        cwd=PYTHON_PKG,
        capture_output=True,
        text=True,
        timeout=180,
    )
    pytest_ok = result.returncode == 0
    # Extract test count
    for line in result.stdout.split("\n"):
        if "passed" in line:
            results.append(f"{'✓' if pytest_ok else '✗'} pytest ({line.strip()})")
            break
    else:
        results.append(f"{'✓' if pytest_ok else '✗'} pytest")

    # 4. Output verification
    result = subprocess.run(
        ["python", "scripts/verify_outputs.py"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=120,
    )
    outputs_ok = result.returncode == 0
    results.append(f"{'✓' if outputs_ok else '✗'} output verification")

    # 5. Tagged tests
    result = subprocess.run(
        ["python", "scripts/verify_tests.py", "--all"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=120,
    )
    tagged_ok = result.returncode == 0
    results.append(f"{'✓' if tagged_ok else '✗'} tagged tests (38)")

    all_passed = pyright_ok and ruff_ok and pytest_ok and outputs_ok and tagged_ok
    summary = "Verification: " + ", ".join(results)

    return all_passed, summary


def main():
    # Read hook input from stdin
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        # No input or invalid JSON - might be manual run
        hook_input = {}

    # Get file path from hook input
    tool_input = hook_input.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only run for Python files
    if not file_path.endswith(".py"):
        sys.exit(0)

    # Get all uncommitted Python files and run ruff
    py_files = get_uncommitted_python_files()
    if py_files:
        run_ruff_on_files(py_files)

    # Run full verification
    success, summary = run_verification()

    # Output JSON for Claude feedback
    output: dict[str, object] = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": summary,
        }
    }

    if not success:
        output["decision"] = "block"
        output["reason"] = f"Verification failed: {summary}"

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
