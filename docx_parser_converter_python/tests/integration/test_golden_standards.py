"""Golden standard integration tests.

These tests compare the actual converter output against expected output files
(golden standards). This ensures that changes don't break expected behavior
and provides a reference for feature parity with the TypeScript implementation.

Golden standard files are stored alongside DOCX files with `-python` suffix:
  - {name}.docx           -> Source file
  - {name}-python.html    -> Expected HTML output
  - {name}-python.txt     -> Expected text output

To update golden standards after intentional changes:
  python scripts/verify_outputs.py --update
"""

from pathlib import Path

import pytest

from docx_parser_converter.api import docx_to_html, docx_to_text

# =============================================================================
# Paths
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
FIXTURES_DIR = PROJECT_ROOT / "fixtures"
TEST_DOCX_DIR = FIXTURES_DIR / "test_docx_files"
TAGGED_TESTS_DIR = FIXTURES_DIR / "tagged_tests"


def normalize_output(content: str) -> str:
    """Normalize output for comparison (handle whitespace differences)."""
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in content.split("\n")]
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def get_all_docx_files() -> list[Path]:
    """Get all DOCX test files from both fixture directories."""
    files = []
    if TEST_DOCX_DIR.exists():
        files.extend(TEST_DOCX_DIR.glob("*.docx"))
    if TAGGED_TESTS_DIR.exists():
        files.extend(TAGGED_TESTS_DIR.glob("*.docx"))
    return sorted(files)


def get_expected_output_path(docx_path: Path, extension: str) -> Path:
    """Get the expected output file path for a DOCX file."""
    return docx_path.parent / f"{docx_path.stem}-python{extension}"


# =============================================================================
# Parametrized Test Data
# =============================================================================

# Collect all test files with their expected outputs
TEST_FILES = []
for docx_file in get_all_docx_files():
    html_expected = get_expected_output_path(docx_file, ".html")
    txt_expected = get_expected_output_path(docx_file, ".txt")
    TEST_FILES.append(
        pytest.param(
            docx_file,
            html_expected,
            txt_expected,
            id=docx_file.stem,
        )
    )


# =============================================================================
# HTML Golden Standard Tests
# =============================================================================


class TestHTMLGoldenStandards:
    """Test HTML output against golden standards."""

    @pytest.mark.parametrize("docx_path,html_expected,_txt_expected", TEST_FILES)
    def test_html_matches_golden_standard(
        self, docx_path: Path, html_expected: Path, _txt_expected: Path
    ) -> None:
        """HTML output matches the expected golden standard."""
        if not html_expected.exists():
            pytest.skip(f"No golden standard: {html_expected.name}")

        actual = docx_to_html(docx_path)
        expected = html_expected.read_text(encoding="utf-8")

        actual_normalized = normalize_output(actual)
        expected_normalized = normalize_output(expected)

        assert actual_normalized == expected_normalized, (
            f"HTML output differs from golden standard.\n"
            f"Expected: {html_expected}\n"
            f"Run 'python scripts/verify_outputs.py --verbose' for details."
        )


# =============================================================================
# Text Golden Standard Tests
# =============================================================================


class TestTextGoldenStandards:
    """Test text output against golden standards."""

    @pytest.mark.parametrize("docx_path,_html_expected,txt_expected", TEST_FILES)
    def test_text_matches_golden_standard(
        self, docx_path: Path, _html_expected: Path, txt_expected: Path
    ) -> None:
        """Text output matches the expected golden standard."""
        if not txt_expected.exists():
            pytest.skip(f"No golden standard: {txt_expected.name}")

        actual = docx_to_text(docx_path)
        expected = txt_expected.read_text(encoding="utf-8")

        actual_normalized = normalize_output(actual)
        expected_normalized = normalize_output(expected)

        assert actual_normalized == expected_normalized, (
            f"Text output differs from golden standard.\n"
            f"Expected: {txt_expected}\n"
            f"Run 'python scripts/verify_outputs.py --verbose' for details."
        )


# =============================================================================
# Consistency Tests
# =============================================================================


class TestOutputConsistency:
    """Test that outputs are consistent across input methods."""

    @pytest.mark.parametrize("docx_path,_html_expected,_txt_expected", TEST_FILES[:3])
    def test_path_and_bytes_produce_same_html(
        self, docx_path: Path, _html_expected: Path, _txt_expected: Path
    ) -> None:
        """Path input and bytes input produce identical HTML output."""
        from_path = docx_to_html(docx_path)
        from_bytes = docx_to_html(docx_path.read_bytes())

        assert from_path == from_bytes

    @pytest.mark.parametrize("docx_path,_html_expected,_txt_expected", TEST_FILES[:3])
    def test_path_and_bytes_produce_same_text(
        self, docx_path: Path, _html_expected: Path, _txt_expected: Path
    ) -> None:
        """Path input and bytes input produce identical text output."""
        from_path = docx_to_text(docx_path)
        from_bytes = docx_to_text(docx_path.read_bytes())

        assert from_path == from_bytes

    @pytest.mark.parametrize("docx_path,_html_expected,_txt_expected", TEST_FILES[:3])
    def test_multiple_conversions_are_deterministic(
        self, docx_path: Path, _html_expected: Path, _txt_expected: Path
    ) -> None:
        """Multiple conversions of the same file produce identical output."""
        html1 = docx_to_html(docx_path)
        html2 = docx_to_html(docx_path)
        text1 = docx_to_text(docx_path)
        text2 = docx_to_text(docx_path)

        assert html1 == html2
        assert text1 == text2
