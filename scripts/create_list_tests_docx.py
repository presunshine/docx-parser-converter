#!/usr/bin/env python3
"""
Create a list test DOCX file with proper numbering definitions.
"""

import zipfile
from pathlib import Path

# XML namespace declarations
NAMESPACES = """xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
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


def create_list_paragraph(
    text: str,
    num_id: int,
    level: int = 0,
    bold: bool = False,
) -> str:
    """Create a list item paragraph with numbering reference."""
    run_props = ""
    if bold:
        run_props = "<w:rPr><w:b/></w:rPr>"

    return f"""<w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="{level}"/>
          <w:numId w:val="{num_id}"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        {run_props}
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""


def create_numbering_xml() -> str:
    """Create numbering.xml with abstract and concrete number definitions."""
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <!-- Abstract Numbering 1: Bullet list -->
    <w:abstractNum w:abstractNumId="1">
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val=""/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
            <w:rPr>
                <w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/>
            </w:rPr>
        </w:lvl>
        <w:lvl w:ilvl="1">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val="o"/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="1440" w:hanging="360"/>
            </w:pPr>
            <w:rPr>
                <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>
            </w:rPr>
        </w:lvl>
        <w:lvl w:ilvl="2">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val=""/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="2160" w:hanging="360"/>
            </w:pPr>
            <w:rPr>
                <w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings"/>
            </w:rPr>
        </w:lvl>
    </w:abstractNum>

    <!-- Abstract Numbering 2: Decimal numbered list -->
    <w:abstractNum w:abstractNumId="2">
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
        </w:lvl>
        <w:lvl w:ilvl="1">
            <w:start w:val="1"/>
            <w:numFmt w:val="lowerLetter"/>
            <w:lvlText w:val="%2."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="1440" w:hanging="360"/>
            </w:pPr>
        </w:lvl>
        <w:lvl w:ilvl="2">
            <w:start w:val="1"/>
            <w:numFmt w:val="lowerRoman"/>
            <w:lvlText w:val="%3."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="2160" w:hanging="360"/>
            </w:pPr>
        </w:lvl>
    </w:abstractNum>

    <!-- Abstract Numbering 3: Roman numerals -->
    <w:abstractNum w:abstractNumId="3">
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="upperRoman"/>
            <w:lvlText w:val="%1."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
        </w:lvl>
    </w:abstractNum>

    <!-- Concrete numbering instances -->
    <w:num w:numId="1">
        <w:abstractNumId w:val="1"/>
    </w:num>
    <w:num w:numId="2">
        <w:abstractNumId w:val="2"/>
    </w:num>
    <w:num w:numId="3">
        <w:abstractNumId w:val="3"/>
    </w:num>
</w:numbering>"""


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
    <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
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
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""


def create_test_docx(output_path: str) -> None:
    """Create the list test DOCX file."""

    content_parts = []

    # Title
    content_parts.append(create_paragraph("List Tests", bold=True, size=32))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #1: Numbered List
    # ===================
    content_parts.append(create_paragraph("Test #1: Numbered List"))
    content_parts.append(create_paragraph("A decimal numbered list with proper indentation."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "1.\\t", "list_indent": "36pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("First numbered item", num_id=2, level=0))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #2: Second Numbered Item
    # ===================
    content_parts.append(create_paragraph("Test #2: Second Numbered Item"))
    content_parts.append(create_paragraph("The second item should show 2."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "2.\\t", "list_indent": "36pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("Second numbered item", num_id=2, level=0))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #3: Nested Letter List
    # ===================
    content_parts.append(create_paragraph("Test #3: Nested Letter List"))
    content_parts.append(create_paragraph("A nested list using lowercase letters."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "a.\\t", "list_indent": "72pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("Parent item", num_id=2, level=0))
    content_parts.append(create_list_paragraph("Nested letter a", num_id=2, level=1))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #4: Roman Numerals
    # ===================
    content_parts.append(create_paragraph("Test #4: Roman Numerals"))
    content_parts.append(create_paragraph("A list using uppercase Roman numerals."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "I.\\t", "list_indent": "36pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("Roman one", num_id=3, level=0))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #5: Roman Numeral Two
    # ===================
    content_parts.append(create_paragraph("Test #5: Roman Numeral Two"))
    content_parts.append(create_paragraph("Second Roman numeral should be II."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "II.\\t", "list_indent": "36pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("Roman two", num_id=3, level=0))
    content_parts.append(create_paragraph(""))

    # ===================
    # Test #6: Deeply Nested List
    # ===================
    content_parts.append(create_paragraph("Test #6: Deeply Nested List"))
    content_parts.append(create_paragraph("Third level nesting with roman numerals."))
    content_parts.append(
        create_paragraph(
            'Expected: {"list_marker": "i.\\t", "list_indent": "108pt", "has_hanging_indent": true}'
        )
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_list_paragraph("Level 1", num_id=2, level=0))
    content_parts.append(create_list_paragraph("Level 2", num_id=2, level=1))
    content_parts.append(create_list_paragraph("Level 3 roman", num_id=2, level=2))
    content_parts.append(create_paragraph(""))

    # Build document
    document_content = "\n".join(content_parts)
    document_xml = create_document_xml(document_content)

    # Create DOCX (ZIP file)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", create_content_types_xml())
        zf.writestr("_rels/.rels", create_rels_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/numbering.xml", create_numbering_xml())
        zf.writestr("word/_rels/document.xml.rels", create_document_rels_xml())

    print(f"Created: {output_path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "list_tests.docx"
    create_test_docx(str(output_file))
