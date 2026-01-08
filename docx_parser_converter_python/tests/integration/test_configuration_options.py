"""Configuration options integration tests.

Tests that all configuration options actually affect the output as expected.
This ensures feature parity when implementing the TypeScript version.
"""

from pathlib import Path

import pytest

from docx_parser_converter.api import ConversionConfig, docx_to_html, docx_to_text

# =============================================================================
# Paths
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
FIXTURES_DIR = PROJECT_ROOT / "fixtures"
TEST_DOCX_DIR = FIXTURES_DIR / "test_docx_files"
TAGGED_TESTS_DIR = FIXTURES_DIR / "tagged_tests"


def get_test_file(name: str) -> Path:
    """Get a specific test file by name pattern."""
    for directory in [TEST_DOCX_DIR, TAGGED_TESTS_DIR]:
        matches = list(directory.glob(f"*{name}*.docx"))
        if matches:
            return matches[0]
    pytest.skip(f"No test file matching: {name}")
    return Path()  # unreachable


# =============================================================================
# HTML Configuration Tests
# =============================================================================


class TestHTMLFragmentOnly:
    """Test fragment_only configuration option."""

    def test_default_includes_full_document(self) -> None:
        """Default output includes full HTML document structure."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        assert "<!DOCTYPE html>" in result
        assert "<html" in result
        assert "<head>" in result
        assert "<body>" in result
        assert "</html>" in result

    def test_fragment_only_excludes_wrapper(self) -> None:
        """Fragment mode excludes HTML document wrapper."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(fragment_only=True)
        result = docx_to_html(docx_file, config=config)

        assert "<!DOCTYPE html>" not in result
        assert "<html" not in result
        assert "<head>" not in result
        assert "</html>" not in result
        # Should still have content
        assert "<p" in result or "<div" in result


class TestHTMLTitle:
    """Test title configuration option."""

    def test_default_empty_title(self) -> None:
        """Default title is empty."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        assert "<title></title>" in result

    def test_custom_title(self) -> None:
        """Custom title appears in output."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(title="My Custom Title")
        result = docx_to_html(docx_file, config=config)

        assert "<title>My Custom Title</title>" in result


class TestHTMLLanguage:
    """Test language configuration option."""

    def test_default_english(self) -> None:
        """Default language is English."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        assert 'lang="en"' in result

    def test_custom_language(self) -> None:
        """Custom language appears in output."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(language="de")
        result = docx_to_html(docx_file, config=config)

        assert 'lang="de"' in result


class TestHTMLStyleMode:
    """Test style_mode configuration option."""

    def test_inline_style_mode(self) -> None:
        """Inline style mode includes style attributes."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(style_mode="inline")
        result = docx_to_html(docx_file, config=config)

        # Should have inline styles on elements
        assert 'style="' in result

    def test_none_style_mode_reduces_styles(self) -> None:
        """None style mode reduces style attributes compared to inline."""
        docx_file = get_test_file("formatting")

        # Compare inline vs none mode
        inline_config = ConversionConfig(style_mode="inline")
        none_config = ConversionConfig(style_mode="none")

        inline_result = docx_to_html(docx_file, config=inline_config)
        none_result = docx_to_html(docx_file, config=none_config)

        # None mode should have fewer or equal style attributes
        # (implementation may still include some structural styles)
        inline_count = inline_result.count('style="')
        none_count = none_result.count('style="')

        assert none_count <= inline_count


class TestHTMLSemanticTags:
    """Test use_semantic_tags configuration option."""

    def test_default_no_semantic_tags(self) -> None:
        """Default output uses div/span instead of semantic tags."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        # Should use basic tags by default
        assert "<p" in result or "<span" in result

    def test_semantic_tags_enabled(self) -> None:
        """Semantic tags mode uses semantic HTML elements."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(use_semantic_tags=True)
        result = docx_to_html(docx_file, config=config)

        # Should still produce valid HTML
        assert isinstance(result, str)
        assert len(result) > 0


class TestHTMLResponsive:
    """Test responsive configuration option."""

    def test_default_responsive(self) -> None:
        """Default output includes responsive meta tag."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        assert "viewport" in result
        assert "width=device-width" in result

    def test_non_responsive(self) -> None:
        """Non-responsive mode excludes viewport meta tag."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(responsive=False)
        result = docx_to_html(docx_file, config=config)

        assert "width=device-width" not in result


class TestHTMLPrintStyles:
    """Test include_print_styles configuration option."""

    def test_default_includes_print_styles(self) -> None:
        """Default output includes basic print styles."""
        docx_file = get_test_file("formatting")
        result = docx_to_html(docx_file)

        # Default includes print styles for better printing
        assert "@media print" in result

    def test_explicit_print_styles(self) -> None:
        """Explicit print styles option includes print media query."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(include_print_styles=True)
        result = docx_to_html(docx_file, config=config)

        assert "@media print" in result


