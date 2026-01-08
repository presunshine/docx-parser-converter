"""Table to text converter.

Converts Table elements to plain text in various modes (ASCII, tabs, plain).
"""

from dataclasses import dataclass
from typing import Literal

from ...models.document.paragraph import Paragraph
from ...models.document.table import Table
from ...models.document.table_cell import TableCell
from ...models.document.table_row import TableRow
from .paragraph_to_text import paragraph_to_text

# =============================================================================
# Type Definitions
# =============================================================================


TableMode = Literal["ascii", "tabs", "plain", "auto"]


@dataclass
class BorderInfo:
    """Information about which table borders are present."""

    top: bool = False
    bottom: bool = False
    left: bool = False
    right: bool = False
    inside_h: bool = False  # Horizontal lines between rows
    inside_v: bool = False  # Vertical lines between columns

    @property
    def has_any(self) -> bool:
        """Check if any border is present."""
        return any([self.top, self.bottom, self.left, self.right, self.inside_h, self.inside_v])


# =============================================================================
# Cell Content Extraction
# =============================================================================


def cell_to_text(cell: TableCell | None) -> str:
    """Extract text content from a table cell.

    Args:
        cell: TableCell element or None

    Returns:
        Text content of the cell
    """
    if cell is None:
        return ""

    parts = []
    for content in cell.content:
        if isinstance(content, Paragraph):
            text = paragraph_to_text(content)
            if text:
                parts.append(text)

    return "\n".join(parts)


def row_to_text(row: TableRow | None, separator: str = "\t") -> str:
    """Extract text content from a table row.

    Args:
        row: TableRow element or None
        separator: Cell separator string

    Returns:
        Text content of the row
    """
    if row is None:
        return ""

    cells = []
    for cell in row.tc:
        text = cell_to_text(cell)
        cells.append(text)

    return separator.join(cells)


# =============================================================================
# Border Detection
# =============================================================================


def _is_border_visible(border) -> bool:
    """Check if a single border is visible."""
    return border is not None and border.val is not None and border.val not in ("none", "nil")


def _is_border_explicitly_none(border) -> bool:
    """Check if a border is explicitly set to none/nil."""
    return border is not None and border.val is not None and border.val in ("none", "nil")


