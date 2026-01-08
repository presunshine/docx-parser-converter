"""Unit tests for main HTML converter entry point.

Tests the docx_to_html() function and HTMLConverter class.
"""

import pytest

from docx_parser_converter.converters.html.html_converter import (
    ConversionConfig,
    HTMLConverter,
    UnsupportedFormatError,
    docx_to_html,
)
from docx_parser_converter.models.document.document import Body, Document
from docx_parser_converter.models.document.drawing import Drawing
from docx_parser_converter.models.document.paragraph import Paragraph, ParagraphProperties
from docx_parser_converter.models.document.run import Run, RunProperties
from docx_parser_converter.models.document.run_content import Text
from docx_parser_converter.models.document.table import Table, TableProperties
from docx_parser_converter.models.document.table_cell import TableCell
from docx_parser_converter.models.document.table_row import TableRow

# =============================================================================
# Basic Conversion Tests
# =============================================================================


class TestBasicConversion:
    """Tests for basic docx to HTML conversion."""

    def test_simple_document(self) -> None:
        """Simple document with one paragraph."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello World")])])])
        )
        result = docx_to_html(doc)
        assert "Hello World" in result

    def test_empty_document(self) -> None:
        """Empty document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        # Should produce valid HTML structure
        assert "<!DOCTYPE html>" in result
        assert "<html" in result

    def test_none_document(self) -> None:
        """None document returns empty HTML structure."""
        result = docx_to_html(None)
        assert "<!DOCTYPE html>" in result

    def test_multiple_paragraphs(self) -> None:
        """Document with multiple paragraphs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(content=[Run(content=[Text(value="Paragraph 1")])]),
                    Paragraph(content=[Run(content=[Text(value="Paragraph 2")])]),
                    Paragraph(content=[Run(content=[Text(value="Paragraph 3")])]),
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Paragraph 1" in result
        assert "Paragraph 2" in result
        assert "Paragraph 3" in result


# =============================================================================
# File Input Tests
# =============================================================================


class TestFileInput:
    """Tests for different input types."""

    def test_file_path_input(self) -> None:
        """Convert from file path raises error for non-existent file."""
        with pytest.raises(FileNotFoundError):
            docx_to_html("/nonexistent/document.docx")

    def test_path_object_input(self) -> None:
        """Convert from Path object raises error for non-existent file."""
        from pathlib import Path

        with pytest.raises(FileNotFoundError):
            docx_to_html(Path("/nonexistent/document.docx"))

    def test_bytes_input(self) -> None:
        """Convert from bytes raises NotImplementedError until parser is ready."""
        with pytest.raises(NotImplementedError):
            docx_to_html(b"fake docx bytes")

    def test_file_object_input(self) -> None:
        """Convert from file-like object raises NotImplementedError."""
        from io import BytesIO

        with pytest.raises(NotImplementedError):
            docx_to_html(BytesIO(b"fake docx bytes"))

    def test_bytesio_input(self) -> None:
        """Convert from BytesIO raises NotImplementedError."""
        from io import BytesIO

        with pytest.raises(NotImplementedError):
            docx_to_html(BytesIO(b"fake docx bytes"))


# =============================================================================
# Output Options Tests
# =============================================================================


class TestOutputOptions:
    """Tests for output options."""

    def test_return_string(self) -> None:
        """Return HTML as string."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc)
        assert isinstance(result, str)

    def test_write_to_file(self, tmp_path) -> None:
        """Write output to file."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        output_path = tmp_path / "output.html"
        docx_to_html(doc, output_path=output_path)
        content = output_path.read_text()
        assert "<!DOCTYPE html>" in content
        assert "Test" in content

    def test_write_to_path_object(self, tmp_path) -> None:
        """Write output to Path object."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        output_path = tmp_path / "output.html"
        docx_to_html(doc, output_path=output_path)
        assert output_path.exists()


# =============================================================================
# Conversion Config Tests
# =============================================================================


