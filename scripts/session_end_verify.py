#!/usr/bin/env python3
"""
Session-end verification script for Claude Code hooks.
Runs automatically via PostToolUse hook after Python file edits.

This script runs verification checks at the end of each Claude Code session:
1. Type checking (pyright)
2. Linting (ruff)
3. Unit tests (pytest)
4. Output verification
5. Tagged tests

Runs standalone or via Claude Code PostToolUse hook.
"""

import subprocess
import sys
from pathlib import Path

# Colors for terminal output
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"

PROJECT_ROOT = Path(__file__).parent.parent
PYTHON_PKG = PROJECT_ROOT / "docx_parser_converter_python"


def run_command(cmd: list[str], cwd: Path | None = None, timeout: int = 300) -> tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        output = result.stdout + result.stderr
        return result.returncode == 0, output.strip()
    except subprocess.TimeoutExpired:
        return False, f"Command timed out after {timeout}s"
    except Exception as e:
        return False, str(e)


def check_pyright() -> bool:
    """Run pyright type checking."""
    print(f"\n{YELLOW}[1/5] Running pyright...{RESET}")
    success, output = run_command(["pyright"], cwd=PYTHON_PKG, timeout=120)

    if success:
        print(f"{GREEN}  ✓ Pyright passed{RESET}")
    else:
        print(f"{RED}  ✗ Pyright failed{RESET}")
        # Show only error summary
        for line in output.split("\n"):
            if "error" in line.lower() or "found" in line.lower():
                print(f"    {line}")

    return success


def check_ruff() -> bool:
    """Run ruff linting."""
    print(f"\n{YELLOW}[2/5] Running ruff check...{RESET}")
    success, output = run_command(["ruff", "check", "."], cwd=PYTHON_PKG, timeout=60)

    if success:
        print(f"{GREEN}  ✓ Ruff passed{RESET}")
    else:
        print(f"{RED}  ✗ Ruff found issues{RESET}")
        # Show first few issues
        lines = output.split("\n")[:10]
        for line in lines:
            if line.strip():
                print(f"    {line}")
        if len(output.split("\n")) > 10:
            print("    ... and more")

    return success


def run_pytest() -> bool:
    """Run pytest unit tests."""
    print(f"\n{YELLOW}[3/5] Running pytest...{RESET}")
    success, output = run_command(
        ["pytest", "-q", "--tb=no"],
        cwd=PYTHON_PKG,
        timeout=180,
    )

    if success:
        # Extract passed count from output
        for line in output.split("\n"):
            if "passed" in line:
                print(f"{GREEN}  ✓ {line.strip()}{RESET}")
                break
        else:
            print(f"{GREEN}  ✓ Pytest passed{RESET}")
    else:
        print(f"{RED}  ✗ Pytest failed{RESET}")
        # Show failure summary
        for line in output.split("\n"):
            if "FAILED" in line or "ERROR" in line:
                print(f"    {line}")

    return success


def verify_outputs() -> bool:
    """Run output verification script."""
    print(f"\n{YELLOW}[4/5] Verifying outputs...{RESET}")
    success, output = run_command(
        ["python", "scripts/verify_outputs.py"],
        timeout=120,
    )

    if success:
        print(f"{GREEN}  ✓ Output verification passed{RESET}")
    else:
        print(f"{RED}  ✗ Output verification failed{RESET}")
        for line in output.split("\n"):
            if "FAIL" in line or "differ" in line.lower():
                print(f"    {line}")

    return success


def verify_tagged_tests() -> bool:
    """Run tagged test verification."""
    print(f"\n{YELLOW}[5/5] Verifying tagged tests...{RESET}")
    success, output = run_command(
        ["python", "scripts/verify_tests.py", "--all"],
        timeout=120,
    )

    if success:
        # Extract summary line
        for line in output.split("\n"):
            if "Total:" in line or "Passed:" in line:
                # Remove ANSI codes for cleaner output
                clean = line.replace("\033[32m", "").replace("\033[31m", "").replace("\033[0m", "")
                print(f"{GREEN}  ✓ {clean.strip()}{RESET}")
    else:
        print(f"{RED}  ✗ Tagged tests failed{RESET}")
        for line in output.split("\n"):
            if "✗" in line:
                clean = line.replace("\033[31m", "").replace("\033[0m", "")
                print(f"    {clean}")

    return success


def main() -> int:
    """Run all verification checks."""
    print(f"\n{'=' * 60}")
    print("  Session End Verification")
    print(f"{'=' * 60}")

    results = {
        "pyright": check_pyright(),
        "ruff": check_ruff(),
        "pytest": run_pytest(),
        "outputs": verify_outputs(),
        "tagged": verify_tagged_tests(),
    }

    # Summary
    print(f"\n{'=' * 60}")
    print("  Summary")
    print(f"{'=' * 60}")

    passed = sum(results.values())
    total = len(results)

    for name, success in results.items():
        status = f"{GREEN}✓{RESET}" if success else f"{RED}✗{RESET}"
        print(f"  {status} {name}")

    print(f"\n  {passed}/{total} checks passed")

    if passed == total:
        print(f"\n{GREEN}All checks passed!{RESET}\n")
        return 0
    else:
        print(f"\n{RED}Some checks failed. Please review.{RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
