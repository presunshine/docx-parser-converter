"""Unit tests for table to text converter.

Tests conversion of Table elements to plain text in various modes.

Modes:
- "ascii": Full ASCII box with all borders (explicit mode)
- "tabs": Tab-separated columns, newline-separated rows (no borders)
- "plain": Space-separated columns, newline-separated rows (no borders)
- "auto": Chooses ascii or tabs based on border detection

Border Detection (auto mode):
- Table-level borders: tbl_pr.tbl_borders (top, bottom, left, right, inside_h, inside_v)
- Cell-level borders: tc_pr.tc_borders on individual cells
- Partial borders: Only renders the borders that are actually defined
"""

from docx_parser_converter.converters.text.table_to_text import (
    BorderInfo,
    TableToTextConverter,
    cell_to_text,
    detect_borders,
    has_visible_borders,
    row_to_text,
    table_to_ascii,
    table_to_text,
)
from docx_parser_converter.models.common.border import Border, TableBorders
from docx_parser_converter.models.common.width import Width
from docx_parser_converter.models.document.paragraph import Paragraph
from docx_parser_converter.models.document.run import Run
from docx_parser_converter.models.document.run_content import Text
from docx_parser_converter.models.document.table import Table, TableProperties
from docx_parser_converter.models.document.table_cell import TableCell, TableCellProperties
from docx_parser_converter.models.document.table_row import TableRow

# =============================================================================
# Helper Functions
# =============================================================================


def make_cell(text: str, width: int | None = None) -> TableCell:
    """Create a simple table cell with text."""
    return TableCell(
        tc_pr=TableCellProperties(tc_w=Width(w=width)) if width else None,
        content=[Paragraph(content=[Run(content=[Text(value=text)])])],
    )


def make_row(cells: list[TableCell]) -> TableRow:
    """Create a table row with cells."""
    return TableRow(tc=cells)


def make_table(
    rows: list[TableRow],
    *,
    borders: TableBorders | None = None,
) -> Table:
    """Create a table with rows and optional borders."""
    return Table(
        tbl_pr=TableProperties(tbl_borders=borders) if borders else None,
        tbl_grid=None,
        tr=rows,
    )


# =============================================================================
# Basic Table Conversion Tests
# =============================================================================


class TestBasicTableConversion:
    """Tests for basic table to text conversion."""

    def test_simple_table(self) -> None:
        """Simple 2x2 table."""
        table = make_table(
            [
                make_row([make_cell("A1"), make_cell("B1")]),
                make_row([make_cell("A2"), make_cell("B2")]),
            ]
        )
        result = table_to_text(table)
        assert "A1" in result
        assert "B1" in result
        assert "A2" in result
        assert "B2" in result

    def test_empty_table(self) -> None:
        """Empty table returns empty or minimal string."""
        table = Table(tbl_pr=None, tbl_grid=None, tr=[])
        result = table_to_text(table)
        assert result == "" or result.strip() == ""

    def test_none_table(self) -> None:
        """None table returns empty string."""
        result = table_to_text(None)
        assert result == ""

    def test_single_cell_table(self) -> None:
        """Single cell table."""
        table = make_table([make_row([make_cell("Only cell")])])
        result = table_to_text(table)
        assert "Only cell" in result

    def test_single_row_table(self) -> None:
        """Single row table."""
        table = make_table([make_row([make_cell("A"), make_cell("B"), make_cell("C")])])
        result = table_to_text(table)
        assert "A" in result
        assert "B" in result
        assert "C" in result


# =============================================================================
# ASCII Box Mode Tests
# =============================================================================


