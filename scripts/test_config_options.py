#!/usr/bin/env python3
"""Test different configuration options for DOCX conversion.

Creates output folders for each DOCX file with different config combinations
to verify that configuration options are being applied correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "docx_parser_converter_python"))

from api import ConversionConfig, docx_to_html, docx_to_text

# =============================================================================
# Configuration Combinations to Test
# =============================================================================

# HTML configuration combinations
HTML_CONFIGS = {
    "default": ConversionConfig(),
    "semantic_tags": ConversionConfig(use_semantic_tags=True),
    "fragment_only": ConversionConfig(fragment_only=True),
    "style_none": ConversionConfig(style_mode="none"),
    "no_responsive": ConversionConfig(responsive=False),
    "print_styles": ConversionConfig(include_print_styles=True),
    "custom_title": ConversionConfig(title="Test Document", language="de"),
    "full_options": ConversionConfig(
        use_semantic_tags=True,
        include_print_styles=True,
        title="Full Options Test",
    ),
}

# Text configuration combinations
TEXT_CONFIGS = {
    "default": ConversionConfig(),
    "markdown": ConversionConfig(text_formatting="markdown"),
    "table_ascii": ConversionConfig(table_mode="ascii"),
    "table_tabs": ConversionConfig(table_mode="tabs"),
    "table_plain": ConversionConfig(table_mode="plain"),
    "single_newline": ConversionConfig(paragraph_separator="\n"),
}


def get_docx_files(fixtures_dir: Path) -> list[Path]:
    """Get all DOCX files from fixtures directories."""
    files = []

    # Test docx files
    test_files_dir = fixtures_dir / "test_docx_files"
    if test_files_dir.exists():
        files.extend(test_files_dir.glob("*.docx"))

    # Tagged tests
    tagged_tests_dir = fixtures_dir / "tagged_tests"
    if tagged_tests_dir.exists():
        files.extend(tagged_tests_dir.glob("*.docx"))

    return sorted(files)


def run_html_tests(docx_path: Path, output_dir: Path) -> dict[str, bool]:
    """Run HTML conversion with all config combinations.

    Returns dict of config_name -> success status.
    """
    results = {}

    for config_name, config in HTML_CONFIGS.items():
        try:
            html = docx_to_html(docx_path, config=config)

            # Create output file
            output_file = output_dir / f"html_{config_name}.html"
            output_file.write_text(html, encoding="utf-8")

            results[config_name] = True
        except Exception as e:
            print(f"  ERROR [{config_name}]: {e}")
            results[config_name] = False

    return results


def run_text_tests(docx_path: Path, output_dir: Path) -> dict[str, bool]:
    """Run text conversion with all config combinations.

    Returns dict of config_name -> success status.
    """
    results = {}

    for config_name, config in TEXT_CONFIGS.items():
        try:
            text = docx_to_text(docx_path, config=config)

            # Create output file
            output_file = output_dir / f"text_{config_name}.txt"
            output_file.write_text(text, encoding="utf-8")

            results[config_name] = True
        except Exception as e:
            print(f"  ERROR [{config_name}]: {e}")
            results[config_name] = False

    return results


def main():
    """Main entry point."""
    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    fixtures_dir = project_root / "fixtures"
    output_base = project_root / "config_test_outputs"

    # Clean and create output directory
    if output_base.exists():
        import shutil

        shutil.rmtree(output_base)
    output_base.mkdir(parents=True)

    # Get all DOCX files
    docx_files = get_docx_files(fixtures_dir)

    if not docx_files:
        print("No DOCX files found in fixtures directory")
        return 1

    print(f"Found {len(docx_files)} DOCX files")
    print(f"Testing {len(HTML_CONFIGS)} HTML configs and {len(TEXT_CONFIGS)} text configs")
    print(f"Output directory: {output_base}")
    print("=" * 60)

    total_html_tests = 0
    total_text_tests = 0
    passed_html = 0
    passed_text = 0

    for docx_path in docx_files:
        # Create output folder for this file
        relative_path = docx_path.relative_to(fixtures_dir)
        folder_name = str(relative_path).replace("/", "_").replace(".docx", "")
        output_dir = output_base / folder_name
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n{docx_path.name}")

        # Run HTML tests
        html_results = run_html_tests(docx_path, output_dir)
        html_passed = sum(1 for v in html_results.values() if v)
        total_html_tests += len(html_results)
        passed_html += html_passed
        print(f"  HTML: {html_passed}/{len(html_results)} configs passed")

        # Run text tests
        text_results = run_text_tests(docx_path, output_dir)
        text_passed = sum(1 for v in text_results.values() if v)
        total_text_tests += len(text_results)
        passed_text += text_passed
        print(f"  Text: {text_passed}/{len(text_results)} configs passed")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"HTML tests: {passed_html}/{total_html_tests} passed")
    print(f"Text tests: {passed_text}/{total_text_tests} passed")
    print(f"\nOutputs saved to: {output_base}")

    # List config options tested
    print("\nHTML configs tested:")
    for name in HTML_CONFIGS:
        print(f"  - {name}")

    print("\nText configs tested:")
    for name in TEXT_CONFIGS:
        print(f"  - {name}")

    return 0 if (passed_html == total_html_tests and passed_text == total_text_tests) else 1


if __name__ == "__main__":
    sys.exit(main())