def detect_borders(table: Table) -> BorderInfo:
    """Detect which borders are present on the table.

    Cell-level borders override table-level borders in OOXML.
    Checks cell borders first, then falls back to table borders.

    Args:
        table: Table element

    Returns:
        BorderInfo with flags for each border type
    """
    info = BorderInfo()

    if not table.tr:
        return info

    # Track whether all cells explicitly set borders to none (override table borders)
    all_cells_have_no_top = True
    all_cells_have_no_bottom = True
    all_cells_have_no_left = True
    all_cells_have_no_right = True
    all_cells_have_no_inside_h = True
    all_cells_have_no_inside_v = True

    # First pass: check all cell-level borders
    for row_idx, row in enumerate(table.tr):
        for col_idx, cell in enumerate(row.tc):
            if cell.tc_pr and cell.tc_pr.tc_borders:
                cb = cell.tc_pr.tc_borders

                # Check if cell has visible borders
                if row_idx == 0 and _is_border_visible(cb.top):
                    info.top = True
                if row_idx == len(table.tr) - 1 and _is_border_visible(cb.bottom):
                    info.bottom = True
                if col_idx == 0 and _is_border_visible(cb.left):
                    info.left = True
                if col_idx == len(row.tc) - 1 and _is_border_visible(cb.right):
                    info.right = True
                if row_idx < len(table.tr) - 1 and _is_border_visible(cb.bottom):
                    info.inside_h = True
                if row_idx > 0 and _is_border_visible(cb.top):
                    info.inside_h = True
                if col_idx < len(row.tc) - 1 and _is_border_visible(cb.right):
                    info.inside_v = True
                if col_idx > 0 and _is_border_visible(cb.left):
                    info.inside_v = True

                # Track if NOT explicitly none (means we can't override table borders)
                if row_idx == 0 and not _is_border_explicitly_none(cb.top):
                    all_cells_have_no_top = False
                if row_idx == len(table.tr) - 1 and not _is_border_explicitly_none(cb.bottom):
                    all_cells_have_no_bottom = False
                if col_idx == 0 and not _is_border_explicitly_none(cb.left):
                    all_cells_have_no_left = False
                if col_idx == len(row.tc) - 1 and not _is_border_explicitly_none(cb.right):
                    all_cells_have_no_right = False
                if row_idx < len(table.tr) - 1 and not _is_border_explicitly_none(cb.bottom):
                    all_cells_have_no_inside_h = False
                if row_idx > 0 and not _is_border_explicitly_none(cb.top):
                    all_cells_have_no_inside_h = False
                if col_idx < len(row.tc) - 1 and not _is_border_explicitly_none(cb.right):
                    all_cells_have_no_inside_v = False
                if col_idx > 0 and not _is_border_explicitly_none(cb.left):
                    all_cells_have_no_inside_v = False
            else:
                # Cell doesn't define borders - can't override table borders
                if row_idx == 0:
                    all_cells_have_no_top = False
                if row_idx == len(table.tr) - 1:
                    all_cells_have_no_bottom = False
                if col_idx == 0:
                    all_cells_have_no_left = False
                if col_idx == len(row.tc) - 1:
                    all_cells_have_no_right = False
                all_cells_have_no_inside_h = False
                all_cells_have_no_inside_v = False

    # If cells already detected visible borders, return early
    if info.has_any:
        return info

    # If all cells explicitly set borders to none, those override table borders
    # Only fall back to table borders for border types not explicitly set to none
    if table.tbl_pr and table.tbl_pr.tbl_borders:
        borders = table.tbl_pr.tbl_borders
        if not all_cells_have_no_top:
            info.top = _is_border_visible(borders.top)
        if not all_cells_have_no_bottom:
            info.bottom = _is_border_visible(borders.bottom)
        if not all_cells_have_no_left:
            info.left = _is_border_visible(borders.left)
        if not all_cells_have_no_right:
            info.right = _is_border_visible(borders.right)
        if not all_cells_have_no_inside_h:
            info.inside_h = _is_border_visible(borders.inside_h)
        if not all_cells_have_no_inside_v:
            info.inside_v = _is_border_visible(borders.inside_v)

    return info


def has_visible_borders(table: Table) -> bool:
    """Check if table has visible borders.

    Args:
        table: Table element

    Returns:
        True if table has visible borders
    """
    return detect_borders(table).has_any


# =============================================================================
# ASCII Box Mode
# =============================================================================


