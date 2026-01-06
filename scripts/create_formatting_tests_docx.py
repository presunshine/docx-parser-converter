#!/usr/bin/env python3
"""
Create formatting test DOCX files for inline formatting and font properties.
"""

import zipfile
from pathlib import Path

NAMESPACES = """xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
"""


def create_paragraph(text: str, bold: bool = False, size: int = 22) -> str:
    """Create a simple paragraph."""
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


def create_styled_paragraph(
    text: str,
    bold: bool = False,
    italic: bool = False,
    underline: str | None = None,
    strike: bool = False,
    dstrike: bool = False,
    color: str | None = None,
    highlight: str | None = None,
    font_size: int | None = None,
    font_family: str | None = None,
    smallcaps: bool = False,
    allcaps: bool = False,
    superscript: bool = False,
    subscript: bool = False,
) -> str:
    """Create a paragraph with styled text."""
    rpr_parts = []

    if bold:
        rpr_parts.append("<w:b/>")
    if italic:
        rpr_parts.append("<w:i/>")
    if underline:
        rpr_parts.append(f'<w:u w:val="{underline}"/>')
    if strike:
        rpr_parts.append("<w:strike/>")
    if dstrike:
        rpr_parts.append("<w:dstrike/>")
    if color:
        rpr_parts.append(f'<w:color w:val="{color}"/>')
    if highlight:
        rpr_parts.append(f'<w:highlight w:val="{highlight}"/>')
    if font_size:
        # Font size in half-points
        rpr_parts.append(f'<w:sz w:val="{font_size * 2}"/>')
        rpr_parts.append(f'<w:szCs w:val="{font_size * 2}"/>')
    if font_family:
        rpr_parts.append(f'<w:rFonts w:ascii="{font_family}" w:hAnsi="{font_family}"/>')
    if smallcaps:
        rpr_parts.append("<w:smallCaps/>")
    if allcaps:
        rpr_parts.append("<w:caps/>")
    if superscript:
        rpr_parts.append('<w:vertAlign w:val="superscript"/>')
    if subscript:
        rpr_parts.append('<w:vertAlign w:val="subscript"/>')

    rpr = f"<w:rPr>{''.join(rpr_parts)}</w:rPr>" if rpr_parts else ""

    return f"""<w:p>
      <w:r>
        {rpr}
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""


def create_document_xml(content: str) -> str:
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


def create_formatting_tests(output_path: str) -> None:
    """Create formatting tests DOCX."""
    content_parts = []

    content_parts.append(create_paragraph("Formatting Tests", bold=True, size=32))
    content_parts.append(create_paragraph(""))

    # Test #1: Bold
    content_parts.append(create_paragraph("Test #1: Bold Text"))
    content_parts.append(create_paragraph("Text with bold formatting."))
    content_parts.append(create_paragraph('Expected: {"text_bold": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("This is bold text", bold=True))
    content_parts.append(create_paragraph(""))

    # Test #2: Italic
    content_parts.append(create_paragraph("Test #2: Italic Text"))
    content_parts.append(create_paragraph("Text with italic formatting."))
    content_parts.append(create_paragraph('Expected: {"text_italic": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("This is italic text", italic=True))
    content_parts.append(create_paragraph(""))

    # Test #3: Bold and Italic
    content_parts.append(create_paragraph("Test #3: Bold and Italic"))
    content_parts.append(create_paragraph("Text with both bold and italic."))
    content_parts.append(create_paragraph('Expected: {"text_bold": true, "text_italic": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Bold and italic", bold=True, italic=True))
    content_parts.append(create_paragraph(""))

    # Test #4: Single Underline
    content_parts.append(create_paragraph("Test #4: Single Underline"))
    content_parts.append(create_paragraph("Text with single underline."))
    content_parts.append(create_paragraph('Expected: {"text_underline": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Underlined text", underline="single"))
    content_parts.append(create_paragraph(""))

    # Test #5: Double Underline
    content_parts.append(create_paragraph("Test #5: Double Underline"))
    content_parts.append(create_paragraph("Text with double underline."))
    content_parts.append(create_paragraph('Expected: {"text_underline": "double"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Double underline", underline="double"))
    content_parts.append(create_paragraph(""))

    # Test #6: Strikethrough
    content_parts.append(create_paragraph("Test #6: Strikethrough"))
    content_parts.append(create_paragraph("Text with strikethrough."))
    content_parts.append(create_paragraph('Expected: {"text_strike": true}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Strikethrough text", strike=True))
    content_parts.append(create_paragraph(""))

    # Test #7: Red Color
    content_parts.append(create_paragraph("Test #7: Red Color"))
    content_parts.append(create_paragraph("Text in red color."))
    content_parts.append(create_paragraph('Expected: {"text_color": "#FF0000"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Red text", color="FF0000"))
    content_parts.append(create_paragraph(""))

    # Test #8: Blue Color
    content_parts.append(create_paragraph("Test #8: Blue Color"))
    content_parts.append(create_paragraph("Text in blue color."))
    content_parts.append(create_paragraph('Expected: {"text_color": "#0000FF"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Blue text", color="0000FF"))
    content_parts.append(create_paragraph(""))

    # Test #9: Yellow Highlight
    content_parts.append(create_paragraph("Test #9: Yellow Highlight"))
    content_parts.append(create_paragraph("Text with yellow highlight."))
    content_parts.append(create_paragraph('Expected: {"text_highlight": "#FFFF00"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Highlighted", highlight="yellow"))
    content_parts.append(create_paragraph(""))

    # Test #10: 24pt Font Size
    content_parts.append(create_paragraph("Test #10: 24pt Font Size"))
    content_parts.append(create_paragraph("Text in 24 point size."))
    content_parts.append(create_paragraph('Expected: {"text_size": "24pt"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Large text", font_size=24))
    content_parts.append(create_paragraph(""))

    # Test #11: Arial Font
    content_parts.append(create_paragraph("Test #11: Arial Font"))
    content_parts.append(create_paragraph("Text in Arial font."))
    content_parts.append(create_paragraph('Expected: {"text_font": "Arial"}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(create_styled_paragraph("Arial text", font_family="Arial"))
    content_parts.append(create_paragraph(""))

    # Test #12: Combined Formatting
    content_parts.append(create_paragraph("Test #12: Combined Formatting"))
    content_parts.append(create_paragraph("Bold, red, 16pt Arial."))
    content_parts.append(
        create_paragraph(
            'Expected: {"text_bold": true, "text_color": "#FF0000", "text_size": "16pt", "text_font": "Arial"}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_styled_paragraph(
            "Combined styles",
            bold=True,
            color="FF0000",
            font_size=16,
            font_family="Arial",
        )
    )
    content_parts.append(create_paragraph(""))

    # Build document
    document_content = "\n".join(content_parts)
    document_xml = create_document_xml(document_content)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", create_content_types_xml())
        zf.writestr("_rels/.rels", create_rels_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", create_document_rels_xml())

    print(f"Created: {output_path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"
    output_dir.mkdir(parents=True, exist_ok=True)

    create_formatting_tests(str(output_dir / "formatting_tests.docx"))