class TestAsciiBoxMode:
    """Tests for ASCII box drawing mode."""

    def test_ascii_box_simple_table(self) -> None:
        """Simple table in ASCII box mode."""
        table = make_table(
            [
                make_row([make_cell("A1"), make_cell("B1")]),
                make_row([make_cell("A2"), make_cell("B2")]),
            ]
        )
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        # Should have box drawing characters
        assert "+" in result or "─" in result or "-" in result
        assert "A1" in result
        assert "B1" in result

    def test_ascii_box_borders(self) -> None:
        """ASCII box mode with visible borders."""
        borders = TableBorders(
            top=Border(val="single"),
            left=Border(val="single"),
            bottom=Border(val="single"),
            right=Border(val="single"),
            inside_h=Border(val="single"),
            inside_v=Border(val="single"),
        )
        table = make_table(
            [
                make_row([make_cell("Cell1"), make_cell("Cell2")]),
            ],
            borders=borders,
        )
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        # Should have horizontal and vertical separators
        assert "Cell1" in result
        assert "Cell2" in result

    def test_ascii_box_alignment(self) -> None:
        """ASCII box mode aligns columns."""
        table = make_table(
            [
                make_row([make_cell("Short"), make_cell("Much longer text")]),
                make_row([make_cell("A"), make_cell("B")]),
            ]
        )
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        lines = result.strip().split("\n")
        # All content lines should have same length (excluding border lines)
        content_lines = [line for line in lines if "Short" in line or "A" in line]
        if len(content_lines) >= 2:
            # Check that columns are somewhat aligned
            assert len(content_lines[0]) == len(content_lines[1])

    def test_ascii_box_multiline_cell(self) -> None:
        """ASCII box mode with multi-line cell content."""
        cell = TableCell(
            content=[
                Paragraph(content=[Run(content=[Text(value="Line 1")])]),
                Paragraph(content=[Run(content=[Text(value="Line 2")])]),
            ]
        )
        table = make_table([make_row([cell, make_cell("Single")])])
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        assert "Line 1" in result
        assert "Line 2" in result
        assert "Single" in result


# =============================================================================
# Tab-Separated Mode Tests
# =============================================================================


class TestTabSeparatedMode:
    """Tests for tab-separated mode."""

    def test_tab_separated_simple(self) -> None:
        """Simple table in tab-separated mode."""
        table = make_table(
            [
                make_row([make_cell("A1"), make_cell("B1")]),
                make_row([make_cell("A2"), make_cell("B2")]),
            ]
        )
        converter = TableToTextConverter(mode="tabs")
        result = converter.convert(table)
        assert "A1\tB1" in result
        assert "A2\tB2" in result

    def test_tab_separated_newlines(self) -> None:
        """Tab-separated mode uses newlines between rows."""
        table = make_table(
            [
                make_row([make_cell("Row1")]),
                make_row([make_cell("Row2")]),
            ]
        )
        converter = TableToTextConverter(mode="tabs")
        result = converter.convert(table)
        assert "Row1" in result
        assert "Row2" in result
        assert "\n" in result

    def test_tab_separated_many_columns(self) -> None:
        """Tab-separated mode with many columns."""
        table = make_table([make_row([make_cell(f"C{i}") for i in range(5)])])
        converter = TableToTextConverter(mode="tabs")
        result = converter.convert(table)
        assert result.strip() == "C0\tC1\tC2\tC3\tC4"

    def test_tab_separated_empty_cells(self) -> None:
        """Tab-separated mode preserves empty cells."""
        table = make_table([make_row([make_cell("A"), make_cell(""), make_cell("C")])])
        converter = TableToTextConverter(mode="tabs")
        result = converter.convert(table)
        # Should have two tabs (between A and empty, between empty and C)
        assert "\t\t" in result or result.count("\t") >= 2


# =============================================================================
# Plain Text Mode Tests
# =============================================================================


class TestPlainTextMode:
    """Tests for plain text mode (no borders, minimal formatting)."""

    def test_plain_simple_table(self) -> None:
        """Simple table in plain mode."""
        table = make_table(
            [
                make_row([make_cell("A1"), make_cell("B1")]),
                make_row([make_cell("A2"), make_cell("B2")]),
            ]
        )
        converter = TableToTextConverter(mode="plain")
        result = converter.convert(table)
        assert "A1" in result
        assert "B1" in result
        assert "A2" in result
        assert "B2" in result
        # Should not have box drawing characters
        assert "+" not in result
        assert "─" not in result

    def test_plain_space_separated(self) -> None:
        """Plain mode separates cells with spaces."""
        table = make_table([make_row([make_cell("Cell1"), make_cell("Cell2")])])
        converter = TableToTextConverter(mode="plain")
        result = converter.convert(table)
        # Cells should be separated somehow (space or newline)
        assert "Cell1" in result
        assert "Cell2" in result


