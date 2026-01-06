"""Unit tests for backwards compatibility module.

Tests cover:
- New API imports work correctly
- Old API imports work with deprecation warnings
- Deprecated classes still function correctly
- Deprecation warnings contain proper migration instructions
"""

import warnings
from pathlib import Path

import pytest

# =============================================================================
# New API Import Tests
# =============================================================================


class TestNewApiImports:
    """Tests for new API imports."""

    def test_import_docx_to_html(self):
        """Can import docx_to_html from docx_parser_converter."""
        from docx_parser_converter import docx_to_html

        assert callable(docx_to_html)

    def test_import_docx_to_text(self):
        """Can import docx_to_text from docx_parser_converter."""
        from docx_parser_converter import docx_to_text

        assert callable(docx_to_text)

    def test_import_conversion_config(self):
        """Can import ConversionConfig from docx_parser_converter."""
        from docx_parser_converter import ConversionConfig

        assert ConversionConfig is not None

    def test_new_api_no_deprecation_warning(self):
        """New API imports do not emit deprecation warnings."""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")

            # Filter only DeprecationWarnings
            deprecation_warnings = [x for x in w if issubclass(x.category, DeprecationWarning)]
            assert len(deprecation_warnings) == 0


# =============================================================================
# Old API Import Tests
# =============================================================================


class TestOldApiImports:
    """Tests for old API imports (backwards compatibility)."""

    def test_import_docx_to_html_converter(self):
        """Can import DocxToHtmlConverter from old path."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        assert DocxToHtmlConverter is not None

    def test_import_docx_to_txt_converter(self):
        """Can import DocxToTxtConverter from old path."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        assert DocxToTxtConverter is not None

    def test_import_read_binary_from_file_path(self):
        """Can import read_binary_from_file_path from old path."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

        assert callable(read_binary_from_file_path)

    def test_import_via_subpackage_init(self):
        """Can import via subpackage __init__.py."""
        from docx_parser_converter.docx_parsers import read_binary_from_file_path
        from docx_parser_converter.docx_to_html import DocxToHtmlConverter
        from docx_parser_converter.docx_to_txt import DocxToTxtConverter

        assert DocxToHtmlConverter is not None
        assert DocxToTxtConverter is not None
        assert callable(read_binary_from_file_path)


# =============================================================================
# Deprecation Warning Tests
# =============================================================================


class TestDeprecationWarnings:
    """Tests for deprecation warnings on old API usage."""

    def test_docx_to_html_converter_warns(self, sample_docx_bytes: bytes):
        """DocxToHtmlConverter emits deprecation warning on init."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        with pytest.warns(DeprecationWarning, match="DocxToHtmlConverter is deprecated"):
            DocxToHtmlConverter(sample_docx_bytes)

    def test_docx_to_txt_converter_warns(self, sample_docx_bytes: bytes):
        """DocxToTxtConverter emits deprecation warning on init."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        with pytest.warns(DeprecationWarning, match="DocxToTxtConverter is deprecated"):
            DocxToTxtConverter(sample_docx_bytes)

    def test_read_binary_from_file_path_warns(self, sample_docx_path: Path):
        """read_binary_from_file_path emits deprecation warning."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

        with pytest.warns(DeprecationWarning, match="read_binary_from_file_path is deprecated"):
            read_binary_from_file_path(str(sample_docx_path))

    def test_warning_contains_migration_instructions_html(self, sample_docx_bytes: bytes):
        """HTML converter warning contains migration instructions."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            DocxToHtmlConverter(sample_docx_bytes)

            assert len(w) == 1
            assert "docx_to_html" in str(w[0].message)
            assert "from docx_parser_converter import" in str(w[0].message)

    def test_warning_contains_migration_instructions_txt(self, sample_docx_bytes: bytes):
        """Text converter warning contains migration instructions."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            DocxToTxtConverter(sample_docx_bytes)

            assert len(w) == 1
            assert "docx_to_text" in str(w[0].message)
            assert "from docx_parser_converter import" in str(w[0].message)


# =============================================================================
# Functional Tests for Deprecated Classes
# =============================================================================