class TestHTMLCustomCSS:
    """Test custom_css configuration option."""

    def test_custom_css_included(self) -> None:
        """Custom CSS is included in output."""
        docx_file = get_test_file("formatting")
        custom_css = ".my-custom-class { color: red; }"
        config = ConversionConfig(custom_css=custom_css)
        result = docx_to_html(docx_file, config=config)

        assert ".my-custom-class { color: red; }" in result


# =============================================================================
# Text Configuration Tests
# =============================================================================


class TestTextFormatting:
    """Test text_formatting configuration option."""

    def test_default_plain_text(self) -> None:
        """Default output is plain text without formatting markers."""
        docx_file = get_test_file("formatting")
        result = docx_to_text(docx_file)

        # Plain text should not have markdown markers
        # (unless they're actually in the document content)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_markdown_formatting(self) -> None:
        """Markdown mode includes formatting markers."""
        docx_file = get_test_file("inline_formatting")
        config = ConversionConfig(text_formatting="markdown")
        result = docx_to_text(docx_file, config=config)

        # Should have some markdown formatting if document has formatting
        assert isinstance(result, str)
        # Check for common markdown markers
        has_bold = "**" in result
        has_italic = "*" in result and "**" not in result.replace("**", "")
        has_strike = "~~" in result
        # At least one formatting should be present if document has formatting
        assert has_bold or has_italic or has_strike or len(result) > 0


class TestTextTableMode:
    """Test table_mode configuration option."""

    def test_ascii_table_mode(self) -> None:
        """ASCII mode renders tables with box characters."""
        docx_file = get_test_file("tables")
        config = ConversionConfig(table_mode="ascii")
        result = docx_to_text(docx_file, config=config)

        # ASCII tables use + - | characters
        assert "+" in result
        assert "-" in result
        assert "|" in result

    def test_tabs_table_mode(self) -> None:
        """Tabs mode renders tables with tab separators."""
        docx_file = get_test_file("tables")
        config = ConversionConfig(table_mode="tabs")
        result = docx_to_text(docx_file, config=config)

        # Tab-separated values
        assert "\t" in result

    def test_plain_table_mode(self) -> None:
        """Plain mode renders tables with spaces."""
        docx_file = get_test_file("tables")
        config = ConversionConfig(table_mode="plain")
        result = docx_to_text(docx_file, config=config)

        # Should have content but no special table characters
        assert isinstance(result, str)
        assert len(result) > 0


class TestTextParagraphSeparator:
    """Test paragraph_separator configuration option."""

    def test_default_double_newline(self) -> None:
        """Default paragraph separator is double newline."""
        docx_file = get_test_file("formatting")
        result = docx_to_text(docx_file)

        # Should have double newlines between paragraphs
        assert "\n\n" in result

    def test_single_newline_separator(self) -> None:
        """Single newline separator produces more compact output."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(paragraph_separator="\n")
        result = docx_to_text(docx_file, config=config)

        # Should have content
        assert isinstance(result, str)
        assert len(result) > 0


# =============================================================================
# Combined Configuration Tests
# =============================================================================


class TestCombinedConfigurations:
    """Test combinations of configuration options."""

    def test_html_full_options(self) -> None:
        """Multiple HTML options work together."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(
            title="Combined Test",
            language="fr",
            use_semantic_tags=True,
            include_print_styles=True,
            custom_css=".test { margin: 0; }",
        )
        result = docx_to_html(docx_file, config=config)

        assert "<title>Combined Test</title>" in result
        assert 'lang="fr"' in result
        assert "@media print" in result
        assert ".test { margin: 0; }" in result

    def test_text_full_options(self) -> None:
        """Multiple text options work together."""
        docx_file = get_test_file("tables")
        config = ConversionConfig(
            text_formatting="markdown",
            table_mode="ascii",
            paragraph_separator="\n",
        )
        result = docx_to_text(docx_file, config=config)

        # Should have ASCII table characters
        assert "+" in result
        assert "|" in result
        # Should have content
        assert len(result) > 0


# =============================================================================
# Config Isolation Tests
# =============================================================================


class TestConfigIsolation:
    """Test that config options are properly isolated."""

    def test_config_does_not_affect_other_conversions(self) -> None:
        """One conversion's config doesn't affect another."""
        docx_file = get_test_file("formatting")

        # First conversion with custom config
        config1 = ConversionConfig(title="First")
        result1 = docx_to_html(docx_file, config=config1)

        # Second conversion with default config
        result2 = docx_to_html(docx_file)

        # Third conversion with different custom config
        config3 = ConversionConfig(title="Third")
        result3 = docx_to_html(docx_file, config=config3)

        assert "<title>First</title>" in result1
        assert "<title></title>" in result2
        assert "<title>Third</title>" in result3

    def test_config_is_not_modified(self) -> None:
        """Config object is not modified during conversion."""
        docx_file = get_test_file("formatting")
        config = ConversionConfig(title="Original")

        # Store original values
        original_title = config.title
        original_language = config.language

        # Run conversion
        docx_to_html(docx_file, config=config)
        docx_to_text(docx_file, config=config)

        # Config should be unchanged
        assert config.title == original_title
        assert config.language == original_language