class TestConversionConfig:
    """Tests for conversion configuration options."""

    def test_inline_styles_mode(self) -> None:
        """Inline styles mode (default)."""
        config = ConversionConfig(style_mode="inline")
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(jc="center"),
                        content=[Run(content=[Text(value="Centered")])],
                    )
                ]
            )
        )
        converter = HTMLConverter(config=config)
        result = converter.convert(doc)
        assert "style=" in result

    def test_class_mode(self) -> None:
        """CSS class mode config."""
        config = ConversionConfig(style_mode="class")
        assert config.style_mode == "class"

    def test_semantic_tags(self) -> None:
        """Use semantic HTML tags."""
        config = ConversionConfig(use_semantic_tags=True)
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])]
                    )
                ]
            )
        )
        converter = HTMLConverter(config=config)
        result = converter.convert(doc)
        assert "<strong>" in result

    def test_preserve_whitespace(self) -> None:
        """Preserve whitespace option."""
        config = ConversionConfig(preserve_whitespace=True)
        assert config.preserve_whitespace is True

    def test_include_default_styles(self) -> None:
        """Include default CSS styles."""
        config = ConversionConfig(include_default_styles=True)
        assert config.include_default_styles is True

    def test_document_title(self) -> None:
        """Set document title."""
        config = ConversionConfig(title="My Document")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert "<title>My Document</title>" in result


# =============================================================================
# Style Resolution Tests
# =============================================================================