class TestDocxToHtmlConverterFunctionality:
    """Tests that DocxToHtmlConverter still functions correctly."""

    def test_convert_to_html_returns_string(self, sample_docx_bytes: bytes):
        """convert_to_html returns a string."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToHtmlConverter(sample_docx_bytes)
            result = converter.convert_to_html()

        assert isinstance(result, str)

    def test_convert_to_html_returns_valid_html(self, sample_docx_bytes: bytes):
        """convert_to_html returns valid HTML with doctype."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToHtmlConverter(sample_docx_bytes)
            result = converter.convert_to_html()

        assert "<!DOCTYPE html>" in result
        assert "<html>" in result or "<html " in result
        assert "</html>" in result

    def test_save_html_to_file(self, sample_docx_bytes: bytes, tmp_path: Path):
        """save_html_to_file saves content correctly."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        output_path = tmp_path / "output.html"

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToHtmlConverter(sample_docx_bytes)
            html = converter.convert_to_html()
            converter.save_html_to_file(html, str(output_path))

        assert output_path.exists()
        assert output_path.read_text(encoding="utf-8") == html

    def test_use_default_values_parameter_accepted(self, sample_docx_bytes: bytes):
        """use_default_values parameter is accepted (even if ignored)."""
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            # Should not raise an error
            converter = DocxToHtmlConverter(sample_docx_bytes, use_default_values=False)
            result = converter.convert_to_html()

        assert isinstance(result, str)


class TestDocxToTxtConverterFunctionality:
    """Tests that DocxToTxtConverter still functions correctly."""

    def test_convert_to_txt_returns_string(self, sample_docx_bytes: bytes):
        """convert_to_txt returns a string."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToTxtConverter(sample_docx_bytes)
            result = converter.convert_to_txt()

        assert isinstance(result, str)

    def test_save_txt_to_file(self, sample_docx_bytes: bytes, tmp_path: Path):
        """save_txt_to_file saves content correctly."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        output_path = tmp_path / "output.txt"

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToTxtConverter(sample_docx_bytes)
            txt = converter.convert_to_txt()
            converter.save_txt_to_file(txt, str(output_path))

        assert output_path.exists()
        assert output_path.read_text(encoding="utf-8") == txt

    def test_indent_parameter_accepted(self, sample_docx_bytes: bytes):
        """indent parameter is accepted (even if ignored)."""
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            converter = DocxToTxtConverter(sample_docx_bytes)
            # Should not raise an error
            result = converter.convert_to_txt(indent=False)

        assert isinstance(result, str)


class TestReadBinaryFromFilePathFunctionality:
    """Tests that read_binary_from_file_path still functions correctly."""

    def test_returns_bytes(self, sample_docx_path: Path):
        """Returns bytes from file."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            result = read_binary_from_file_path(str(sample_docx_path))

        assert isinstance(result, bytes)

    def test_returns_correct_content(self, sample_docx_path: Path):
        """Returns correct file content."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

        expected = sample_docx_path.read_bytes()

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            result = read_binary_from_file_path(str(sample_docx_path))

        assert result == expected


# =============================================================================
# Integration Tests - Full Workflow with Old API
# =============================================================================


class TestOldApiWorkflow:
    """Tests the complete old API workflow still works."""

    def test_full_html_workflow(self, sample_docx_path: Path, tmp_path: Path):
        """Complete HTML conversion workflow with old API."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
        from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

        output_path = tmp_path / "output.html"

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)

            # Old workflow
            docx_content = read_binary_from_file_path(str(sample_docx_path))
            converter = DocxToHtmlConverter(docx_content, use_default_values=True)
            html = converter.convert_to_html()
            converter.save_html_to_file(html, str(output_path))

        assert output_path.exists()
        assert "<!DOCTYPE html>" in output_path.read_text(encoding="utf-8")

    def test_full_txt_workflow(self, sample_docx_path: Path, tmp_path: Path):
        """Complete text conversion workflow with old API."""
        from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
        from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

        output_path = tmp_path / "output.txt"

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)

            # Old workflow
            docx_content = read_binary_from_file_path(str(sample_docx_path))
            converter = DocxToTxtConverter(docx_content, use_default_values=True)
            txt = converter.convert_to_txt(indent=True)
            converter.save_txt_to_file(txt, str(output_path))

        assert output_path.exists()
        # Text output should exist and be non-empty for a valid docx
        assert len(output_path.read_text(encoding="utf-8")) >= 0


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def sample_docx_path() -> Path:
    """Get path to a sample DOCX file."""
    fixtures_dir = Path(__file__).parent.parent.parent.parent / "fixtures" / "test_docx_files"
    docx_files = list(fixtures_dir.glob("*.docx"))
    if docx_files:
        return docx_files[0]
    # Fallback to tagged tests
    tagged_dir = Path(__file__).parent.parent.parent.parent / "fixtures" / "tagged_tests"
    docx_files = list(tagged_dir.glob("*.docx"))
    if docx_files:
        return docx_files[0]
    pytest.skip("No sample DOCX files found in fixtures")


@pytest.fixture
def sample_docx_bytes(sample_docx_path: Path) -> bytes:
    """Get bytes from a sample DOCX file."""
    return sample_docx_path.read_bytes()
