#!/usr/bin/env python3
"""
Create a table test DOCX file manually using XML and zipfile.
No python-docx dependency - just raw XML construction.
"""

import zipfile
from pathlib import Path

# XML namespace declarations
NAMESPACES = """xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
"""


def create_paragraph(text: str, bold: bool = False, size: int = 22) -> str:
    """Create a paragraph XML element."""
    run_props = ""
    if bold:
        run_props += "<w:b/>"
    if size != 22:
        run_props += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'

    rpr = f"<w:rPr>{run_props}</w:rPr>" if run_props else ""

    return f"""<w:p>
      <w:r>
        {rpr}
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""


def parse_border(border_str: str) -> tuple[int, str]:
    """Parse border string like '1pt solid #000000' into (size_eighths, color)."""
    parts = border_str.split()
    if len(parts) >= 3:
        size_pt = float(parts[0].replace("pt", ""))
        size_eighths = int(size_pt * 8)  # Convert to eighths of a point
        color = parts[2].replace("#", "")
        return size_eighths, color
    return 8, "000000"  # Default: 1pt black


def create_table_cell(
    text: str | None = None,
    nested_table: str | None = None,
    bold: bool = False,
    italic: bool = False,
    text_color: str | None = None,
    bg_color: str | None = None,
    border: str | None = None,
    border_top: str | None = None,
    border_bottom: str | None = None,
    border_left: str | None = None,
    border_right: str | None = None,
    colspan: int = 1,
    rowspan: int | None = None,
    rowspan_continue: bool = False,
    width_twips: int = 2000,
) -> str:
    """Create a table cell XML element.

    Args:
        text: Cell text content
        nested_table: XML string of a nested table to put in the cell
        border: All borders (e.g., "1pt solid #000000")
        border_top/bottom/left/right: Individual border sides
    """

    # Cell properties
    tc_pr_parts = []
    tc_pr_parts.append(f'<w:tcW w:w="{width_twips}" w:type="dxa"/>')

    if colspan > 1:
        tc_pr_parts.append(f'<w:gridSpan w:val="{colspan}"/>')

    if rowspan:
        tc_pr_parts.append('<w:vMerge w:val="restart"/>')
    elif rowspan_continue:
        tc_pr_parts.append("<w:vMerge/>")

    if bg_color:
        tc_pr_parts.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/>')

    # Handle borders - individual sides take precedence over 'border'
    has_borders = border or border_top or border_bottom or border_left or border_right
    if has_borders:
        border_parts = []

        if border_top:
            sz, color = parse_border(border_top)
            border_parts.append(
                f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        if border_left:
            sz, color = parse_border(border_left)
            border_parts.append(
                f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        if border_bottom:
            sz, color = parse_border(border_bottom)
            border_parts.append(
                f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        if border_right:
            sz, color = parse_border(border_right)
            border_parts.append(
                f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        if border_parts:
            tc_pr_parts.append(f"<w:tcBorders>{''.join(border_parts)}</w:tcBorders>")

    tc_pr = f"<w:tcPr>{''.join(tc_pr_parts)}</w:tcPr>"

    # Run properties for text styling
    rpr_parts = []
    if bold:
        rpr_parts.append("<w:b/>")
    if italic:
        rpr_parts.append("<w:i/>")
    if text_color:
        rpr_parts.append(f'<w:color w:val="{text_color.replace("#", "")}"/>')

    rpr = f"<w:rPr>{''.join(rpr_parts)}</w:rPr>" if rpr_parts else ""

    # For rowspan continue cells, no content
    if rowspan_continue:
        return f"""<w:tc>
            {tc_pr}
            <w:p><w:r><w:t></w:t></w:r></w:p>
        </w:tc>"""

    # Cell with nested table
    if nested_table:
        text_content = text or ""
        return f"""<w:tc>
        {tc_pr}
        <w:p>
            <w:r>
                {rpr}
                <w:t>{text_content}</w:t>
            </w:r>
        </w:p>
        {nested_table}
    </w:tc>"""

    # Regular cell with text
    return f"""<w:tc>
        {tc_pr}
        <w:p>
            <w:r>
                {rpr}
                <w:t>{text or ""}</w:t>
            </w:r>
        </w:p>
    </w:tc>"""


def create_table_row(cells: list[str]) -> str:
    """Create a table row XML element."""
    return f"""<w:tr>
        {"".join(cells)}
    </w:tr>"""


def create_table(
    rows: list[str],
    num_cols: int,
    border: str | None = None,
    border_top: str | None = None,
    border_bottom: str | None = None,
    border_left: str | None = None,
    border_right: str | None = None,
    border_inside_h: str | None = None,
    border_inside_v: str | None = None,
    width_pct: int | None = None,
    width_twips: int | None = None,
    col_width_twips: int | None = None,
) -> str:
    """Create a table XML element.

    Args:
        rows: List of row XML strings
        num_cols: Number of columns in the table
        border: All borders (e.g., "1pt solid #000000")
        border_top/bottom/left/right: Individual outer border sides
        border_inside_h/v: Inside horizontal/vertical borders
        width_pct: Table width as percentage (e.g., 100 for 100%)
        width_twips: Table width in twips (1 inch = 1440 twips)
        col_width_twips: Width of each column in twips (for grid)
    """
    tbl_pr = "<w:tblPr>"

    # Table width
    if width_pct:
        # Percentage: w:type="pct", value is in fiftieths of a percent
        tbl_pr += f'<w:tblW w:w="{width_pct * 50}" w:type="pct"/>'
    elif width_twips:
        # Fixed width in twips
        tbl_pr += f'<w:tblW w:w="{width_twips}" w:type="dxa"/>'
    else:
        tbl_pr += '<w:tblW w:w="0" w:type="auto"/>'

    # Table layout - fixed ensures width is respected
    tbl_pr += '<w:tblLayout w:type="fixed"/>'

    # Handle table borders
    has_borders = (
        border
        or border_top
        or border_bottom
        or border_left
        or border_right
        or border_inside_h
        or border_inside_v
    )
    if has_borders:
        border_parts = []

        # Top border
        if border_top:
            sz, color = parse_border(border_top)
            border_parts.append(
                f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        # Left border
        if border_left:
            sz, color = parse_border(border_left)
            border_parts.append(
                f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        # Bottom border
        if border_bottom:
            sz, color = parse_border(border_bottom)
            border_parts.append(
                f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        # Right border
        if border_right:
            sz, color = parse_border(border_right)
            border_parts.append(
                f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        # Inside horizontal border
        if border_inside_h:
            sz, color = parse_border(border_inside_h)
            border_parts.append(
                f'<w:insideH w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:insideH w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        # Inside vertical border
        if border_inside_v:
            sz, color = parse_border(border_inside_v)
            border_parts.append(
                f'<w:insideV w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )
        elif border:
            sz, color = parse_border(border)
            border_parts.append(
                f'<w:insideV w:val="single" w:sz="{sz}" w:color="{color}"/>'
            )

        if border_parts:
            tbl_pr += f"<w:tblBorders>{''.join(border_parts)}</w:tblBorders>"

    tbl_pr += "</w:tblPr>"

    # Table grid - defines column widths
    # Default page width is ~9360 twips (6.5 inches at 1440 twips/inch)
    if col_width_twips is None:
        col_width_twips = 9360 // num_cols

    grid_cols = "".join(
        f'<w:gridCol w:w="{col_width_twips}"/>' for _ in range(num_cols)
    )
    tbl_grid = f"<w:tblGrid>{grid_cols}</w:tblGrid>"

    return f"""<w:tbl>
        {tbl_pr}
        {tbl_grid}
        {"".join(rows)}
    </w:tbl>"""


def create_document_xml(content: str) -> str:
    """Create the main document.xml content."""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document {NAMESPACES}>
    <w:body>
        {content}
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
    </w:body>
</w:document>"""