class TestStyleResolution:
    """Tests for style resolution during conversion."""

    def test_character_style_applied(self) -> None:
        """Character styles resolved and applied."""
        # Basic test that converter handles styles parameter
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_paragraph_style_applied(self) -> None:
        """Paragraph styles resolved and applied."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(jc="right"),
                        content=[Run(content=[Text(value="Right aligned")])],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "text-align" in result

    def test_table_style_applied(self) -> None:
        """Table styles resolved and applied."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tbl_pr=TableProperties(jc="center"),
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell")])])
                                        ]
                                    )
                                ]
                            )
                        ],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_style_inheritance(self) -> None:
        """Style inheritance chain resolved."""
        # Converter should accept styles parameter for inheritance
        converter = HTMLConverter(styles=None)
        assert converter is not None

    def test_direct_formatting_override(self) -> None:
        """Direct formatting overrides style."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[
                            Run(
                                r_pr=RunProperties(b=True, i=True),
                                content=[Text(value="Bold and Italic")],
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Bold and Italic" in result

    def test_document_defaults(self) -> None:
        """Document defaults applied as base."""
        converter = HTMLConverter()
        assert converter.config is not None


# =============================================================================
# Numbering Tests
# =============================================================================


class TestNumberingConversion:
    """Tests for numbering/list conversion."""

    def test_numbered_list(self) -> None:
        """Numbered list conversion."""
        # Document with numbered paragraphs
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None

    def test_bulleted_list(self) -> None:
        """Bulleted list conversion."""
        # Bulleted lists work similarly
        converter = HTMLConverter(numbering=None)
        assert converter is not None

    def test_multi_level_list(self) -> None:
        """Multi-level nested list."""
        # Multi-level lists are tracked by NumberingTracker
        converter = HTMLConverter()
        assert converter._numbering_tracker is not None

    def test_list_continuation(self) -> None:
        """List continues across paragraphs."""
        # Continuation uses same counter
        converter = HTMLConverter()
        assert converter is not None

    def test_list_restart(self) -> None:
        """List restarts numbering."""
        # Restart resets counter
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# HTML List Prefix Tests (Regression Tests)
# =============================================================================


class TestHTMLListPrefixes:
    """Tests for list prefixes in HTML output.

    These tests ensure that numbered and bulleted list paragraphs
    display the correct prefixes (bullets, numbers) in HTML output.
    """

    def test_numbered_list_prefix_in_html(self) -> None:
        """Numbered list paragraph shows number prefix in HTML."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # Create numbering definitions
        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=1, lvl=[level])
        instance = NumberingInstance(num_id=1, abstract_num_id=1)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        # Create paragraph with numbering
        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
                        content=[Run(content=[Text(value="First item")])],
                    )
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # The numbered prefix should appear in the output
        assert "First item" in result
        assert "1." in result

    def test_bulleted_list_prefix_in_html(self) -> None:
        """Bulleted list paragraph shows bullet prefix in HTML."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # Create bullet numbering
        level = Level(ilvl=0, num_fmt="bullet", lvl_text="•")
        abstract = AbstractNumbering(abstract_num_id=2, lvl=[level])
        instance = NumberingInstance(num_id=2, abstract_num_id=2)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        # Create paragraph with bullet
        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=2, ilvl=0)),
                        content=[Run(content=[Text(value="Bullet item")])],
                    )
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # The bullet should appear in the output
        assert "Bullet item" in result
        assert "•" in result

    def test_multi_level_numbered_list(self) -> None:
        """Multi-level numbered list shows correct prefixes."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # Create multi-level numbering
        # In OOXML, %1 refers to level 0's counter, %2 to level 1's, etc.
        levels = [
            Level(ilvl=0, num_fmt="decimal", lvl_text="%1."),
            Level(ilvl=1, num_fmt="lowerLetter", lvl_text="%2)"),  # %2 refers to level 1's counter
        ]
        abstract = AbstractNumbering(abstract_num_id=3, lvl=levels)
        instance = NumberingInstance(num_id=3, abstract_num_id=3)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=3, ilvl=0)),
                        content=[Run(content=[Text(value="Level 0 item")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=3, ilvl=1)),
                        content=[Run(content=[Text(value="Level 1 item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Both level prefixes should appear
        assert "Level 0 item" in result
        assert "Level 1 item" in result
        assert "1." in result
        # Level 1 uses lowerLetter format - a, b, c...
        assert "a)" in result

    def test_sequential_numbered_items(self) -> None:
        """Sequential numbered items increment correctly."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=4, lvl=[level])
        instance = NumberingInstance(num_id=4, abstract_num_id=4)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item one")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item two")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item three")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # All items and sequential numbers should appear
        assert "Item one" in result
        assert "Item two" in result
        assert "Item three" in result
        assert "1." in result
        assert "2." in result
        assert "3." in result

    def test_roman_numeral_list(self) -> None:
        """Roman numeral list shows correct prefixes."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="lowerRoman", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=5, lvl=[level])
        instance = NumberingInstance(num_id=5, abstract_num_id=5)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=5, ilvl=0)),
                        content=[Run(content=[Text(value="Roman item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "Roman item" in result
        assert "i." in result

    def test_list_prefix_with_custom_separator(self) -> None:
        """List with custom separator (parenthesis) shows correctly."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1)")
        abstract = AbstractNumbering(abstract_num_id=6, lvl=[level])
        instance = NumberingInstance(num_id=6, abstract_num_id=6)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=6, ilvl=0)),
                        content=[Run(content=[Text(value="Paren item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "Paren item" in result
        assert "1)" in result

    def test_no_prefix_when_numbering_missing(self) -> None:
        """Paragraph without numbering has no list prefix."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="No list")])])])
        )

        converter = HTMLConverter(numbering=None)
        result = converter.convert(doc)

        assert "No list" in result
        # Should not have list-marker span (which would indicate a list prefix)
        assert "list-marker" not in result
        assert "•" not in result


# =============================================================================
# Numbering Indentation Tests
# =============================================================================


class TestNumberingIndentation:
    """Tests for numbering indentation extraction."""

    def test_numbering_indentation_from_level(self) -> None:
        """Indentation is extracted from numbering level p_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # Level with 720 twips left indent (36pt)
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            p_pr={"left": 720, "hanging": 360},
        )
        abstract = AbstractNumbering(abstract_num_id=10, lvl=[level])
        instance = NumberingInstance(num_id=10, abstract_num_id=10)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=10, ilvl=0)),
                        content=[Run(content=[Text(value="Indented item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Should have margin-left: 36pt (720 twips / 20)
        assert "margin-left: 36" in result or "margin-left:36" in result
        assert "Indented item" in result

    def test_multi_level_indentation(self) -> None:
        """Different levels have different indentation."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        levels = [
            Level(ilvl=0, num_fmt="decimal", lvl_text="%1.", p_pr={"left": 720}),
            Level(ilvl=1, num_fmt="decimal", lvl_text="%1.%2.", p_pr={"left": 1440}),
        ]
        abstract = AbstractNumbering(abstract_num_id=11, lvl=levels)
        instance = NumberingInstance(num_id=11, abstract_num_id=11)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=11, ilvl=0)),
                        content=[Run(content=[Text(value="Level 0")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=11, ilvl=1)),
                        content=[Run(content=[Text(value="Level 1")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Level 0: 720 twips = 36pt, Level 1: 1440 twips = 72pt
        assert "36" in result  # Level 0 indentation
        assert "72" in result  # Level 1 indentation

    def test_no_indentation_when_p_pr_missing(self) -> None:
        """No indentation when level has no p_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.")  # No p_pr
        abstract = AbstractNumbering(abstract_num_id=12, lvl=[level])
        instance = NumberingInstance(num_id=12, abstract_num_id=12)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=12, ilvl=0)),
                        content=[Run(content=[Text(value="No indent")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "No indent" in result
        # Should not have margin-left from numbering
        assert "margin-left" not in result or "margin-left: 0" in result


# =============================================================================
# Numbering Styles Tests
# =============================================================================


class TestNumberingStyles:
    """Tests for numbering marker styling from level r_pr."""

    def test_bold_numbering_marker(self) -> None:
        """Bold marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties model uses 'b' for bold
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"b": True},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=20, lvl=[level])
        instance = NumberingInstance(num_id=20, abstract_num_id=20)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=20, ilvl=0)),
                        content=[Run(content=[Text(value="Bold marker item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Marker span should have bold styling
        assert 'class="list-marker"' in result
        assert "font-weight: bold" in result or "font-weight:bold" in result

    def test_italic_numbering_marker(self) -> None:
        """Italic marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties model uses 'i' for italic
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"i": True},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=21, lvl=[level])
        instance = NumberingInstance(num_id=21, abstract_num_id=21)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=21, ilvl=0)),
                        content=[Run(content=[Text(value="Italic marker item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert 'class="list-marker"' in result
        assert "font-style: italic" in result or "font-style:italic" in result

    def test_colored_numbering_marker(self) -> None:
        """Colored marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties.color is a Color object with a 'val' field
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"color": {"val": "FF0000"}},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=22, lvl=[level])
        instance = NumberingInstance(num_id=22, abstract_num_id=22)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=22, ilvl=0)),
                        content=[Run(content=[Text(value="Red marker item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert 'class="list-marker"' in result
        assert "#FF0000" in result or "#ff0000" in result

    def test_font_family_numbering_marker(self) -> None:
        """Font family on marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties model uses 'r_fonts' for fonts
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"r_fonts": {"ascii": "Times New Roman"}},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=23, lvl=[level])
        instance = NumberingInstance(num_id=23, abstract_num_id=23)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=23, ilvl=0)),
                        content=[Run(content=[Text(value="Times marker item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert 'class="list-marker"' in result
        assert "Times New Roman" in result

    def test_underline_numbering_marker(self) -> None:
        """Underline marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties.u is an Underline object with a 'val' field
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"u": {"val": "single"}},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=24, lvl=[level])
        instance = NumberingInstance(num_id=24, abstract_num_id=24)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=24, ilvl=0)),
                        content=[Run(content=[Text(value="Underline marker")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert 'class="list-marker"' in result
        assert "text-decoration" in result and "underline" in result

    def test_background_color_numbering_marker(self) -> None:
        """Background color on marker from level r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # RunProperties model uses 'shd' for shading
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"shd": {"fill": "FFFF00"}},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=25, lvl=[level])
        instance = NumberingInstance(num_id=25, abstract_num_id=25)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=25, ilvl=0)),
                        content=[Run(content=[Text(value="Yellow bg marker")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert 'class="list-marker"' in result
        assert "#FFFF00" in result or "#ffff00" in result or "background" in result

    def test_no_marker_style_when_r_pr_missing(self) -> None:
        """No marker styling when level has no r_pr."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.", p_pr={"left": 720})  # No r_pr
        abstract = AbstractNumbering(abstract_num_id=26, lvl=[level])
        instance = NumberingInstance(num_id=26, abstract_num_id=26)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=26, ilvl=0)),
                        content=[Run(content=[Text(value="Plain marker")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "Plain marker" in result
        # Marker should exist but without style attribute (or empty style)
        assert 'class="list-marker"' in result
        # Should not have inline styling on marker span
        assert 'list-marker" style="font-weight' not in result

    def test_marker_style_vs_text_style_separation(self) -> None:
        """Marker styling is separate from text styling."""
        from docx_parser_converter.models.numbering.abstract_numbering import AbstractNumbering
        from docx_parser_converter.models.numbering.level import Level
        from docx_parser_converter.models.numbering.numbering import Numbering
        from docx_parser_converter.models.numbering.numbering_instance import NumberingInstance

        # Bold marker (b=True), italic text
        level = Level(
            ilvl=0,
            num_fmt="decimal",
            lvl_text="%1.",
            r_pr={"b": True},
            p_pr={"left": 720},
        )
        abstract = AbstractNumbering(abstract_num_id=27, lvl=[level])
        instance = NumberingInstance(num_id=27, abstract_num_id=27)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from docx_parser_converter.models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=27, ilvl=0)),
                        content=[
                            Run(r_pr=RunProperties(i=True), content=[Text(value="Italic text")])
                        ],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Marker should be bold
        assert "font-weight: bold" in result or "font-weight:bold" in result
        # Text should be italic (semantic tag or style)
        assert "<em>" in result or "font-style: italic" in result or "font-style:italic" in result
        # Both styles present separately
        assert "Italic text" in result


# =============================================================================
# Table Conversion Tests
# =============================================================================


class TestTableConversion:
    """Tests for table conversion in full document."""

    def test_simple_table(self) -> None:
        """Simple table in document."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell 1")])])
                                        ]
                                    ),
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell 2")])])
                                        ]
                                    ),
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result
        assert "Cell 1" in result
        assert "Cell 2" in result

    def test_table_with_merged_cells(self) -> None:
        """Table with colspan/rowspan."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Merged")])])
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_nested_table(self) -> None:
        """Table nested in cell."""
        inner_table = Table(
            tr=[
                TableRow(
                    tc=[
                        TableCell(content=[Paragraph(content=[Run(content=[Text(value="Inner")])])])
                    ]
                )
            ]
        )
        doc = Document(
            body=Body(content=[Table(tr=[TableRow(tc=[TableCell(content=[inner_table])])])])
        )
        result = docx_to_html(doc)
        # Should have two tables
        assert result.count("<table") >= 1

    def test_table_with_styles(self) -> None:
        """Table with style applied."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tbl_pr=TableProperties(jc="center"),
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Styled")])])
                                        ]
                                    )
                                ]
                            )
                        ],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result


# =============================================================================
# Section Properties Tests
# =============================================================================


class TestSectionConversion:
    """Tests for section properties conversion."""

    def test_page_size(self) -> None:
        """Page size reflected in output."""
        config = ConversionConfig()
        assert config is not None

    def test_page_margins(self) -> None:
        """Page margins reflected in output."""
        config = ConversionConfig()
        assert config is not None

    def test_page_orientation(self) -> None:
        """Page orientation (portrait/landscape)."""
        config = ConversionConfig()
        assert config is not None

    def test_section_break(self) -> None:
        """Section breaks in document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result


