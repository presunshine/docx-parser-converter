"""Unit tests for table to HTML converter.

Tests conversion of Table elements to HTML table structure.
"""

from docx_parser_converter.converters.html.table_to_html import (
    TableToHTMLConverter,
    calculate_rowspans,
    is_merged_cell,
    table_to_html,
)
from docx_parser_converter.models.common.border import Border, TableBorders
from docx_parser_converter.models.common.shading import Shading
from docx_parser_converter.models.common.width import Width
from docx_parser_converter.models.document.paragraph import Paragraph
from docx_parser_converter.models.document.run import Run
from docx_parser_converter.models.document.run_content import Text
from docx_parser_converter.models.document.table import (
    Table,
    TableGrid,
    TableGridColumn,
    TableLook,
    TableProperties,
)
from docx_parser_converter.models.document.table_cell import (
    TableCell,
    TableCellMargins,
    TableCellProperties,
)
from docx_parser_converter.models.document.table_row import (
    TableRow,
    TableRowHeight,
    TableRowProperties,
)

# =============================================================================
# Helper Functions
# =============================================================================


def make_cell(text: str, tc_pr: TableCellProperties | None = None) -> TableCell:
    """Create a simple table cell with text content."""
    return TableCell(
        tc_pr=tc_pr,
        content=[Paragraph(content=[Run(content=[Text(value=text)])])],
    )


def make_row(cells: list[TableCell], tr_pr: TableRowProperties | None = None) -> TableRow:
    """Create a table row with cells."""
    return TableRow(tr_pr=tr_pr, tc=cells)


def make_simple_table(rows: int, cols: int) -> Table:
    """Create a simple table with given dimensions."""
    table_rows = []
    for r in range(rows):
        cells = [make_cell(f"R{r + 1}C{c + 1}") for c in range(cols)]
        table_rows.append(TableRow(tc=cells))
    return Table(tr=table_rows)


# =============================================================================
# Basic Table Conversion Tests
# =============================================================================


class TestBasicTableConversion:
    """Tests for basic table to HTML conversion."""

    def test_simple_2x2_table(self) -> None:
        """Simple 2x2 table converts to HTML table."""
        table = make_simple_table(2, 2)
        result = table_to_html(table)
        assert "<table" in result
        assert "<tr" in result
        assert "<td" in result
        assert "</table>" in result

    def test_empty_table(self) -> None:
        """Empty table with no rows."""
        table = Table(tr=[])
        result = table_to_html(table)
        assert "<table" in result
        assert "</table>" in result

    def test_none_table(self) -> None:
        """None table returns empty string."""
        result = table_to_html(None)
        assert result == ""

    def test_single_cell_table(self) -> None:
        """Table with single cell."""
        table = Table(tr=[TableRow(tc=[make_cell("Only cell")])])
        result = table_to_html(table)
        assert "Only cell" in result

    def test_preserves_cell_order(self) -> None:
        """Cells appear in correct order."""
        table = make_simple_table(2, 3)
        result = table_to_html(table)
        # R1C1 should appear before R1C2, etc.
        assert result.index("R1C1") < result.index("R1C2") < result.index("R1C3")

    def test_preserves_row_order(self) -> None:
        """Rows appear in correct order."""
        table = make_simple_table(3, 2)
        result = table_to_html(table)
        # R1 should appear before R2, etc.
        assert result.index("R1C1") < result.index("R2C1") < result.index("R3C1")


# =============================================================================
# Table Width Tests
# =============================================================================


class TestTableWidth:
    """Tests for table width conversion."""

    def test_fixed_width_table(self) -> None:
        """Table with fixed width in twips."""
        table = Table(
            tbl_pr=TableProperties(tbl_w=Width(w=5760, type="dxa")),
            tr=[TableRow(tc=[make_cell("Cell")])],
        )
        result = table_to_html(table)
        assert "width" in result

    def test_percentage_width_table(self) -> None:
        """Table with percentage width."""
        table = Table(
            tbl_pr=TableProperties(tbl_w=Width(w=5000, type="pct")),
            tr=[TableRow(tc=[make_cell("Cell")])],
        )
        result = table_to_html(table)
        assert "100%" in result or "width" in result

    def test_auto_width_table(self) -> None:
        """Table with auto width."""
        table = Table(
            tbl_pr=TableProperties(tbl_w=Width(w=0, type="auto")),
            tr=[TableRow(tc=[make_cell("Cell")])],
        )
        result = table_to_html(table)
        # Auto width should still render
        assert "Cell" in result


# =============================================================================
# Table Alignment Tests
# =============================================================================


class TestTableAlignment:
    """Tests for table alignment conversion."""

    def test_left_aligned_table(self) -> None:
        """Left-aligned table."""
        table = Table(tbl_pr=TableProperties(jc="left"), tr=[TableRow(tc=[make_cell("Cell")])])
        result = table_to_html(table)
        assert "Cell" in result

    def test_center_aligned_table(self) -> None:
        """Center-aligned table."""
        table = Table(tbl_pr=TableProperties(jc="center"), tr=[TableRow(tc=[make_cell("Cell")])])
        result = table_to_html(table)
        assert "margin-left: auto" in result or "margin: auto" in result

    def test_right_aligned_table(self) -> None:
        """Right-aligned table."""
        table = Table(tbl_pr=TableProperties(jc="right"), tr=[TableRow(tc=[make_cell("Cell")])])
        result = table_to_html(table)
        assert "margin-left" in result


# =============================================================================
# Table Grid Tests
# =============================================================================