def create_content_types_xml() -> str:
    """Create [Content_Types].xml"""
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""


def create_rels_xml() -> str:
    """Create _rels/.rels"""
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""


def create_document_rels_xml() -> str:
    """Create word/_rels/document.xml.rels"""
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>"""


def create_test_docx(output_path: str) -> None:
    """Create the table test DOCX file."""

    content_parts = []

    # Title
    content_parts.append(create_paragraph("Table Tests", bold=True, size=32))
    content_parts.append(create_paragraph(""))

    # Default cell width (in twips, 1 inch = 1440 twips)
    CELL_WIDTH = 3600  # 2.5 inches

    # ===================
    # Test #1: Basic 2x2 Table
    # ===================
    content_parts.append(create_paragraph("Test #1: Basic 2x2 Table"))
    content_parts.append(
        create_paragraph(
            "A simple 2x2 table with bold text in first cell, no borders, 100% width."
        )
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "cells": ["A1", "A2", "B1", "B2"], "text_bold": true, "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table1 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("A1", bold=True, width_twips=CELL_WIDTH),
                    create_table_cell("A2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("B1", width_twips=CELL_WIDTH),
                    create_table_cell("B2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table1)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #2: Table with Borders
    # ===================
    content_parts.append(create_paragraph("Test #2: Table with Cell Borders"))
    content_parts.append(
        create_paragraph("A 2x2 table with 1pt solid black borders on all cells.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "cell_border_top": "1pt solid #000000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table2 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "C1", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                    create_table_cell(
                        "C2", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                ]
            ),
            create_table_row(
                [
                    create_table_cell(
                        "D1", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                    create_table_cell(
                        "D2", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table2)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #3: Yellow Background
    # ===================
    content_parts.append(create_paragraph("Test #3: Cell Background Color"))
    content_parts.append(
        create_paragraph("First cell has yellow background (#FFFF00).")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 1, "cols": 2, "cell_bg": "#FFFF00", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table3 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Yellow", bg_color="FFFF00", width_twips=CELL_WIDTH
                    ),
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table3)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #4: Column Span
    # ===================
    content_parts.append(create_paragraph("Test #4: Column Span"))
    content_parts.append(
        create_paragraph("First row has single cell spanning 2 columns.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "has_colspan": true, "cells": ["Header", "Left", "Right"], "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table4 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Header", colspan=2, width_twips=CELL_WIDTH * 2),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("Left", width_twips=CELL_WIDTH),
                    create_table_cell("Right", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table4)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #5: Row Span
    # ===================
    content_parts.append(create_paragraph("Test #5: Row Span"))
    content_parts.append(create_paragraph("First cell spans 2 rows vertically."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "has_rowspan": true, "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table5 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Spans", rowspan=2, width_twips=CELL_WIDTH),
                    create_table_cell("Top", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell(
                        "", rowspan_continue=True, width_twips=CELL_WIDTH
                    ),
                    create_table_cell("Bottom", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table5)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #6: Bold Red Text
    # ===================
    content_parts.append(create_paragraph("Test #6: Bold and Colored Text"))
    content_parts.append(create_paragraph("First cell has bold red text."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 1, "cols": 2, "text_bold": true, "text_color": "#FF0000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table6 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Bold Red",
                        bold=True,
                        text_color="#FF0000",
                        width_twips=CELL_WIDTH,
                    ),
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table6)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #7: Italic Text
    # ===================
    content_parts.append(create_paragraph("Test #7: Italic Text"))
    content_parts.append(create_paragraph("First cell has italic text."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 1, "cols": 2, "text_italic": true, "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table7 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Italic", italic=True, width_twips=CELL_WIDTH),
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table7)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #8: 3x3 Table
    # ===================
    content_parts.append(create_paragraph("Test #8: 3x3 Table"))
    content_parts.append(create_paragraph("A 3x3 table to test larger structures."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 3, "cols": 3, "cells": ["R1C1", "R1C2", "R1C3", "R2C1", "R2C2", "R2C3", "R3C1", "R3C2", "R3C3"], "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    CELL_WIDTH_3 = 2400  # Smaller for 3 columns
    table8 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("R1C1", width_twips=CELL_WIDTH_3),
                    create_table_cell("R1C2", width_twips=CELL_WIDTH_3),
                    create_table_cell("R1C3", width_twips=CELL_WIDTH_3),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("R2C1", width_twips=CELL_WIDTH_3),
                    create_table_cell("R2C2", width_twips=CELL_WIDTH_3),
                    create_table_cell("R2C3", width_twips=CELL_WIDTH_3),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("R3C1", width_twips=CELL_WIDTH_3),
                    create_table_cell("R3C2", width_twips=CELL_WIDTH_3),
                    create_table_cell("R3C3", width_twips=CELL_WIDTH_3),
                ]
            ),
        ],
        num_cols=3,
        width_pct=100,
    )
    content_parts.append(table8)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #9: Table with Outer Borders Only
    # ===================
    content_parts.append(create_paragraph("Test #9: Table with Outer Borders Only"))
    content_parts.append(
        create_paragraph(
            "Table has 1pt black border on outer edges only, no inside cell borders."
        )
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_top": "1pt solid #000000", "table_border_bottom": "1pt solid #000000", "table_border_left": "1pt solid #000000", "table_border_right": "1pt solid #000000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table9 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("E1", width_twips=CELL_WIDTH),
                    create_table_cell("E2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("F1", width_twips=CELL_WIDTH),
                    create_table_cell("F2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border_top="1pt solid #000000",
        border_bottom="1pt solid #000000",
        border_left="1pt solid #000000",
        border_right="1pt solid #000000",
    )
    content_parts.append(table9)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #10: Table with Top Border Only
    # ===================
    content_parts.append(create_paragraph("Test #10: Table with Top Border Only"))
    content_parts.append(create_paragraph("Table has 2pt red border on top only."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_top": "2pt solid #FF0000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table10 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("G1", width_twips=CELL_WIDTH),
                    create_table_cell("G2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("H1", width_twips=CELL_WIDTH),
                    create_table_cell("H2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border_top="2pt solid #FF0000",
    )
    content_parts.append(table10)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #11: Table with Bottom Border Only
    # ===================
    content_parts.append(create_paragraph("Test #11: Table with Bottom Border Only"))
    content_parts.append(create_paragraph("Table has 2pt blue border on bottom only."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_bottom": "2pt solid #0000FF", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table11 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("I1", width_twips=CELL_WIDTH),
                    create_table_cell("I2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("J1", width_twips=CELL_WIDTH),
                    create_table_cell("J2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border_bottom="2pt solid #0000FF",
    )
    content_parts.append(table11)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #12: Cell with Top Border Only
    # ===================
    content_parts.append(create_paragraph("Test #12: Cell with Top Border Only"))
    content_parts.append(
        create_paragraph("First cell has 1pt black border on top only.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 1, "cols": 2, "cell_border_top": "1pt solid #000000", "cell_border_bottom": "none", "cell_border_left": "none", "cell_border_right": "none", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table12 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "TopOnly",
                        border_top="1pt solid #000000",
                        width_twips=CELL_WIDTH,
                    ),
                    create_table_cell("NoBorder", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table12)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #13: Cell with Left and Right Borders Only
    # ===================
    content_parts.append(
        create_paragraph("Test #13: Cell with Left and Right Borders Only")
    )
    content_parts.append(
        create_paragraph("First cell has 1pt green borders on left and right only.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 1, "cols": 2, "cell_border_top": "none", "cell_border_bottom": "none", "cell_border_left": "1pt solid #00FF00", "cell_border_right": "1pt solid #00FF00", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table13 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Sides",
                        border_left="1pt solid #00FF00",
                        border_right="1pt solid #00FF00",
                        width_twips=CELL_WIDTH,
                    ),
                    create_table_cell("NoBorder", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table13)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #14: Mixed Cell Borders
    # ===================
    content_parts.append(create_paragraph("Test #14: Mixed Cell Borders"))
    content_parts.append(
        create_paragraph("First cell has all borders, second cell has no borders.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "cell_border_top": "1pt solid #000000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table14 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "AllBorders", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                    create_table_cell("NoBorders", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("NoBorders", width_twips=CELL_WIDTH),
                    create_table_cell(
                        "AllBorders", border="1pt solid #000000", width_twips=CELL_WIDTH
                    ),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
    )
    content_parts.append(table14)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #15: Nested Table
    # ===================
    content_parts.append(create_paragraph("Test #15: Nested Table"))
    content_parts.append(
        create_paragraph("Outer table with a nested table inside the first cell.")
    )
    content_parts.append(
        create_paragraph('Expected: {"rows": 1, "cols": 2, "table_width": "100%"}')
    )
    content_parts.append(create_paragraph(""))

    # Create inner nested table
    inner_table = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Inner1", width_twips=1800),
                    create_table_cell("Inner2", width_twips=1800),
                ]
            ),
        ],
        num_cols=2,
        border="1pt solid #FF0000",
        col_width_twips=1800,
    )

    table15 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Outer:", nested_table=inner_table, width_twips=CELL_WIDTH
                    ),
                    create_table_cell("Regular", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border="1pt solid #000000",
    )
    content_parts.append(table15)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #16: Thick Colored Border
    # ===================
    content_parts.append(create_paragraph("Test #16: Thick Colored Border"))
    content_parts.append(create_paragraph("Table with 3pt purple border on all sides."))
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_top": "3pt solid #800080", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table16 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("K1", width_twips=CELL_WIDTH),
                    create_table_cell("K2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("L1", width_twips=CELL_WIDTH),
                    create_table_cell("L2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border="3pt solid #800080",
    )
    content_parts.append(table16)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #17: Table and Cell Border Combination
    # ===================
    content_parts.append(
        create_paragraph("Test #17: Table and Cell Border Combination")
    )
    content_parts.append(
        create_paragraph(
            "Table has thin outer border, first cell has thick inner border."
        )
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_top": "2pt solid #FF0000", "cell_border_top": "2pt solid #FF0000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table17 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "ThickCell", border="2pt solid #FF0000", width_twips=CELL_WIDTH
                    ),
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                    create_table_cell("Normal", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border="1pt solid #000000",
    )
    content_parts.append(table17)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #18: Multiple Background Colors
    # ===================
    content_parts.append(create_paragraph("Test #18: Multiple Background Colors"))
    content_parts.append(
        create_paragraph("Table with different background colors in each cell.")
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "cell_bg": "#FF0000", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table18 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Red", bg_color="FF0000", width_twips=CELL_WIDTH),
                    create_table_cell(
                        "Green", bg_color="00FF00", width_twips=CELL_WIDTH
                    ),
                ]
            ),
            create_table_row(
                [
                    create_table_cell(
                        "Blue", bg_color="0000FF", width_twips=CELL_WIDTH
                    ),
                    create_table_cell(
                        "Yellow", bg_color="FFFF00", width_twips=CELL_WIDTH
                    ),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border="1pt solid #000000",
    )
    content_parts.append(table18)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #19: Deeply Nested Table
    # ===================
    content_parts.append(create_paragraph("Test #19: Deeply Nested Table"))
    content_parts.append(create_paragraph("Table with two levels of nesting."))
    content_parts.append(
        create_paragraph('Expected: {"rows": 1, "table_width": "100%"}')
    )
    content_parts.append(create_paragraph(""))

    # Create innermost table
    innermost_table = create_table(
        [
            create_table_row(
                [
                    create_table_cell("Deep", width_twips=1200, bold=True),
                ]
            ),
        ],
        num_cols=1,
        border="1pt solid #0000FF",
        col_width_twips=1200,
    )

    # Create middle table with innermost nested
    middle_table = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Mid:", nested_table=innermost_table, width_twips=1600
                    ),
                ]
            ),
        ],
        num_cols=1,
        border="1pt solid #00FF00",
        col_width_twips=1600,
    )

    table19 = create_table(
        [
            create_table_row(
                [
                    create_table_cell(
                        "Outer:", nested_table=middle_table, width_twips=CELL_WIDTH
                    ),
                    create_table_cell("Regular", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border="1pt solid #FF0000",
    )
    content_parts.append(table19)
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #20: Table with Only Inside Borders
    # ===================
    content_parts.append(create_paragraph("Test #20: Table with Only Inside Borders"))
    content_parts.append(
        create_paragraph(
            "Table has inside borders only (grid lines), no outer borders."
        )
    )
    content_parts.append(
        create_paragraph(
            'Expected: {"rows": 2, "cols": 2, "table_border_top": "none", "table_width": "100%"}'
        )
    )
    content_parts.append(create_paragraph(""))

    table20 = create_table(
        [
            create_table_row(
                [
                    create_table_cell("M1", width_twips=CELL_WIDTH),
                    create_table_cell("M2", width_twips=CELL_WIDTH),
                ]
            ),
            create_table_row(
                [
                    create_table_cell("N1", width_twips=CELL_WIDTH),
                    create_table_cell("N2", width_twips=CELL_WIDTH),
                ]
            ),
        ],
        num_cols=2,
        width_pct=100,
        border_inside_h="1pt solid #000000",
        border_inside_v="1pt solid #000000",
    )
    content_parts.append(table20)
    content_parts.append(create_paragraph(""))

    # Build document
    document_content = "\n".join(content_parts)
    document_xml = create_document_xml(document_content)

    # Create DOCX (ZIP file)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", create_content_types_xml())
        zf.writestr("_rels/.rels", create_rels_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", create_document_rels_xml())

    print(f"Created: {output_path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "table_tests_v2.docx"
    create_test_docx(str(output_file))