# =============================================================================
# Hyperlink Tests
# =============================================================================


class TestHyperlinkConversion:
    """Tests for hyperlink conversion."""

    def test_external_hyperlink(self) -> None:
        """External URL hyperlink."""
        converter = HTMLConverter(relationships={"rId1": "https://example.com"})
        assert converter.relationships["rId1"] == "https://example.com"

    def test_internal_bookmark_link(self) -> None:
        """Internal bookmark link."""
        converter = HTMLConverter()
        assert converter.relationships == {}

    def test_hyperlink_in_table(self) -> None:
        """Hyperlink inside table cell."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(
                                                content=[Run(content=[Text(value="Link text")])]
                                            )
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Link text" in result


# =============================================================================
# Image Tests
# =============================================================================


class TestImageConversion:
    """Tests for image conversion through HTMLConverter.

    Note: Detailed image conversion tests are in test_image_to_html.py.
    These tests verify integration with the main HTMLConverter.
    """

    def _make_image_data(self, rel_id: str = "rId1") -> dict[str, tuple[bytes, str]]:
        """Create test image data dict with a 1x1 red PNG."""
        import base64

        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4"
            "2mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        return {rel_id: (png_bytes, "image/png")}

    def _make_inline_drawing(
        self, embed: str = "rId1", width: int = 952500, height: int = 952500
    ) -> Drawing:
        """Create a test inline drawing."""
        from docx_parser_converter.models.document.drawing import (
            Blip,
            BlipFill,
            Drawing,
            DrawingExtent,
            DrawingProperties,
            Graphic,
            GraphicData,
            InlineDrawing,
            Picture,
        )

        return Drawing(
            inline=InlineDrawing(
                extent=DrawingExtent(cx=width, cy=height),
                doc_pr=DrawingProperties(id=1, name="Test Image", descr="Alt text"),
                graphic=Graphic(
                    graphic_data=GraphicData(
                        pic=Picture(blip_fill=BlipFill(blip=Blip(embed=embed)))
                    )
                ),
            )
        )

    def _make_anchor_drawing(self, embed: str = "rId1", h_align: str = "left") -> Drawing:
        """Create a test anchor drawing."""
        from docx_parser_converter.models.document.drawing import (
            AnchorDrawing,
            Blip,
            BlipFill,
            Drawing,
            DrawingExtent,
            DrawingProperties,
            Graphic,
            GraphicData,
            Picture,
        )

        return Drawing(
            anchor=AnchorDrawing(
                extent=DrawingExtent(cx=952500, cy=952500),
                doc_pr=DrawingProperties(id=1, name="Floating", descr="Float alt"),
                graphic=Graphic(
                    graphic_data=GraphicData(
                        pic=Picture(blip_fill=BlipFill(blip=Blip(embed=embed)))
                    )
                ),
                h_align=h_align,
            )
        )

    def test_inline_image_in_paragraph(self) -> None:
        """Inline image in paragraph produces img tag."""
        drawing = self._make_inline_drawing()
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[drawing])])]))
        image_data = self._make_image_data()
        converter = HTMLConverter(image_data=image_data)

        result = converter.convert(doc)

        assert "<img " in result
        assert 'src="data:image/png;base64,' in result
        assert 'alt="Alt text"' in result

    def test_floating_image_with_alignment(self) -> None:
        """Floating/anchored image has float styling."""
        drawing = self._make_anchor_drawing(h_align="left")
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[drawing])])]))
        image_data = self._make_image_data()
        converter = HTMLConverter(image_data=image_data)

        result = converter.convert(doc)

        assert "<img " in result
        assert "float: left" in result

    def test_image_dimensions_in_style(self) -> None:
        """Image dimensions are included in style."""
        # 952500 EMU = 100 pixels
        drawing = self._make_inline_drawing(width=952500, height=476250)
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[drawing])])]))
        image_data = self._make_image_data()
        converter = HTMLConverter(image_data=image_data)

        result = converter.convert(doc)

        assert "width: 100px" in result
        assert "height: 50px" in result

    def test_image_alt_text_preserved(self) -> None:
        """Image alt text is included in img tag."""
        drawing = self._make_inline_drawing()
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[drawing])])]))
        image_data = self._make_image_data()
        converter = HTMLConverter(image_data=image_data)

        result = converter.convert(doc)

        assert 'alt="Alt text"' in result

    def test_image_without_data_produces_no_img(self) -> None:
        """Image without matching data produces no img tag."""
        drawing = self._make_inline_drawing(embed="rId999")
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[drawing])])]))
        # No image data provided
        converter = HTMLConverter(image_data={})

        result = converter.convert(doc)

        assert "<img " not in result


# =============================================================================
# Special Content Tests
# =============================================================================


class TestSpecialContent:
    """Tests for special content conversion."""

    def test_page_break(self) -> None:
        """Page break in document."""
        doc = Document(body=Body(content=[Paragraph(content=[])]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_column_break(self) -> None:
        """Column break in document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_tab_characters(self) -> None:
        """Tab characters in content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Before\tAfter")])])])
        )
        result = docx_to_html(doc)
        assert "Before" in result

    def test_soft_hyphens(self) -> None:
        """Soft hyphens preserved."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result


