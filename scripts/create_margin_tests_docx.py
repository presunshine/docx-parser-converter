#!/usr/bin/env python3
"""
Create margin and alignment test DOCX files.

Tests page margins and paragraph alignment conversion.
"""

import zipfile
from pathlib import Path

NAMESPACES = """xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
"""


def create_paragraph(
    text: str,
    bold: bool = False,
    size: int = 22,
    alignment: str | None = None,
) -> str:
    """Create a paragraph with optional styling and alignment."""
    # Paragraph properties
    ppr_parts = []
    if alignment:
        ppr_parts.append(f'<w:jc w:val="{alignment}"/>')

    ppr = f"<w:pPr>{''.join(ppr_parts)}</w:pPr>" if ppr_parts else ""

    # Run properties
    run_props = ""
    if bold:
        run_props += "<w:b/>"
    if size != 22:
        run_props += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'

    rpr = f"<w:rPr>{run_props}</w:rPr>" if run_props else ""

    return f"""<w:p>
      {ppr}
      <w:r>
        {rpr}
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""


def create_document_xml(
    content: str,
    top_margin: int = 1440,
    bottom_margin: int = 1440,
    left_margin: int = 1440,
    right_margin: int = 1440,
) -> str:
    """Create document XML with custom margins.

    Margins are in twips (1440 twips = 1 inch, 720 twips = 0.5 inch).
    """
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document {NAMESPACES}>
    <w:body>
        {content}
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="{top_margin}" w:right="{right_margin}" w:bottom="{bottom_margin}" w:left="{left_margin}" w:header="720" w:footer="720"/>
        </w:sectPr>
    </w:body>
</w:document>"""


def create_content_types_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""


def create_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""


def create_document_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>"""


def create_margin_tests(output_path: str) -> None:
    """Create margin and alignment tests DOCX."""
    content_parts = []

    content_parts.append(create_paragraph("Margin and Alignment Tests", bold=True, size=32))
    content_parts.append(create_paragraph(""))

    # Test #1: Left Aligned Paragraph (default)
    content_parts.append(create_paragraph("Test #1: Left Aligned Paragraph"))
    content_parts.append(create_paragraph("A paragraph with left alignment (default)."))
    content_parts.append(create_paragraph('Expected: {"para_align": "left"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph(
            "This paragraph is left-aligned. Text flows from the left margin and wraps naturally at the right margin. This is the default alignment for most documents.",
            alignment="left",
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #2: Right Aligned Paragraph
    content_parts.append(create_paragraph("Test #2: Right Aligned Paragraph"))
    content_parts.append(create_paragraph("A paragraph with right alignment."))
    content_parts.append(create_paragraph('Expected: {"para_align": "right"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph(
            "This paragraph is right-aligned. Text flows from the right margin and is ragged on the left side.",
            alignment="right",
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #3: Center Aligned Paragraph
    content_parts.append(create_paragraph("Test #3: Center Aligned Paragraph"))
    content_parts.append(create_paragraph("A paragraph with center alignment."))
    content_parts.append(create_paragraph('Expected: {"para_align": "center"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph(
            "This paragraph is center-aligned. Text is centered between the left and right margins.",
            alignment="center",
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #4: Justified Paragraph
    content_parts.append(create_paragraph("Test #4: Justified Paragraph"))
    content_parts.append(create_paragraph("A paragraph with justified alignment."))
    content_parts.append(create_paragraph('Expected: {"para_align": "justify"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph(
            "This paragraph is justified. Text is aligned to both the left and right margins by adjusting the spacing between words. This creates a clean, block-like appearance that is common in books and formal documents.",
            alignment="both",
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #5: Left Aligned with Bold
    content_parts.append(create_paragraph("Test #5: Left Aligned with Bold"))
    content_parts.append(create_paragraph("Left aligned paragraph with bold text."))
    content_parts.append(create_paragraph('Expected: {"para_align": "left", "text_bold": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph("This is bold and left aligned.", alignment="left", bold=True)
    )
    content_parts.append(create_paragraph(""))

    # Test #6: Center Aligned with Bold
    content_parts.append(create_paragraph("Test #6: Center Aligned with Bold"))
    content_parts.append(create_paragraph("Center aligned paragraph with bold text."))
    content_parts.append(create_paragraph('Expected: {"para_align": "center", "text_bold": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph("This is bold and center aligned.", alignment="center", bold=True)
    )
    content_parts.append(create_paragraph(""))

    # Build document with 1 inch margins
    document_content = "\n".join(content_parts)
    document_xml = create_document_xml(
        document_content,
        top_margin=1440,  # 1 inch
        bottom_margin=1440,  # 1 inch
        left_margin=1440,  # 1 inch
        right_margin=1440,  # 1 inch
    )

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", create_content_types_xml())
        zf.writestr("_rels/.rels", create_rels_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", create_document_rels_xml())

    print(f"Created: {output_path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"
    output_dir.mkdir(parents=True, exist_ok=True)

    create_margin_tests(str(output_dir / "margin_tests.docx"))