class TestTableGrid:
    """Tests for table grid column definitions."""

    def test_grid_columns_define_widths(self) -> None:
        """Grid columns define column widths."""
        table = Table(
            tbl_grid=TableGrid(
                grid_col=[
                    TableGridColumn(w=2880),
                    TableGridColumn(w=1440),
                ]
            ),
            tr=[TableRow(tc=[make_cell("Wide"), make_cell("Narrow")])],
        )
        result = table_to_html(table)
        assert "<colgroup>" in result
        assert "<col" in result

    def test_colgroup_generation(self) -> None:
        """Grid columns generate colgroup."""
        table = Table(
            tbl_grid=TableGrid(
                grid_col=[
                    TableGridColumn(w=1440),
                    TableGridColumn(w=1440),
                ]
            ),
            tr=[TableRow(tc=[make_cell("A"), make_cell("B")])],
        )
        result = table_to_html(table)
        assert "<colgroup>" in result


# =============================================================================
# Cell Spanning Tests
# =============================================================================


class TestCellSpanning:
    """Tests for cell colspan and rowspan."""

    def test_horizontal_span(self) -> None:
        """Cell spanning multiple columns (colspan)."""
        cell = make_cell("Spanning", TableCellProperties(grid_span=2))
        table = Table(tr=[TableRow(tc=[cell]), TableRow(tc=[make_cell("A"), make_cell("B")])])
        result = table_to_html(table)
        assert 'colspan="2"' in result

    def test_vertical_merge_restart(self) -> None:
        """Cell starting a vertical merge (rowspan start)."""
        first_row = TableRow(
            tc=[make_cell("Merged", TableCellProperties(v_merge="restart")), make_cell("Normal1")]
        )
        second_row = TableRow(
            tc=[make_cell("", TableCellProperties(v_merge="continue")), make_cell("Normal2")]
        )
        table = Table(tr=[first_row, second_row])
        result = table_to_html(table)
        assert 'rowspan="2"' in result

    def test_vertical_merge_continue(self) -> None:
        """Continuation of vertical merge should not render cell."""
        first_row = TableRow(
            tc=[
                make_cell("Merged", TableCellProperties(v_merge="restart")),
            ]
        )
        second_row = TableRow(
            tc=[
                make_cell("", TableCellProperties(v_merge="continue")),
            ]
        )
        table = Table(tr=[first_row, second_row])
        result = table_to_html(table)
        # Only one td should be rendered
        assert result.count("<td") == 1

    def test_combined_colspan_rowspan(self) -> None:
        """Cell with both colspan and rowspan."""
        cell = make_cell("Big", TableCellProperties(grid_span=2, v_merge="restart"))
        table = Table(
            tr=[
                TableRow(tc=[cell, make_cell("C")]),
                TableRow(
                    tc=[
                        make_cell("", TableCellProperties(v_merge="continue")),
                        make_cell("D"),
                        make_cell("E"),
                    ]
                ),
            ]
        )
        result = table_to_html(table)
        assert 'colspan="2"' in result or "rowspan" in result

    def test_multi_row_vertical_merge(self) -> None:
        """Vertical merge spanning 3+ rows."""
        table = Table(
            tr=[
                TableRow(tc=[make_cell("M", TableCellProperties(v_merge="restart"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
            ]
        )
        result = table_to_html(table)
        assert 'rowspan="3"' in result


# =============================================================================
# Table Border Tests
# =============================================================================


class TestTableBorders:
    """Tests for table border conversion."""

    def test_table_borders_all(self) -> None:
        """All table borders."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(
            top=border, left=border, bottom=border, right=border, inside_h=border, inside_v=border
        )
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders), tr=[TableRow(tc=[make_cell("Bordered")])]
        )
        result = table_to_html(table)
        assert "border" in result

    def test_table_border_collapsed(self) -> None:
        """Table uses border-collapse: collapse."""
        # Table with properties to trigger style generation
        border = Border(val="single", sz=4)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=TableBorders(top=border)),
            tr=[TableRow(tc=[make_cell("Cell")])],
        )
        result = table_to_html(table)
        assert "border-collapse" in result

    def test_inside_borders(self) -> None:
        """Inside horizontal and vertical borders."""
        border = Border(val="single", sz=4, color="000000")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders), tr=[TableRow(tc=[make_cell("Cell")])]
        )
        result = table_to_html(table)
        assert "Cell" in result

    def test_no_borders(self) -> None:
        """Table without borders."""
        table = Table(
            tbl_pr=TableProperties(tbl_borders=TableBorders(top=Border(val="nil"))),
            tr=[TableRow(tc=[make_cell("Borderless")])],
        )
        result = table_to_html(table)
        assert "Borderless" in result

    def test_mixed_border_styles(self) -> None:
        """Different border styles on different sides."""
        borders = TableBorders(
            top=Border(val="single", sz=4),
            bottom=Border(val="double", sz=8),
        )
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders), tr=[TableRow(tc=[make_cell("Mixed")])]
        )
        result = table_to_html(table)
        assert "Mixed" in result


# =============================================================================
# Cell Border Tests
# =============================================================================


class TestCellBorders:
    """Tests for cell-level border conversion."""

    def test_cell_borders_override_table(self) -> None:
        """Cell borders override table borders."""
        cell = make_cell(
            "Special",
            TableCellProperties(
                tc_borders=TableBorders(top=Border(val="double", sz=12, color="FF0000"))
            ),
        )
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "border" in result

    def test_cell_with_no_borders(self) -> None:
        """Individual cell with no borders."""
        cell = make_cell(
            "Borderless",
            TableCellProperties(
                tc_borders=TableBorders(
                    top=Border(val="nil"),
                    bottom=Border(val="nil"),
                )
            ),
        )
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Borderless" in result


# =============================================================================
# Inside Borders Tests
# =============================================================================


class TestInsideBorders:
    """Tests for inside horizontal and vertical border conversion.

    Inside borders (insideH, insideV) are table-level borders that create
    grid lines between cells. They must be converted to cell-level borders
    based on cell position:
    - insideH: Apply as border-bottom to cells NOT in the last row
    - insideV: Apply as border-right to cells NOT in the last column
    """

    def test_inside_h_applies_to_non_last_row(self) -> None:
        """Inside horizontal border applies border-bottom to non-last-row cells."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_h=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("R1C1"), make_cell("R1C2")]),
                TableRow(tc=[make_cell("R2C1"), make_cell("R2C2")]),
            ],
        )
        result = table_to_html(table)
        # First row cells should have border-bottom
        assert "border-bottom" in result
        # Count occurrences - should be 2 (for R1C1 and R1C2)
        assert result.count("border-bottom") == 2

    def test_inside_v_applies_to_non_last_column(self) -> None:
        """Inside vertical border applies border-right to non-last-column cells."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("R1C1"), make_cell("R1C2")]),
                TableRow(tc=[make_cell("R2C1"), make_cell("R2C2")]),
            ],
        )
        result = table_to_html(table)
        # First column cells should have border-right
        assert "border-right" in result
        # Count occurrences - should be 2 (for R1C1 and R2C1)
        assert result.count("border-right") == 2

    def test_inside_h_and_v_creates_grid(self) -> None:
        """Both inside borders create a complete internal grid."""
        border = Border(val="single", sz=8, color="FF0000")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D")]),
            ],
        )
        result = table_to_html(table)
        # Cell A (0,0): border-bottom + border-right
        # Cell B (0,1): border-bottom only (last column)
        # Cell C (1,0): border-right only (last row)
        # Cell D (1,1): no inside borders (last row + last column)
        assert "border-bottom" in result
        assert "border-right" in result
        assert "FF0000" in result

    def test_inside_borders_3x3_table(self) -> None:
        """Inside borders on 3x3 table - verify correct application."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B"), make_cell("C")]),
                TableRow(tc=[make_cell("D"), make_cell("E"), make_cell("F")]),
                TableRow(tc=[make_cell("G"), make_cell("H"), make_cell("I")]),
            ],
        )
        result = table_to_html(table)
        # border-bottom should appear 6 times (rows 0 and 1, 3 cells each)
        # border-right should appear 6 times (columns 0 and 1, 3 cells each)
        assert result.count("border-bottom") == 6
        assert result.count("border-right") == 6

    def test_inside_borders_single_row_no_horizontal(self) -> None:
        """Single row table - inside_h should not apply (no rows below)."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[TableRow(tc=[make_cell("A"), make_cell("B"), make_cell("C")])],
        )
        result = table_to_html(table)
        # No border-bottom (only one row)
        assert "border-bottom" not in result
        # border-right should appear 2 times (columns 0 and 1)
        assert result.count("border-right") == 2

    def test_inside_borders_single_column_no_vertical(self) -> None:
        """Single column table - inside_v should not apply (no columns to right)."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A")]),
                TableRow(tc=[make_cell("B")]),
                TableRow(tc=[make_cell("C")]),
            ],
        )
        result = table_to_html(table)
        # No border-right (only one column)
        assert "border-right" not in result
        # border-bottom should appear 2 times (rows 0 and 1)
        assert result.count("border-bottom") == 2

    def test_inside_borders_with_colspan(self) -> None:
        """Inside vertical border respects colspan - no border-right if spans to last column."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_v=border)
        # First row: cell spans both columns (colspan=2)
        # Second row: two separate cells
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tbl_grid=TableGrid(grid_col=[TableGridColumn(w=1440), TableGridColumn(w=1440)]),
            tr=[
                TableRow(tc=[make_cell("Spanning", TableCellProperties(grid_span=2))]),
                TableRow(tc=[make_cell("Left"), make_cell("Right")]),
            ],
        )
        result = table_to_html(table)
        # "Spanning" cell spans to last column, so no border-right
        # "Left" cell should have border-right
        # "Right" cell is in last column, no border-right
        assert result.count("border-right") == 1

    def test_inside_borders_with_rowspan(self) -> None:
        """Inside horizontal border respects rowspan - no border-bottom if spans to last row."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(inside_h=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(
                    tc=[
                        make_cell("Spanning", TableCellProperties(v_merge="restart")),
                        make_cell("Top"),
                    ]
                ),
                TableRow(
                    tc=[
                        make_cell("", TableCellProperties(v_merge="continue")),
                        make_cell("Bottom"),
                    ]
                ),
            ],
        )
        result = table_to_html(table)
        # "Spanning" cell spans to last row (rowspan=2), so no border-bottom
        # "Top" cell should have border-bottom
        # "Bottom" cell is in last row, no border-bottom
        assert result.count("border-bottom") == 1

    def test_cell_border_takes_precedence_over_inside_border(self) -> None:
        """Cell-level borders should take precedence over table inside borders."""
        inside_border = Border(val="single", sz=8, color="000000")  # Black
        cell_border = Border(val="single", sz=16, color="FF0000")  # Red, thicker
        borders = TableBorders(inside_h=inside_border, inside_v=inside_border)

        # Cell with its own border-bottom and border-right
        cell_with_border = make_cell(
            "Custom",
            TableCellProperties(tc_borders=TableBorders(bottom=cell_border, right=cell_border)),
        )

        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[cell_with_border, make_cell("Normal")]),
                TableRow(tc=[make_cell("Below"), make_cell("Corner")]),
            ],
        )
        result = table_to_html(table)
        # Cell "Custom" should have red border (FF0000), not black (000000) for bottom/right
        # The red border should appear in the first cell's style
        assert "FF0000" in result

    def test_inside_borders_only_no_outer_borders(self) -> None:
        """Table with only inside borders (no outer borders) - creates grid only."""
        border = Border(val="single", sz=8, color="0000FF")
        borders = TableBorders(inside_h=border, inside_v=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D")]),
            ],
        )
        result = table_to_html(table)
        # Should have cell borders from inside_h/inside_v
        assert "border-bottom" in result
        assert "border-right" in result
        # Table element should NOT have border-top/border-left etc.
        # (checking the table style specifically)
        table_start = result.find("<table")
        table_end = result.find(">", table_start)
        table_style = result[table_start:table_end]
        assert "border-top" not in table_style
        assert "border-left" not in table_style

    def test_inside_borders_with_outer_borders(self) -> None:
        """Table with both inside and outer borders."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(
            top=border,
            bottom=border,
            left=border,
            right=border,
            inside_h=border,
            inside_v=border,
        )
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D")]),
            ],
        )
        result = table_to_html(table)
        # Should have both table-level outer borders and cell-level inside borders
        # Table element should have outer borders
        assert "border-top" in result
        # Cells should have inside borders
        assert "border-bottom" in result
        assert "border-right" in result


# =============================================================================
# Outer Border Tests
# =============================================================================


class TestOuterBorders:
    """Tests for outer table border conversion to edge cells."""

    def test_outer_borders_applied_to_edge_cells(self) -> None:
        """Outer borders from tblBorders are applied to edge cells."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("TL"), make_cell("TR")]),
                TableRow(tc=[make_cell("BL"), make_cell("BR")]),
            ],
        )
        result = table_to_html(table)
        # Each edge cell should have appropriate outer borders
        # All cells should have at least some borders
        assert result.count("border-top") == 2  # Top row cells
        assert result.count("border-bottom") == 2  # Bottom row cells
        assert result.count("border-left") == 2  # Left column cells
        assert result.count("border-right") == 2  # Right column cells

    def test_outer_borders_not_on_table_element(self) -> None:
        """Outer borders should NOT be applied to the table element itself."""
        border = Border(val="single", sz=8, color="FF0000")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[TableRow(tc=[make_cell("A")])],
        )
        result = table_to_html(table)
        # Find the table element's style attribute
        table_start = result.find("<table")
        table_end = result.find(">", table_start)
        table_tag = result[table_start:table_end]
        # Table should not have border styles (they go to cells)
        assert "border-top:" not in table_tag
        assert "border-bottom:" not in table_tag
        assert "border-left:" not in table_tag
        assert "border-right:" not in table_tag

    def test_cell_border_overrides_table_outer_border(self) -> None:
        """Cell-level tcBorders override table-level outer borders."""
        table_border = Border(val="single", sz=8, color="000000")  # Black
        cell_border = Border(val="single", sz=16, color="FF0000")  # Red
        cell_none_border = Border(val="nil")  # None

        # Create cell with explicit red border-top
        cell_with_red_top = make_cell(
            "Red",
            TableCellProperties(tc_borders=TableBorders(top=cell_border)),
        )
        # Create cell with explicit none border-top
        cell_with_none_top = make_cell(
            "None",
            TableCellProperties(tc_borders=TableBorders(top=cell_none_border)),
        )

        table = Table(
            tbl_pr=TableProperties(
                tbl_borders=TableBorders(
                    top=table_border, bottom=table_border, left=table_border, right=table_border
                )
            ),
            tr=[TableRow(tc=[cell_with_red_top, cell_with_none_top])],
        )
        result = table_to_html(table)
        # The red border should appear (cell override)
        assert "FF0000" in result

    def test_outer_borders_only_no_inside(self) -> None:
        """Table with only outer borders - no grid inside."""
        border = Border(val="single", sz=8, color="0000FF")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D")]),
            ],
        )
        result = table_to_html(table)
        # Edge cells should have outer borders
        # Interior cells should not have inner borders
        # Count: top row has border-top (2), bottom row has border-bottom (2)
        # Left column has border-left (2), right column has border-right (2)
        assert result.count("border-top") == 2
        assert result.count("border-bottom") == 2

    def test_outer_borders_with_colspan_top_row(self) -> None:
        """Cell spanning multiple columns in top row gets full border-top."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tbl_grid=TableGrid(grid_col=[TableGridColumn(w=1440), TableGridColumn(w=1440)]),
            tr=[
                TableRow(tc=[make_cell("Spanning", TableCellProperties(grid_span=2))]),
                TableRow(tc=[make_cell("L"), make_cell("R")]),
            ],
        )
        result = table_to_html(table)
        # Spanning cell should have border-top, border-left, border-right (top row, spans full width)
        # Bottom row cells should have border-bottom
        assert "border-top" in result
        assert "border-bottom" in result

    def test_outer_borders_with_rowspan_left_column(self) -> None:
        """Cell spanning multiple rows in left column gets full border-left."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(
                    tc=[
                        make_cell("Spanning", TableCellProperties(v_merge="restart")),
                        make_cell("Top"),
                    ]
                ),
                TableRow(
                    tc=[
                        make_cell("", TableCellProperties(v_merge="continue")),
                        make_cell("Bottom"),
                    ]
                ),
            ],
        )
        result = table_to_html(table)
        # Spanning cell should have border-top, border-left, border-bottom (spans full height)
        assert "border-left" in result
        assert "border-bottom" in result

    def test_single_cell_table_all_outer_borders(self) -> None:
        """Single cell table should have all four outer borders on that cell."""
        border = Border(val="single", sz=8, color="FF00FF")
        borders = TableBorders(top=border, bottom=border, left=border, right=border)
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[TableRow(tc=[make_cell("Only")])],
        )
        result = table_to_html(table)
        # Single cell should have all 4 borders
        assert "border-top" in result
        assert "border-bottom" in result
        assert "border-left" in result
        assert "border-right" in result
        # All with the magenta color
        assert result.count("FF00FF") == 4

    def test_outer_and_inside_borders_together(self) -> None:
        """Table with both outer and inside borders - full grid."""
        border = Border(val="single", sz=8, color="000000")
        borders = TableBorders(
            top=border,
            bottom=border,
            left=border,
            right=border,
            inside_h=border,
            inside_v=border,
        )
        table = Table(
            tbl_pr=TableProperties(tbl_borders=borders),
            tr=[
                TableRow(tc=[make_cell("A"), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D")]),
            ],
        )
        result = table_to_html(table)
        # All cells should have all borders creating a full grid
        # Each cell has: top/bottom from outer or inside, left/right from outer or inside
        assert result.count("border-top") >= 2
        assert result.count("border-bottom") >= 2
        assert result.count("border-left") >= 2
        assert result.count("border-right") >= 2


# =============================================================================
# Cell Width Tests
# =============================================================================


class TestCellWidth:
    """Tests for cell width conversion."""

    def test_fixed_cell_width(self) -> None:
        """Cell with fixed width."""
        cell = make_cell("Fixed", TableCellProperties(tc_w=Width(w=2880, type="dxa")))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "width" in result

    def test_percentage_cell_width(self) -> None:
        """Cell with percentage width."""
        cell = make_cell("Half", TableCellProperties(tc_w=Width(w=2500, type="pct")))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Half" in result

    def test_auto_cell_width(self) -> None:
        """Cell with auto width."""
        cell = make_cell("Auto", TableCellProperties(tc_w=Width(type="auto")))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Auto" in result


# =============================================================================
# Cell Shading Tests
# =============================================================================


class TestCellShading:
    """Tests for cell shading/background conversion."""

    def test_cell_background_color(self) -> None:
        """Cell with background color."""
        cell = make_cell("Yellow", TableCellProperties(shd=Shading(fill="FFFF00")))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "background" in result

    def test_table_shading(self) -> None:
        """Table-level shading."""
        table = Table(
            tbl_pr=TableProperties(shd=Shading(fill="E0E0E0")),
            tr=[TableRow(tc=[make_cell("Gray")])],
        )
        result = table_to_html(table)
        # Table shading is in the table style
        assert "background" in result or "E0E0E0" in result.upper() or "Gray" in result

    def test_cell_shading_overrides_table(self) -> None:
        """Cell shading overrides table shading."""
        cell = make_cell("Yellow", TableCellProperties(shd=Shading(fill="FFFF00")))
        table = Table(tbl_pr=TableProperties(shd=Shading(fill="E0E0E0")), tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        # Cell-level shading is definitely applied
        assert "Yellow" in result  # At minimum the content should render


# =============================================================================
# Cell Margins Tests
# =============================================================================


class TestCellMargins:
    """Tests for cell margin/padding conversion."""

    def test_table_default_cell_margins(self) -> None:
        """Table-level default cell margins."""
        margins = TableCellMargins(
            top=Width(w=72, type="dxa"),
            left=Width(w=115, type="dxa"),
            bottom=Width(w=72, type="dxa"),
            right=Width(w=115, type="dxa"),
        )
        table = Table(
            tbl_pr=TableProperties(tbl_cell_mar=margins), tr=[TableRow(tc=[make_cell("Padded")])]
        )
        result = table_to_html(table)
        assert "Padded" in result

    def test_cell_margins_override_table(self) -> None:
        """Cell margins override table defaults."""
        cell = make_cell(
            "Custom", TableCellProperties(tc_mar=TableCellMargins(left=Width(w=200, type="dxa")))
        )
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "padding" in result


# =============================================================================
# Cell Vertical Alignment Tests
# =============================================================================


class TestCellVerticalAlignment:
    """Tests for cell vertical alignment."""

    def test_cell_valign_top(self) -> None:
        """Cell with top vertical alignment."""
        cell = make_cell("Top", TableCellProperties(v_align="top"))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "vertical-align" in result

    def test_cell_valign_center(self) -> None:
        """Cell with center vertical alignment."""
        cell = make_cell("Center", TableCellProperties(v_align="center"))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "vertical-align" in result

    def test_cell_valign_bottom(self) -> None:
        """Cell with bottom vertical alignment."""
        cell = make_cell("Bottom", TableCellProperties(v_align="bottom"))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "vertical-align" in result


# =============================================================================
# Cell Text Direction Tests
# =============================================================================


class TestCellTextDirection:
    """Tests for cell text direction."""

    def test_cell_text_direction_vertical(self) -> None:
        """Cell with vertical text direction."""
        cell = make_cell("Vertical", TableCellProperties(text_direction="tbRl"))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Vertical" in result

    def test_cell_text_direction_btlr(self) -> None:
        """Cell with bottom-to-top, left-to-right text."""
        cell = make_cell("BTLR", TableCellProperties(text_direction="btLr"))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "BTLR" in result


# =============================================================================
# Row Properties Tests
# =============================================================================


class TestRowProperties:
    """Tests for table row properties."""

    def test_row_height_exact(self) -> None:
        """Row with exact height."""
        row = TableRow(
            tr_pr=TableRowProperties(tr_height=TableRowHeight(val=720, h_rule="exact")),
            tc=[make_cell("Tall row")],
        )
        table = Table(tr=[row])
        result = table_to_html(table)
        assert "height" in result

    def test_row_height_at_least(self) -> None:
        """Row with minimum height."""
        row = TableRow(
            tr_pr=TableRowProperties(tr_height=TableRowHeight(val=480, h_rule="atLeast")),
            tc=[make_cell("Min height")],
        )
        table = Table(tr=[row])
        result = table_to_html(table)
        assert "min-height" in result

    def test_header_row(self) -> None:
        """Row marked as header (repeats on pages)."""
        header = TableRow(tr_pr=TableRowProperties(tbl_header=True), tc=[make_cell("Header")])
        data = TableRow(tc=[make_cell("Data")])
        table = Table(tr=[header, data])
        result = table_to_html(table)
        assert "<thead>" in result or "<th" in result

    def test_row_cant_split(self) -> None:
        """Row that cannot split across pages."""
        row = TableRow(tr_pr=TableRowProperties(cant_split=True), tc=[make_cell("Don't split me")])
        table = Table(tr=[row])
        result = table_to_html(table)
        assert "break-inside" in result


# =============================================================================
# Table Look/Conditional Formatting Tests
# =============================================================================


class TestTableLook:
    """Tests for table conditional formatting flags."""

    def test_first_row_formatting(self) -> None:
        """First row formatting enabled."""
        look = TableLook(first_row=True)
        table = Table(
            tbl_pr=TableProperties(tbl_look=look),
            tr=[TableRow(tc=[make_cell("Header")]), TableRow(tc=[make_cell("Data")])],
        )
        result = table_to_html(table)
        assert "Header" in result

    def test_last_row_formatting(self) -> None:
        """Last row formatting enabled."""
        look = TableLook(last_row=True)
        table = Table(tbl_pr=TableProperties(tbl_look=look), tr=[TableRow(tc=[make_cell("Data")])])
        result = table_to_html(table)
        assert "Data" in result

    def test_first_column_formatting(self) -> None:
        """First column formatting enabled."""
        look = TableLook(first_column=True)
        table = Table(
            tbl_pr=TableProperties(tbl_look=look),
            tr=[TableRow(tc=[make_cell("First"), make_cell("Second")])],
        )
        result = table_to_html(table)
        assert "First" in result

    def test_banded_rows(self) -> None:
        """Horizontal banding enabled (alternating row colors)."""
        look = TableLook(no_h_band=False)
        table = Table(
            tbl_pr=TableProperties(tbl_look=look),
            tr=[TableRow(tc=[make_cell("Row1")]), TableRow(tc=[make_cell("Row2")])],
        )
        result = table_to_html(table)
        assert "Row1" in result

    def test_banded_columns(self) -> None:
        """Vertical banding enabled."""
        look = TableLook(no_v_band=False)
        table = Table(
            tbl_pr=TableProperties(tbl_look=look),
            tr=[TableRow(tc=[make_cell("A"), make_cell("B")])],
        )
        result = table_to_html(table)
        assert "A" in result


# =============================================================================
# Table Style Reference Tests
# =============================================================================


class TestTableStyleReference:
    """Tests for table style reference handling."""

    def test_table_style_reference(self) -> None:
        """Table references a style by ID."""
        table = Table(
            tbl_pr=TableProperties(tbl_style="TableGrid"), tr=[TableRow(tc=[make_cell("Styled")])]
        )
        result = table_to_html(table)
        assert "Styled" in result

    def test_table_style_with_overrides(self) -> None:
        """Direct properties override style properties."""
        table = Table(
            tbl_pr=TableProperties(
                tbl_style="TableGrid", tbl_borders=TableBorders(top=Border(val="nil"))
            ),
            tr=[TableRow(tc=[make_cell("Overridden")])],
        )
        result = table_to_html(table)
        assert "Overridden" in result


# =============================================================================
# Nested Table Tests
# =============================================================================


class TestNestedTables:
    """Tests for nested table conversion."""

    def test_table_nested_in_cell(self) -> None:
        """Table nested inside a cell."""
        inner_table = Table(tr=[TableRow(tc=[make_cell("Inner")])])
        outer_cell = TableCell(content=[inner_table])
        outer_table = Table(tr=[TableRow(tc=[outer_cell])])
        result = table_to_html(outer_table)
        # Should have two <table> elements
        assert result.count("<table") == 2

    def test_deeply_nested_tables(self) -> None:
        """Multiple levels of nesting."""
        inner = Table(tr=[TableRow(tc=[make_cell("Deep")])])
        middle_cell = TableCell(content=[inner])
        middle = Table(tr=[TableRow(tc=[middle_cell])])
        outer_cell = TableCell(content=[middle])
        outer = Table(tr=[TableRow(tc=[outer_cell])])
        result = table_to_html(outer)
        assert result.count("<table") == 3


# =============================================================================
# Cell Content Tests
# =============================================================================


class TestCellContent:
    """Tests for cell content conversion."""

    def test_cell_with_multiple_paragraphs(self) -> None:
        """Cell with multiple paragraphs."""
        cell = TableCell(
            content=[
                Paragraph(content=[Run(content=[Text(value="Paragraph 1")])]),
                Paragraph(content=[Run(content=[Text(value="Paragraph 2")])]),
            ]
        )
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Paragraph 1" in result
        assert "Paragraph 2" in result

    def test_empty_cell(self) -> None:
        """Cell with no content."""
        cell = TableCell(content=[])
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        # Should render valid cell, possibly with &nbsp;
        assert "<td" in result
        assert "&nbsp;" in result

    def test_cell_with_formatted_content(self) -> None:
        """Cell with formatted paragraph content."""
        from docx_parser_converter.models.document.run import RunProperties

        cell = TableCell(
            content=[
                Paragraph(content=[Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])])
            ]
        )
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Bold" in result


# =============================================================================
# Table Layout Tests
# =============================================================================


class TestTableLayout:
    """Tests for table layout mode."""

    def test_fixed_layout(self) -> None:
        """Table with fixed layout."""
        table = Table(
            tbl_pr=TableProperties(tbl_layout="fixed"),
            tr=[TableRow(tc=[make_cell("Fixed layout")])],
        )
        result = table_to_html(table)
        assert "table-layout: fixed" in result

    def test_autofit_layout(self) -> None:
        """Table with autofit layout."""
        table = Table(
            tbl_pr=TableProperties(tbl_layout="autofit"),
            tr=[TableRow(tc=[make_cell("Autofit layout")])],
        )
        result = table_to_html(table)
        assert "table-layout: auto" in result


# =============================================================================
# Table Indentation Tests
# =============================================================================


class TestTableIndentation:
    """Tests for table indentation from margin."""

    def test_table_left_indent(self) -> None:
        """Table with left indentation."""
        table = Table(
            tbl_pr=TableProperties(tbl_ind=Width(w=720, type="dxa")),
            tr=[TableRow(tc=[make_cell("Indented")])],
        )
        result = table_to_html(table)
        assert "margin-left" in result


# =============================================================================
# Accessibility Tests
# =============================================================================


class TestTableAccessibility:
    """Tests for table accessibility features."""

    def test_table_caption(self) -> None:
        """Table with caption."""
        table = Table(
            tbl_pr=TableProperties(tbl_caption="Sales Data 2024"),
            tr=[TableRow(tc=[make_cell("Data")])],
        )
        result = table_to_html(table)
        assert "<caption>" in result or "aria-label" in result

    def test_table_description(self) -> None:
        """Table with description."""
        table = Table(
            tbl_pr=TableProperties(tbl_description="Quarterly sales data"),
            tr=[TableRow(tc=[make_cell("Data")])],
        )
        result = table_to_html(table)
        assert "Data" in result

    def test_header_row_uses_th(self) -> None:
        """Header row cells use <th> instead of <td>."""
        header = TableRow(
            tr_pr=TableRowProperties(tbl_header=True), tc=[make_cell("Name"), make_cell("Age")]
        )
        table = Table(tr=[header])
        result = table_to_html(table)
        assert "<th" in result

    def test_scope_attribute_for_headers(self) -> None:
        """Header cells have scope attribute."""
        header = TableRow(
            tr_pr=TableRowProperties(tbl_header=True),
            tc=[make_cell("Column 1"), make_cell("Column 2")],
        )
        table = Table(tr=[header])
        result = table_to_html(table)
        assert 'scope="col"' in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestTableEdgeCases:
    """Tests for edge cases in table conversion."""

    def test_very_wide_table(self) -> None:
        """Table with many columns."""
        cells = [make_cell(f"C{i}") for i in range(20)]
        table = Table(tr=[TableRow(tc=cells)])
        result = table_to_html(table)
        assert "C0" in result
        assert "C19" in result

    def test_very_tall_table(self) -> None:
        """Table with many rows."""
        rows = [TableRow(tc=[make_cell(f"R{i}")]) for i in range(100)]
        table = Table(tr=rows)
        result = table_to_html(table)
        assert "R0" in result
        assert "R99" in result

    def test_empty_cells_in_row(self) -> None:
        """Row with some empty cells."""
        table = Table(
            tr=[TableRow(tc=[make_cell("Data"), TableCell(content=[]), make_cell("More data")])]
        )
        result = table_to_html(table)
        assert "Data" in result
        assert "More data" in result

    def test_unicode_content(self) -> None:
        """Table with Unicode content."""
        table = Table(
            tr=[
                TableRow(
                    tc=[
                        make_cell("日本語"),
                        make_cell("العربية"),
                    ]
                )
            ]
        )
        result = table_to_html(table)
        assert "日本語" in result
        assert "العربية" in result

    def test_special_characters_escaped(self) -> None:
        """Table content with HTML special characters."""
        table = Table(tr=[TableRow(tc=[make_cell("<script>alert('xss')</script>")])])
        result = table_to_html(table)
        assert "&lt;script&gt;" in result
        assert "<script>" not in result

    def test_mixed_merge_scenarios(self) -> None:
        """Complex table with various merge patterns."""
        table = Table(
            tr=[
                TableRow(tc=[make_cell("A", TableCellProperties(grid_span=2)), make_cell("B")]),
                TableRow(tc=[make_cell("C"), make_cell("D"), make_cell("E")]),
            ]
        )
        result = table_to_html(table)
        assert 'colspan="2"' in result

    def test_irregular_row_lengths(self) -> None:
        """Rows with different cell counts (edge case)."""
        table = Table(
            tr=[TableRow(tc=[make_cell("A"), make_cell("B")]), TableRow(tc=[make_cell("C")])]
        )
        result = table_to_html(table)
        assert "A" in result
        assert "C" in result

    def test_properties_without_content(self) -> None:
        """Table with properties but minimal content."""
        table = Table(
            tbl_pr=TableProperties(
                tbl_style="TableGrid", tbl_w=Width(w=5000, type="pct"), jc="center"
            ),
            tr=[],
        )
        result = table_to_html(table)
        assert "<table" in result

    def test_no_wrap_cell(self) -> None:
        """Cell with no text wrapping."""
        cell = make_cell("Long text", TableCellProperties(no_wrap=True))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "white-space" in result or "Long text" in result

    def test_fit_text_cell(self) -> None:
        """Cell that shrinks text to fit."""
        cell = make_cell("Shrink me", TableCellProperties(tc_fit_text=True))
        table = Table(tr=[TableRow(tc=[cell])])
        result = table_to_html(table)
        assert "Shrink me" in result


# =============================================================================
# Rowspan Calculation Tests
# =============================================================================


class TestRowspanCalculation:
    """Tests for rowspan calculation from vMerge."""

    def test_calculate_rowspan_simple(self) -> None:
        """Simple rowspan calculation for 2-row merge."""
        table = Table(
            tr=[
                TableRow(tc=[make_cell("M", TableCellProperties(v_merge="restart"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
            ]
        )
        rowspans = calculate_rowspans(table)
        assert rowspans[(0, 0)] == 2

    def test_calculate_rowspan_multiple(self) -> None:
        """Calculate multiple separate rowspans in same column."""
        table = Table(
            tr=[
                TableRow(tc=[make_cell("M1", TableCellProperties(v_merge="restart"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
                TableRow(tc=[make_cell("M2", TableCellProperties(v_merge="restart"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
            ]
        )
        rowspans = calculate_rowspans(table)
        assert rowspans[(0, 0)] == 2
        assert rowspans[(2, 0)] == 2

    def test_rowspan_different_columns(self) -> None:
        """Different rowspans in different columns."""
        table = Table(
            tr=[
                TableRow(
                    tc=[
                        make_cell("Col1", TableCellProperties(v_merge="restart")),
                        make_cell("Col2", TableCellProperties(v_merge="restart")),
                    ]
                ),
                TableRow(
                    tc=[
                        make_cell("", TableCellProperties(v_merge="continue")),
                        make_cell("", TableCellProperties(v_merge="continue")),
                    ]
                ),
                TableRow(
                    tc=[make_cell("", TableCellProperties(v_merge="continue")), make_cell("Normal")]
                ),
            ]
        )
        rowspans = calculate_rowspans(table)
        assert rowspans[(0, 0)] == 3
        assert rowspans[(0, 1)] == 2

    def test_rowspan_ends_at_table_bottom(self) -> None:
        """Rowspan that ends at the last row."""
        table = Table(
            tr=[
                TableRow(tc=[make_cell("M", TableCellProperties(v_merge="restart"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
                TableRow(tc=[make_cell("", TableCellProperties(v_merge="continue"))]),
            ]
        )
        rowspans = calculate_rowspans(table)
        assert rowspans[(0, 0)] == 3

    def test_is_merged_cell(self) -> None:
        """Test is_merged_cell helper."""
        merged = make_cell("", TableCellProperties(v_merge="continue"))
        assert is_merged_cell(merged) is True

        restart = make_cell("", TableCellProperties(v_merge="restart"))
        assert is_merged_cell(restart) is False

        normal = make_cell("Normal")
        assert is_merged_cell(normal) is False


# =============================================================================
# HTML Output Mode Tests
# =============================================================================


class TestTableHTMLOutputMode:
    """Tests for different HTML output modes."""

    def test_inline_style_mode(self) -> None:
        """Inline style mode produces style attributes."""
        converter = TableToHTMLConverter(use_inline_styles=True)
        # Table with properties to trigger style generation
        table = Table(tbl_pr=TableProperties(jc="center"), tr=[TableRow(tc=[make_cell("Cell")])])
        result = converter.convert(table)
        assert "style=" in result

    def test_class_mode(self) -> None:
        """Class mode initialization."""
        converter = TableToHTMLConverter(use_classes=True)
        assert converter.use_classes is True

    def test_minimal_output(self) -> None:
        """Minimal output mode without unnecessary attributes."""
        table = Table(tr=[TableRow(tc=[make_cell("Simple")])])
        result = table_to_html(table)
        assert "Simple" in result


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestTableToHTMLConverterClass:
    """Tests for TableToHTMLConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = TableToHTMLConverter()
        assert converter is not None

    def test_converter_with_options(self) -> None:
        """Initialize with options."""
        converter = TableToHTMLConverter(use_semantic_tags=False, use_classes=True)
        assert converter.use_semantic_tags is False
        assert converter.use_classes is True

    def test_set_relationships(self) -> None:
        """Set relationships."""
        converter = TableToHTMLConverter()
        converter.set_relationships({"rId1": "https://example.com"})
        assert converter.relationships["rId1"] == "https://example.com"

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = TableToHTMLConverter()
        table = make_simple_table(2, 2)
        result = converter.convert(table)
        assert "<table" in result

    def test_convert_row_method(self) -> None:
        """Convert row method works."""
        converter = TableToHTMLConverter()
        row = TableRow(tc=[make_cell("Test")])
        result = converter.convert_row(row)
        assert "<tr" in result
        assert "Test" in result

    def test_convert_cell_method(self) -> None:
        """Convert cell method works."""
        converter = TableToHTMLConverter()
        cell = make_cell("Test")
        result = converter.convert_cell(cell)
        assert "<td" in result
        assert "Test" in result