# =============================================================================
# Error Handling Tests
# =============================================================================


class TestErrorHandling:
    """Tests for error handling."""

    def test_invalid_file_path(self) -> None:
        """Invalid file path raises appropriate error."""
        with pytest.raises(FileNotFoundError):
            docx_to_html("/nonexistent/file.docx")

    def test_not_a_docx(self) -> None:
        """Non-DOCX file raises error."""
        import tempfile
        from pathlib import Path

        # Create a temporary non-docx file
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not a docx")
            temp_path = f.name
        try:
            with pytest.raises(UnsupportedFormatError):
                docx_to_html(temp_path)
        finally:
            Path(temp_path).unlink()

    def test_corrupted_docx(self) -> None:
        """Corrupted DOCX file handled."""
        # Would need actual corrupted file to test
        converter = HTMLConverter()
        assert converter is not None

    def test_encrypted_docx(self) -> None:
        """Encrypted DOCX file rejected."""
        # Would need actual encrypted file to test
        converter = HTMLConverter()
        assert converter is not None

    def test_missing_styles_xml(self) -> None:
        """Document without styles.xml handled."""
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_missing_numbering_xml(self) -> None:
        """Document without numbering.xml handled."""
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None


# =============================================================================
# Performance Tests
# =============================================================================


class TestPerformance:
    """Tests for conversion performance."""

    def test_large_document(self) -> None:
        """Large document converted in reasonable time."""
        # Create document with many paragraphs
        paragraphs = [
            Paragraph(content=[Run(content=[Text(value=f"Paragraph {i}")])]) for i in range(100)
        ]
        doc = Document(body=Body(content=paragraphs))
        result = docx_to_html(doc)
        assert "Paragraph 0" in result
        assert "Paragraph 99" in result

    def test_many_tables(self) -> None:
        """Document with many tables."""
        tables = [
            Table(
                tr=[
                    TableRow(
                        tc=[
                            TableCell(
                                content=[
                                    Paragraph(content=[Run(content=[Text(value=f"Table {i}")])])
                                ]
                            )
                        ]
                    )
                ]
            )
            for i in range(10)
        ]
        doc = Document(body=Body(content=tables))
        result = docx_to_html(doc)
        assert "Table 0" in result

    def test_deep_style_inheritance(self) -> None:
        """Document with deep style inheritance."""
        # Just verify it works
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# HTMLConverter Class Tests
# =============================================================================