def table_to_ascii(table: Table, border_info: BorderInfo | None = None) -> str:
    """Convert table to ASCII box format with partial border support.

    Args:
        table: Table element
        border_info: Optional border info (detected if not provided)

    Returns:
        ASCII box representation matching actual borders
    """
    if not table.tr:
        return ""

    # Detect borders if not provided
    if border_info is None:
        border_info = detect_borders(table)

    # Extract all cell contents and calculate column widths
    rows_data: list[list[str]] = []
    max_cols = 0

    for row in table.tr:
        cells = []
        for cell in row.tc:
            text = cell_to_text(cell)
            # Replace newlines in cell with space for single-line cells
            text = text.replace("\n", " ")
            cells.append(text)
        rows_data.append(cells)
        max_cols = max(max_cols, len(cells))

    if not rows_data:
        return ""

    # Pad rows to have same number of columns
    for row in rows_data:
        while len(row) < max_cols:
            row.append("")

    # Calculate column widths
    col_widths = []
    for col_idx in range(max_cols):
        max_width = 1  # Minimum width
        for row in rows_data:
            if col_idx < len(row):
                max_width = max(max_width, len(row[col_idx]))
        col_widths.append(max_width)

    # Build ASCII table with partial borders
    lines = []

    # Characters for borders
    h_char = "-"  # Horizontal line character
    corner = "+"

    # Helper to build horizontal line
    def build_h_line(left: bool, right: bool, inside_v: bool) -> str:
        if inside_v:
            inner = corner.join(h_char * (w + 2) for w in col_widths)
        else:
            inner = h_char * (sum(col_widths) + 3 * (max_cols - 1) + 2)
        left_char = corner if left else h_char
        right_char = corner if right else h_char
        return left_char + inner + right_char

    # Helper to build data row
    def build_data_row(row: list[str], left: bool, right: bool, inside_v: bool) -> str:
        cells = []
        for col_idx, cell in enumerate(row):
            width = col_widths[col_idx]
            cells.append(f" {cell.ljust(width)} ")

        if inside_v:
            inner = "|".join(cells)
        else:
            inner = " ".join(cells)

        left_char = "|" if left else " "
        right_char = "|" if right else " "
        return left_char + inner + right_char

    # Top border (only if has top border)
    if border_info.top:
        lines.append(build_h_line(border_info.left, border_info.right, border_info.inside_v))

    # Data rows
    for row_idx, row in enumerate(rows_data):
        # Row content
        lines.append(build_data_row(row, border_info.left, border_info.right, border_info.inside_v))

        # Row separator (between rows) - only if has inside_h border
        if row_idx < len(rows_data) - 1 and border_info.inside_h:
            lines.append(build_h_line(border_info.left, border_info.right, border_info.inside_v))

    # Bottom border (only if has bottom border)
    if border_info.bottom:
        lines.append(build_h_line(border_info.left, border_info.right, border_info.inside_v))

    return "\n".join(lines)


# =============================================================================
# Tab-Separated Mode
# =============================================================================


def table_to_tabs(table: Table) -> str:
    """Convert table to tab-separated format.

    Args:
        table: Table element

    Returns:
        Tab-separated representation
    """
    if not table.tr:
        return ""

    lines = []
    for row in table.tr:
        line = row_to_text(row, separator="\t")
        lines.append(line)

    return "\n".join(lines)


# =============================================================================
# Plain Text Mode
# =============================================================================


def table_to_plain(table: Table) -> str:
    """Convert table to plain text format.

    Args:
        table: Table element

    Returns:
        Plain text representation
    """
    if not table.tr:
        return ""

    lines = []
    for row in table.tr:
        line = row_to_text(row, separator="  ")
        lines.append(line)

    return "\n".join(lines)


# =============================================================================
# Main Entry Point
# =============================================================================


def table_to_text(
    table: Table | None,
    mode: TableMode = "auto",
) -> str:
    """Convert a Table to text.

    Args:
        table: Table element or None
        mode: Table rendering mode (ascii, tabs, plain, auto)

    Returns:
        Text representation of the table
    """
    if table is None:
        return ""

    if not table.tr:
        return ""

    # Determine actual mode for auto
    actual_mode = mode
    if mode == "auto":
        actual_mode = "ascii" if has_visible_borders(table) else "tabs"

    # Convert based on mode
    if actual_mode == "ascii":
        if mode == "ascii":
            # Explicit ascii mode: use full borders
            full_borders = BorderInfo(
                top=True, bottom=True, left=True, right=True, inside_h=True, inside_v=True
            )
            return table_to_ascii(table, full_borders)
        else:
            # Auto mode with borders: use detected partial borders
            return table_to_ascii(table)
    elif actual_mode == "tabs":
        return table_to_tabs(table)
    else:  # plain
        return table_to_plain(table)


# =============================================================================
# Table to Text Converter Class
# =============================================================================


class TableToTextConverter:
    """Converter for Table elements to plain text."""

    mode: TableMode

    def __init__(
        self,
        *,
        mode: TableMode = "auto",
    ) -> None:
        """Initialize table converter.

        Args:
            mode: Table rendering mode (ascii, tabs, plain, auto)
        """
        self.mode = mode

    def convert(self, table: Table | None) -> str:
        """Convert a Table to text.

        Args:
            table: Table element or None

        Returns:
            Text representation
        """
        return table_to_text(table, mode=self.mode)
