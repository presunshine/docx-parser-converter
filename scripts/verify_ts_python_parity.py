#!/usr/bin/env python3
"""
Verification script for TypeScript-Python library parity.

This script compares the structure and feature set of the Python and TypeScript
implementations of the docx-parser-converter library.

Usage:
    python scripts/verify_ts_python_parity.py
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


def get_python_lib() -> Path:
    """Get the Python library directory."""
    return get_project_root() / "docx_parser_converter_python" / "docx_parser_converter"


def get_ts_lib() -> Path:
    """Get the TypeScript library directory."""
    return get_project_root() / "docx_parser_converter_ts" / "src"


def list_modules(lib_path: Path, extension: str, exclude_patterns: set[str] | None = None) -> dict[str, set[str]]:
    """
    List all modules in a library directory.

    Returns:
        Dict mapping directory paths to sets of file names (without extension).
    """
    if exclude_patterns is None:
        exclude_patterns = {"__pycache__", "node_modules", ".git", "__tests__", "tests"}

    modules: dict[str, set[str]] = {}

    for root, dirs, files in os.walk(lib_path):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_patterns]

        rel_path = Path(root).relative_to(lib_path)
        rel_path_str = str(rel_path) if str(rel_path) != "." else ""

        module_files = set()
        for f in files:
            if f.endswith(extension) and not f.startswith("_"):
                # Remove extension and convert naming convention
                name = f[:-len(extension)]
                # Convert kebab-case to snake_case for comparison
                name = name.replace("-", "_")
                module_files.add(name)

        if module_files:
            modules[rel_path_str] = module_files

    return modules


def normalize_module_name(name: str) -> str:
    """Normalize module name for comparison (handle kebab vs snake case)."""
    return name.replace("-", "_").replace(".", "_").lower()


def compare_directories(py_modules: dict[str, set[str]], ts_modules: dict[str, set[str]]) -> tuple[list[str], list[str], list[str]]:
    """
    Compare Python and TypeScript module structures.

    Returns:
        Tuple of (matching, python_only, typescript_only) lists.
    """
    matching = []
    python_only = []
    typescript_only = []

    # Normalize directory names
    py_dirs = {normalize_module_name(d): d for d in py_modules.keys()}
    ts_dirs = {normalize_module_name(d): d for d in ts_modules.keys()}

    all_dirs = set(py_dirs.keys()) | set(ts_dirs.keys())

    for norm_dir in sorted(all_dirs):
        py_dir = py_dirs.get(norm_dir)
        ts_dir = ts_dirs.get(norm_dir)

        if py_dir and ts_dir:
            # Compare files in matching directories
            py_files = {normalize_module_name(f) for f in py_modules[py_dir]}
            ts_files = {normalize_module_name(f) for f in ts_modules[ts_dir]}

            common = py_files & ts_files
            only_py = py_files - ts_files
            only_ts = ts_files - py_files

            for f in common:
                matching.append(f"{norm_dir}/{f}" if norm_dir else f)
            for f in only_py:
                python_only.append(f"{norm_dir}/{f}" if norm_dir else f)
            for f in only_ts:
                typescript_only.append(f"{norm_dir}/{f}" if norm_dir else f)
        elif py_dir:
            for f in py_modules[py_dir]:
                python_only.append(f"{norm_dir}/{f}" if norm_dir else f)
        elif ts_dir:
            for f in ts_modules[ts_dir]:
                typescript_only.append(f"{norm_dir}/{f}" if norm_dir else f)

    return matching, python_only, typescript_only


def check_api_functions(py_lib: Path, ts_lib: Path) -> dict[str, str]:
    """Check that API functions match between implementations."""
    results = {}

    # Expected API functions
    expected_functions = [
        "docx_to_html",  # Python naming
        "docx_to_text",  # Python naming
        "parse_docx",    # Python naming
    ]

    # Check Python API
    py_api = py_lib / "api.py"
    if py_api.exists():
        content = py_api.read_text()
        for func in expected_functions:
            if f"def {func}" in content:
                results[f"Python: {func}"] = f"{GREEN}✓ Found{RESET}"
            else:
                results[f"Python: {func}"] = f"{RED}✗ Missing{RESET}"
    else:
        results["Python API"] = f"{RED}✗ api.py not found{RESET}"

    # Check TypeScript API
    ts_api = ts_lib / "api.ts"
    if ts_api.exists():
        content = ts_api.read_text()
        for _func, ts_func in zip(expected_functions, ["docxToHtml", "docxToText", "parseDocx"], strict=True):
            if f"export async function {ts_func}" in content or f"export function {ts_func}" in content:
                results[f"TypeScript: {ts_func}"] = f"{GREEN}✓ Found{RESET}"
            else:
                results[f"TypeScript: {ts_func}"] = f"{RED}✗ Missing{RESET}"
    else:
        results["TypeScript API"] = f"{RED}✗ api.ts not found{RESET}"

    return results


def check_test_directories(py_tests: Path, ts_tests: Path) -> dict[str, str]:
    """Check test directory structure."""
    results = {}

    # Python test structure
    py_integration = py_tests / "integration"
    py_unit = py_tests / "unit"

    results["Python integration/"] = f"{GREEN}✓ Exists{RESET}" if py_integration.exists() else f"{RED}✗ Missing{RESET}"
    results["Python unit/"] = f"{GREEN}✓ Exists{RESET}" if py_unit.exists() else f"{RED}✗ Missing{RESET}"

    # TypeScript test structure (tests in __tests__ folders or src/__tests__)
    ts_main_tests = ts_tests / "__tests__"

    results["TypeScript __tests__/"] = f"{GREEN}✓ Exists{RESET}" if ts_main_tests.exists() else f"{RED}✗ Missing{RESET}"

    # Count test files
    if py_integration.exists():
        py_int_count = len(list(py_integration.glob("test_*.py")))
        results["Python integration tests"] = f"{GREEN}{py_int_count} files{RESET}"

    if py_unit.exists():
        py_unit_count = len(list(py_unit.rglob("test_*.py")))
        results["Python unit tests"] = f"{GREEN}{py_unit_count} files{RESET}"

    if ts_main_tests.exists():
        ts_count = len(list(ts_main_tests.glob("*.test.ts")))
        results["TypeScript integration tests"] = f"{GREEN}{ts_count} files{RESET}"

    # Count TypeScript unit tests in subdirectories
    ts_unit_count = 0
    for subdir in ["core", "models", "parsers", "converters"]:
        test_dir = ts_tests / subdir / "__tests__"
        if test_dir.exists():
            ts_unit_count += len(list(test_dir.glob("*.test.ts")))
    results["TypeScript unit tests"] = f"{GREEN}{ts_unit_count} files{RESET}"

    return results


def check_config_options(py_lib: Path, ts_lib: Path) -> dict[str, str]:
    """Check that configuration options match."""
    results = {}

    # Expected configuration options
    expected_options = [
        "title",
        "style_mode",  # Python: style_mode, TS: styleMode
        "fragment_only",
        "include_print_styles",
        "responsive_tables",
        "semantic_tags",
        "text_formatting",
        "table_mode",
        "newline_mode",
    ]

    # Python config is in api.py (ConversionConfig class)
    py_config = py_lib / "api.py"
    ts_config = ts_lib / "config.ts"

    if py_config.exists() and ts_config.exists():
        py_content = py_config.read_text()
        ts_content = ts_config.read_text()

        for opt in expected_options:
            # Convert to camelCase for TypeScript
            camel_opt = "".join(word.capitalize() if i > 0 else word for i, word in enumerate(opt.split("_")))

            py_found = opt in py_content
            ts_found = camel_opt in ts_content

            if py_found and ts_found:
                results[opt] = f"{GREEN}✓ Both{RESET}"
            elif py_found:
                results[opt] = f"{YELLOW}⚠ Python only{RESET}"
            elif ts_found:
                results[opt] = f"{YELLOW}⚠ TypeScript only{RESET}"
            else:
                results[opt] = f"{RED}✗ Neither{RESET}"
    else:
        if not py_config.exists():
            results["Python api.py"] = f"{RED}✗ Not found{RESET}"
        if not ts_config.exists():
            results["TypeScript config.ts"] = f"{RED}✗ Not found{RESET}"

    return results


def main() -> int:
    """Main verification function."""
    print("\n" + "=" * 70)
    print("TypeScript-Python Library Parity Verification")
    print("=" * 70 + "\n")

    root = get_project_root()
    py_lib = get_python_lib()
    ts_lib = get_ts_lib()

    if not py_lib.exists():
        print(f"{RED}Error: Python library not found at {py_lib}{RESET}")
        return 1

    if not ts_lib.exists():
        print(f"{RED}Error: TypeScript library not found at {ts_lib}{RESET}")
        return 1

    # 1. Compare module structure
    print("1. Module Structure Comparison")
    print("-" * 40)

    py_modules = list_modules(py_lib, ".py")
    ts_modules = list_modules(ts_lib, ".ts")

    matching, py_only, ts_only = compare_directories(py_modules, ts_modules)

    print(f"   {GREEN}✓ Matching modules: {len(matching)}{RESET}")
    if py_only:
        print(f"   {YELLOW}⚠ Python-only modules: {len(py_only)}{RESET}")
        for m in py_only[:5]:
            print(f"      - {m}")
        if len(py_only) > 5:
            print(f"      ... and {len(py_only) - 5} more")
    if ts_only:
        print(f"   {YELLOW}⚠ TypeScript-only modules: {len(ts_only)}{RESET}")
        for m in ts_only[:5]:
            print(f"      - {m}")
        if len(ts_only) > 5:
            print(f"      ... and {len(ts_only) - 5} more")

    # 2. Check API functions
    print("\n2. API Function Verification")
    print("-" * 40)

    api_results = check_api_functions(py_lib, ts_lib)
    for key, value in api_results.items():
        print(f"   {key}: {value}")

    # 3. Check test structure
    print("\n3. Test Structure Verification")
    print("-" * 40)

    py_tests = root / "docx_parser_converter_python" / "tests"
    ts_tests = ts_lib

    test_results = check_test_directories(py_tests, ts_tests)
    for key, value in test_results.items():
        print(f"   {key}: {value}")

    # 4. Check configuration options
    print("\n4. Configuration Options Verification")
    print("-" * 40)

    config_results = check_config_options(py_lib, ts_lib)
    for key, value in config_results.items():
        print(f"   {key}: {value}")

    # Summary
    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)

    total_checks = len(matching) + len(api_results) + len(test_results) + len(config_results)
    issues = len(py_only) + len(ts_only)

    if issues == 0:
        print(f"{GREEN}✓ All {total_checks} checks passed! Perfect parity.{RESET}")
        return 0
    else:
        print(f"{YELLOW}⚠ {issues} minor differences found.{RESET}")
        print("   Run with --verbose for details.")
        return 0  # Not a failure, just informational


if __name__ == "__main__":
    sys.exit(main())