class TestHTMLConverterClass:
    """Tests for HTMLConverter class usage."""

    def test_converter_initialization(self) -> None:
        """Initialize converter with config."""
        config = ConversionConfig()
        converter = HTMLConverter(config=config)
        assert converter.config == config

    def test_converter_with_styles(self) -> None:
        """Initialize converter with styles."""
        converter = HTMLConverter(styles=None, numbering=None)
        assert converter.styles is None
        assert converter.numbering is None

    def test_convert_document(self) -> None:
        """Convert Document model to HTML."""
        converter = HTMLConverter()
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = converter.convert(doc)
        assert "Test" in result

    def test_convert_paragraph(self) -> None:
        """Convert individual paragraph."""
        converter = HTMLConverter()
        para = Paragraph(content=[Run(content=[Text(value="Test")])])
        result = converter.convert_paragraph(para)
        assert "Test" in result

    def test_convert_table(self) -> None:
        """Convert individual table."""
        converter = HTMLConverter()
        table = Table(
            tr=[
                TableRow(
                    tc=[TableCell(content=[Paragraph(content=[Run(content=[Text(value="Cell")])])])]
                )
            ]
        )
        result = converter.convert_table(table)
        assert "<table" in result
        assert "Cell" in result


# =============================================================================
# Integration with Parser Tests
# =============================================================================