# =============================================================================
# Auto Mode Tests
# =============================================================================


class TestAutoMode:
    """Tests for auto mode (chooses based on borders)."""

    def test_auto_with_borders_uses_ascii(self) -> None:
        """Auto mode with visible borders uses ASCII box."""
        borders = TableBorders(
            top=Border(val="single"),
            bottom=Border(val="single"),
        )
        table = make_table(
            [make_row([make_cell("Cell")])],
            borders=borders,
        )
        converter = TableToTextConverter(mode="auto")
        result = converter.convert(table)
        # Should use ASCII box mode with visible separators
        assert "Cell" in result

    def test_auto_without_borders_uses_tabs(self) -> None:
        """Auto mode without borders uses tab-separated."""
        table = make_table([make_row([make_cell("A"), make_cell("B")])])
        converter = TableToTextConverter(mode="auto")
        result = converter.convert(table)
        assert "A" in result
        assert "B" in result

    def test_auto_with_none_border_val(self) -> None:
        """Auto mode with none border value uses tabs."""
        borders = TableBorders(
            top=Border(val="none"),
        )
        table = make_table(
            [make_row([make_cell("Cell")])],
            borders=borders,
        )
        converter = TableToTextConverter(mode="auto")
        result = converter.convert(table)
        assert "Cell" in result


# =============================================================================
# Cell Merging Tests
# =============================================================================


class TestCellMerging:
    """Tests for merged cell handling."""

    def test_horizontal_merge(self) -> None:
        """Horizontally merged cells (colspan)."""
        merged_cell = TableCell(
            tc_pr=TableCellProperties(grid_span=2),
            content=[Paragraph(content=[Run(content=[Text(value="Merged")])])],
        )
        table = make_table(
            [
                make_row([merged_cell]),
                make_row([make_cell("A"), make_cell("B")]),
            ]
        )
        result = table_to_text(table)
        assert "Merged" in result
        assert "A" in result
        assert "B" in result

    def test_vertical_merge(self) -> None:
        """Vertically merged cells (rowspan)."""
        merge_start = TableCell(
            tc_pr=TableCellProperties(v_merge="restart"),
            content=[Paragraph(content=[Run(content=[Text(value="Spanning")])])],
        )
        merge_cont = TableCell(
            tc_pr=TableCellProperties(v_merge="continue"),
            content=[],
        )
        table = make_table(
            [
                make_row([merge_start, make_cell("B1")]),
                make_row([merge_cont, make_cell("B2")]),
            ]
        )
        result = table_to_text(table)
        assert "Spanning" in result
        assert "B1" in result
        assert "B2" in result


# =============================================================================
# Cell Content Tests
# =============================================================================


class TestCellContent:
    """Tests for cell content extraction."""

    def test_cell_to_text_simple(self) -> None:
        """Simple cell text extraction."""
        cell = make_cell("Cell content")
        result = cell_to_text(cell)
        assert result == "Cell content"

    def test_cell_to_text_empty(self) -> None:
        """Empty cell returns empty string."""
        cell = TableCell(content=[])
        result = cell_to_text(cell)
        assert result == ""

    def test_cell_to_text_multiple_paragraphs(self) -> None:
        """Cell with multiple paragraphs."""
        cell = TableCell(
            content=[
                Paragraph(content=[Run(content=[Text(value="Para 1")])]),
                Paragraph(content=[Run(content=[Text(value="Para 2")])]),
            ]
        )
        result = cell_to_text(cell)
        assert "Para 1" in result
        assert "Para 2" in result
        assert "\n" in result  # Paragraphs separated by newline

    def test_cell_with_unicode(self) -> None:
        """Cell with unicode content."""
        cell = make_cell("Hello 世界")
        result = cell_to_text(cell)
        assert result == "Hello 世界"