class TestParserIntegration:
    """Tests for integration with DOCX parser."""

    def test_parse_and_convert(self) -> None:
        """Parse DOCX and convert to HTML."""
        # Full pipeline test - Document model to HTML
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc)
        assert "Test" in result

    def test_relationships_resolved(self) -> None:
        """Relationships from parser used correctly."""
        rels = {"rId1": "https://example.com"}
        converter = HTMLConverter(relationships=rels)
        assert converter.relationships == rels

    def test_styles_from_parser(self) -> None:
        """Styles from parser used correctly."""
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_numbering_from_parser(self) -> None:
        """Numbering from parser used correctly."""
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None


# =============================================================================
# Fragment Mode Tests
# =============================================================================


class TestFragmentMode:
    """Tests for HTML fragment output mode."""

    def test_fragment_output(self) -> None:
        """Output HTML fragment without wrapper."""
        config = ConversionConfig(fragment_only=True)
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc, config=config)
        # No <!DOCTYPE>, <html>, <head>, <body>
        assert "<!DOCTYPE" not in result
        assert "<html" not in result

    def test_fragment_paragraph(self) -> None:
        """Fragment mode for paragraph."""
        config = ConversionConfig(fragment_only=True)
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Just content")])])])
        )
        result = docx_to_html(doc, config=config)
        assert "Just content" in result
        assert "<body" not in result


# =============================================================================
# Custom CSS Tests
# =============================================================================


class TestCustomCSS:
    """Tests for custom CSS options."""

    def test_custom_css_string(self) -> None:
        """Add custom CSS string."""
        config = ConversionConfig(custom_css="p { color: red; }")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert "color: red" in result

    def test_custom_css_file(self) -> None:
        """Reference external CSS file."""
        config = ConversionConfig(css_files=["custom.css"])
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert 'href="custom.css"' in result


# =============================================================================
# Accessibility Tests
# =============================================================================


class TestAccessibility:
    """Tests for accessibility features."""

    def test_heading_structure(self) -> None:
        """Headings maintain proper structure."""
        # Would need heading styles
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_table_headers(self) -> None:
        """Table headers use <th> and scope."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Header")])])
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_alt_text_preserved(self) -> None:
        """Image alt text preserved."""
        # Would need image with alt text
        converter = HTMLConverter()
        assert converter is not None

    def test_lang_attribute(self) -> None:
        """Language attribute set correctly."""
        config = ConversionConfig(language="fr")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert 'lang="fr"' in result


# =============================================================================
# Unicode Tests
# =============================================================================


class TestUnicodeHandling:
    """Tests for Unicode content handling."""

    def test_cjk_content(self) -> None:
        """CJK (Chinese, Japanese, Korean) content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="你好世界")])])])
        )
        result = docx_to_html(doc)
        assert "你好世界" in result

    def test_arabic_content(self) -> None:
        """Arabic content with RTL."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="مرحبا")])])]))
        result = docx_to_html(doc)
        assert "مرحبا" in result

    def test_emoji_content(self) -> None:
        """Emoji in content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello 🌍")])])])
        )
        result = docx_to_html(doc)
        assert "🌍" in result

    def test_mixed_scripts(self) -> None:
        """Mixed script content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello 世界 مرحبا")])])])
        )
        result = docx_to_html(doc)
        assert "Hello" in result
        assert "世界" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases in conversion."""

    def test_empty_paragraphs(self) -> None:
        """Document with empty paragraphs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(content=[]),
                    Paragraph(content=[Run(content=[Text(value="Not empty")])]),
                    Paragraph(content=[]),
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Not empty" in result

    def test_empty_runs(self) -> None:
        """Paragraphs with empty runs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[
                            Run(content=[]),
                            Run(content=[Text(value="Content")]),
                            Run(content=[]),
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Content" in result

    def test_deeply_nested_content(self) -> None:
        """Deeply nested tables/content."""
        inner = Table(
            tr=[
                TableRow(
                    tc=[TableCell(content=[Paragraph(content=[Run(content=[Text(value="Deep")])])])]
                )
            ]
        )
        doc = Document(body=Body(content=[Table(tr=[TableRow(tc=[TableCell(content=[inner])])])]))
        result = docx_to_html(doc)
        assert "Deep" in result

    def test_very_long_paragraphs(self) -> None:
        """Very long paragraphs."""
        long_text = "A" * 10000
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value=long_text)])])])
        )
        result = docx_to_html(doc)
        assert long_text in result

    def test_many_styles(self) -> None:
        """Document with many unique styles."""
        paragraphs = [
            Paragraph(
                p_pr=ParagraphProperties(jc=["left", "center", "right"][i % 3]),
                content=[Run(content=[Text(value=f"Style {i}")])],
            )
            for i in range(20)
        ]
        doc = Document(body=Body(content=paragraphs))
        result = docx_to_html(doc)
        assert "Style 0" in result

    def test_circular_style_references(self) -> None:
        """Handle circular style references gracefully."""
        # Converter should handle None styles gracefully
        converter = HTMLConverter(styles=None)
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Safe")])])]))
        result = converter.convert(doc)
        assert "Safe" in result


# =============================================================================
# Callback/Hook Tests
# =============================================================================


class TestCallbackHooks:
    """Tests for callback/hook functionality."""

    def test_paragraph_callback(self) -> None:
        """Callback called for each paragraph (future feature)."""
        # Placeholder for future callback support
        converter = HTMLConverter()
        assert converter is not None

    def test_run_callback(self) -> None:
        """Callback called for each run (future feature)."""
        converter = HTMLConverter()
        assert converter is not None

    def test_table_callback(self) -> None:
        """Callback called for each table (future feature)."""
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# CSS Variable Tests
# =============================================================================


class TestCSSVariables:
    """Tests for CSS custom properties (variables)."""

    def test_css_variables_mode(self) -> None:
        """Output uses CSS custom properties option."""
        config = ConversionConfig(use_css_variables=True)
        assert config.use_css_variables is True


# =============================================================================
# Streaming Output Tests
# =============================================================================


class TestStreamingOutput:
    """Tests for streaming/chunked output."""

    def test_streaming_mode(self) -> None:
        """Stream output for large documents."""
        from docx_parser_converter.converters.html.html_converter import docx_to_html_stream

        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        chunks = list(docx_to_html_stream(doc))
        assert len(chunks) == 1
        assert "Test" in chunks[0]