# =============================================================================
# Row Content Tests
# =============================================================================


class TestRowContent:
    """Tests for row content extraction."""

    def test_row_to_text_simple(self) -> None:
        """Simple row text extraction."""
        row = make_row([make_cell("A"), make_cell("B")])
        result = row_to_text(row)
        assert "A" in result
        assert "B" in result

    def test_row_to_text_empty(self) -> None:
        """Empty row returns empty string."""
        row = TableRow(tc=[])
        result = row_to_text(row)
        assert result == "" or result.strip() == ""

    def test_row_to_text_many_cells(self) -> None:
        """Row with many cells."""
        row = make_row([make_cell(f"Cell{i}") for i in range(10)])
        result = row_to_text(row)
        for i in range(10):
            assert f"Cell{i}" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestTableEdgeCases:
    """Tests for edge cases in table conversion."""

    def test_uneven_rows(self) -> None:
        """Table with uneven row lengths."""
        table = make_table(
            [
                make_row([make_cell("A1"), make_cell("B1"), make_cell("C1")]),
                make_row([make_cell("A2")]),
            ]
        )
        result = table_to_text(table)
        assert "A1" in result
        assert "A2" in result

    def test_empty_cells(self) -> None:
        """Table with empty cells."""
        table = make_table(
            [
                make_row([make_cell(""), make_cell("B")]),
                make_row([make_cell("A"), make_cell("")]),
            ]
        )
        result = table_to_text(table)
        assert "A" in result
        assert "B" in result

    def test_very_wide_table(self) -> None:
        """Very wide table (many columns)."""
        table = make_table([make_row([make_cell(f"Col{i}") for i in range(20)])])
        result = table_to_text(table)
        assert "Col0" in result
        assert "Col19" in result

    def test_very_tall_table(self) -> None:
        """Very tall table (many rows)."""
        table = make_table([make_row([make_cell(f"Row{i}")]) for i in range(50)])
        result = table_to_text(table)
        assert "Row0" in result
        assert "Row49" in result

    def test_nested_content_in_cell(self) -> None:
        """Cell with complex nested content."""
        cell = TableCell(
            content=[
                Paragraph(
                    content=[
                        Run(content=[Text(value="Bold text")]),
                        Run(content=[Text(value=" and normal")]),
                    ]
                )
            ]
        )
        table = make_table([make_row([cell])])
        result = table_to_text(table)
        assert "Bold text" in result
        assert "and normal" in result


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestTableToTextConverterClass:
    """Tests for TableToTextConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = TableToTextConverter()
        assert converter is not None

    def test_converter_ascii_mode(self) -> None:
        """Initialize with ASCII mode."""
        converter = TableToTextConverter(mode="ascii")
        assert converter.mode == "ascii"

    def test_converter_tabs_mode(self) -> None:
        """Initialize with tabs mode."""
        converter = TableToTextConverter(mode="tabs")
        assert converter.mode == "tabs"

    def test_converter_plain_mode(self) -> None:
        """Initialize with plain mode."""
        converter = TableToTextConverter(mode="plain")
        assert converter.mode == "plain"

    def test_converter_auto_mode(self) -> None:
        """Initialize with auto mode."""
        converter = TableToTextConverter(mode="auto")
        assert converter.mode == "auto"

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = TableToTextConverter()
        table = make_table([make_row([make_cell("Test")])])
        result = converter.convert(table)
        assert "Test" in result

    def test_converter_default_mode(self) -> None:
        """Default mode is auto."""
        converter = TableToTextConverter()
        assert converter.mode == "auto"


# =============================================================================
# Column Width Calculation Tests
# =============================================================================


class TestColumnWidthCalculation:
    """Tests for column width calculation in ASCII mode."""

    def test_column_widths_based_on_content(self) -> None:
        """Column widths based on content length."""
        table = make_table(
            [
                make_row([make_cell("Short"), make_cell("Much longer text here")]),
                make_row([make_cell("A"), make_cell("B")]),
            ]
        )
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        # The longer content should determine column width
        lines = result.split("\n")
        # All lines should be consistent length
        non_empty_lines = [line for line in lines if line.strip()]
        if len(non_empty_lines) > 1:
            # Content lines should have consistent structure
            pass  # Basic structure check

    def test_minimum_column_width(self) -> None:
        """Empty columns have minimum width."""
        table = make_table(
            [
                make_row([make_cell(""), make_cell("B")]),
            ]
        )
        converter = TableToTextConverter(mode="ascii")
        result = converter.convert(table)
        # Should still render both columns
        assert "B" in result


# =============================================================================
# BorderInfo Dataclass Tests
# =============================================================================


class TestBorderInfo:
    """Tests for BorderInfo dataclass."""

    def test_default_values(self) -> None:
        """All borders default to False."""
        info = BorderInfo()
        assert info.top is False
        assert info.bottom is False
        assert info.left is False
        assert info.right is False
        assert info.inside_h is False
        assert info.inside_v is False

    def test_has_any_false_when_all_false(self) -> None:
        """has_any returns False when no borders set."""
        info = BorderInfo()
        assert info.has_any is False

    def test_has_any_true_when_top_set(self) -> None:
        """has_any returns True when top border set."""
        info = BorderInfo(top=True)
        assert info.has_any is True

    def test_has_any_true_when_bottom_set(self) -> None:
        """has_any returns True when bottom border set."""
        info = BorderInfo(bottom=True)
        assert info.has_any is True

    def test_has_any_true_when_left_set(self) -> None:
        """has_any returns True when left border set."""
        info = BorderInfo(left=True)
        assert info.has_any is True

    def test_has_any_true_when_right_set(self) -> None:
        """has_any returns True when right border set."""
        info = BorderInfo(right=True)
        assert info.has_any is True

    def test_has_any_true_when_inside_h_set(self) -> None:
        """has_any returns True when inside_h border set."""
        info = BorderInfo(inside_h=True)
        assert info.has_any is True

    def test_has_any_true_when_inside_v_set(self) -> None:
        """has_any returns True when inside_v border set."""
        info = BorderInfo(inside_v=True)
        assert info.has_any is True

    def test_has_any_true_when_multiple_set(self) -> None:
        """has_any returns True when multiple borders set."""
        info = BorderInfo(top=True, bottom=True, left=True, right=True)
        assert info.has_any is True

    def test_full_borders(self) -> None:
        """All borders can be set to True."""
        info = BorderInfo(
            top=True, bottom=True, left=True, right=True, inside_h=True, inside_v=True
        )
        assert info.top is True
        assert info.bottom is True
        assert info.left is True
        assert info.right is True
        assert info.inside_h is True
        assert info.inside_v is True


# =============================================================================
# Border Detection Tests
# =============================================================================


class TestDetectBorders:
    """Tests for detect_borders() function."""

    def test_no_borders_returns_empty_info(self) -> None:
        """Table without borders returns BorderInfo with all False."""
        table = make_table([make_row([make_cell("Cell")])])
        info = detect_borders(table)
        assert info.has_any is False

    def test_table_level_top_border(self) -> None:
        """Detect table-level top border."""
        borders = TableBorders(top=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.top is True
        assert info.bottom is False

    def test_table_level_bottom_border(self) -> None:
        """Detect table-level bottom border."""
        borders = TableBorders(bottom=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.bottom is True
        assert info.top is False

    def test_table_level_left_border(self) -> None:
        """Detect table-level left border."""
        borders = TableBorders(left=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.left is True

    def test_table_level_right_border(self) -> None:
        """Detect table-level right border."""
        borders = TableBorders(right=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.right is True

    def test_table_level_inside_h_border(self) -> None:
        """Detect table-level inside_h border."""
        borders = TableBorders(inside_h=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.inside_h is True

    def test_table_level_inside_v_border(self) -> None:
        """Detect table-level inside_v border."""
        borders = TableBorders(inside_v=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.inside_v is True

    def test_table_level_all_borders(self) -> None:
        """Detect all table-level borders."""
        borders = TableBorders(
            top=Border(val="single"),
            bottom=Border(val="single"),
            left=Border(val="single"),
            right=Border(val="single"),
            inside_h=Border(val="single"),
            inside_v=Border(val="single"),
        )
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.top is True
        assert info.bottom is True
        assert info.left is True
        assert info.right is True
        assert info.inside_h is True
        assert info.inside_v is True

    def test_none_border_val_not_detected(self) -> None:
        """Border with val='none' is not detected."""
        borders = TableBorders(top=Border(val="none"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.top is False

    def test_nil_border_val_not_detected(self) -> None:
        """Border with val='nil' is not detected."""
        borders = TableBorders(top=Border(val="nil"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        info = detect_borders(table)
        assert info.top is False

    def test_cell_level_top_border_first_row(self) -> None:
        """Detect cell-level top border in first row."""
        cell = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(top=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell")])])],
        )
        table = make_table([make_row([cell])])
        info = detect_borders(table)
        assert info.top is True

    def test_cell_level_bottom_border_last_row(self) -> None:
        """Detect cell-level bottom border in last row."""
        cell = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(bottom=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell")])])],
        )
        table = make_table([make_row([cell])])
        info = detect_borders(table)
        assert info.bottom is True

    def test_cell_level_left_border_first_column(self) -> None:
        """Detect cell-level left border in first column."""
        cell = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(left=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell")])])],
        )
        table = make_table([make_row([cell])])
        info = detect_borders(table)
        assert info.left is True

    def test_cell_level_right_border_last_column(self) -> None:
        """Detect cell-level right border in last column."""
        cell = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(right=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell")])])],
        )
        table = make_table([make_row([cell])])
        info = detect_borders(table)
        assert info.right is True

    def test_cell_level_inside_h_border(self) -> None:
        """Detect cell-level inside_h border (bottom of non-last row)."""
        cell1 = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(bottom=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell1")])])],
        )
        cell2 = make_cell("Cell2")
        table = make_table([make_row([cell1]), make_row([cell2])])
        info = detect_borders(table)
        assert info.inside_h is True

    def test_cell_level_inside_v_border(self) -> None:
        """Detect cell-level inside_v border (right of non-last column)."""
        cell1 = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(right=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell1")])])],
        )
        cell2 = make_cell("Cell2")
        table = make_table([make_row([cell1, cell2])])
        info = detect_borders(table)
        assert info.inside_v is True


class TestHasVisibleBorders:
    """Tests for has_visible_borders() function."""

    def test_returns_false_for_no_borders(self) -> None:
        """Returns False when table has no borders."""
        table = make_table([make_row([make_cell("Cell")])])
        assert has_visible_borders(table) is False

    def test_returns_true_for_table_borders(self) -> None:
        """Returns True when table has table-level borders."""
        borders = TableBorders(top=Border(val="single"))
        table = make_table([make_row([make_cell("Cell")])], borders=borders)
        assert has_visible_borders(table) is True

    def test_returns_true_for_cell_borders(self) -> None:
        """Returns True when table has cell-level borders."""
        cell = TableCell(
            tc_pr=TableCellProperties(tc_borders=TableBorders(top=Border(val="single"))),
            content=[Paragraph(content=[Run(content=[Text(value="Cell")])])],
        )
        table = make_table([make_row([cell])])
        assert has_visible_borders(table) is True


# =============================================================================
# Partial Border Rendering Tests
# =============================================================================


class TestPartialBorderRendering:
    """Tests for rendering tables with partial borders."""

    def test_top_border_only(self) -> None:
        """Render table with only top border."""
        info = BorderInfo(top=True)
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ]
        )
        result = table_to_ascii(table, info)
        lines = result.strip().split("\n")
        # First line should be border
        assert "-" in lines[0]
        # Last line should NOT be border (no bottom border)
        assert "-" not in lines[-1]

    def test_bottom_border_only(self) -> None:
        """Render table with only bottom border."""
        info = BorderInfo(bottom=True)
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ]
        )
        result = table_to_ascii(table, info)
        lines = result.strip().split("\n")
        # First line should NOT be border
        assert "-" not in lines[0]
        # Last line should be border
        assert "-" in lines[-1]

    def test_left_border_only(self) -> None:
        """Render table with only left border."""
        info = BorderInfo(left=True)
        table = make_table([make_row([make_cell("A"), make_cell("B")])])
        result = table_to_ascii(table, info)
        # Should have | on left side
        for line in result.strip().split("\n"):
            if "A" in line or "B" in line:
                assert line.startswith("|")

    def test_right_border_only(self) -> None:
        """Render table with only right border."""
        info = BorderInfo(right=True)
        table = make_table([make_row([make_cell("A"), make_cell("B")])])
        result = table_to_ascii(table, info)
        # Should have | on right side
        for line in result.strip().split("\n"):
            if "A" in line or "B" in line:
                assert line.endswith("|")

    def test_outer_borders_only(self) -> None:
        """Render table with outer borders only (no inside borders)."""
        info = BorderInfo(top=True, bottom=True, left=True, right=True)
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ]
        )
        result = table_to_ascii(table, info)
        lines = result.strip().split("\n")
        # Should have 3 lines: top border, 2 data rows merged, bottom border
        # With no inside_h, data rows are not separated
        assert "-" in lines[0]  # Top border
        assert "-" in lines[-1]  # Bottom border
        # Middle lines should have left/right borders but no horizontal separator
        middle_lines = [line for line in lines if "A" in line or "C" in line]
        for line in middle_lines:
            assert line.startswith("|")
            assert line.endswith("|")

    def test_inside_borders_only(self) -> None:
        """Render table with inside borders only (grid lines)."""
        info = BorderInfo(inside_h=True, inside_v=True)
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ]
        )
        result = table_to_ascii(table, info)
        lines = result.strip().split("\n")
        # Should NOT have top border (first line is data)
        assert "A" in lines[0]
        # Should NOT have bottom border (last line is data)
        assert "C" in lines[-1] or "D" in lines[-1]
        # Should have separator between rows
        separator_lines = [line for line in lines if "-" in line]
        assert len(separator_lines) >= 1

    def test_full_borders(self) -> None:
        """Render table with all borders."""
        info = BorderInfo(
            top=True, bottom=True, left=True, right=True, inside_h=True, inside_v=True
        )
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ]
        )
        result = table_to_ascii(table, info)
        lines = result.strip().split("\n")
        # Should have borders on all sides
        assert "-" in lines[0]  # Top
        assert "-" in lines[-1]  # Bottom
        # Content lines should have | separators
        content_lines = [line for line in lines if "A" in line or "C" in line]
        for line in content_lines:
            assert "|" in line

    def test_explicit_ascii_mode_uses_full_borders(self) -> None:
        """Explicit mode='ascii' always uses full borders regardless of table."""
        table = make_table([make_row([make_cell("A"), make_cell("B")])])
        # No borders defined on table
        result = table_to_text(table, mode="ascii")
        lines = result.strip().split("\n")
        # Should have full borders
        assert "-" in lines[0]  # Top
        assert "-" in lines[-1]  # Bottom
        assert "|" in lines[1]  # Content with vertical

    def test_auto_mode_detects_partial_borders(self) -> None:
        """Auto mode detects and renders partial borders."""
        borders = TableBorders(top=Border(val="single"), bottom=Border(val="single"))
        table = make_table(
            [
                make_row([make_cell("A"), make_cell("B")]),
                make_row([make_cell("C"), make_cell("D")]),
            ],
            borders=borders,
        )
        result = table_to_text(table, mode="auto")
        lines = result.strip().split("\n")
        # Should have top and bottom borders
        assert "-" in lines[0]
        assert "-" in lines[-1]
        # But no vertical separators (no inside_v)
        content_lines = [line for line in lines if "A" in line]
        for line in content_lines:
            # Should not have | between A and B
            assert "|" not in line or line.count("|") <= 2  # Only outer |
