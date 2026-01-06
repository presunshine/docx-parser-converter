#!/usr/bin/env python3
"""
Create image test DOCX file for testing image parsing and conversion.
"""

import zipfile
from pathlib import Path

# Namespaces for drawing elements
NAMESPACES = """xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
"""


# Create minimal PNG images programmatically
def create_minimal_png(r: int, g: int, b: int) -> bytes:
    """Create a minimal 1x1 PNG image with the specified RGB color."""
    import struct
    import zlib

    def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk_len = struct.pack(">I", len(data))
        chunk_crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return chunk_len + chunk_type + data + chunk_crc

    # PNG signature
    signature = b"\x89PNG\r\n\x1a\n"

    # IHDR chunk: 1x1 pixel, 8-bit RGB
    ihdr_data = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b"IHDR", ihdr_data)

    # IDAT chunk: compressed image data (filter byte + RGB)
    raw_data = bytes([0, r, g, b])  # filter=0, then RGB
    compressed = zlib.compress(raw_data)
    idat = png_chunk(b"IDAT", compressed)

    # IEND chunk
    iend = png_chunk(b"IEND", b"")

    return signature + ihdr + idat + iend


# Pre-generate colored PNG bytes
RED_PNG = create_minimal_png(255, 0, 0)
BLUE_PNG = create_minimal_png(0, 0, 255)
GREEN_PNG = create_minimal_png(0, 255, 0)

# EMU conversions (914400 EMU = 1 inch, 72 points = 1 inch)
# 100px = approx 914400 EMU (at 96 DPI)
EMU_PER_PIXEL = 9525  # Approximately


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


def create_inline_image(
    rel_id: str,
    width_emu: int,
    height_emu: int,
    name: str = "Image",
    description: str = "",
    doc_id: int = 1,
) -> str:
    """Create an inline image element."""
    descr_attr = f' descr="{description}"' if description else ""
    return f"""<w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{width_emu}" cy="{height_emu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="{doc_id}" name="{name}"{descr_attr}/>
        <wp:cNvGraphicFramePr>
          <a:graphicFrameLocks noChangeAspect="1"/>
        </wp:cNvGraphicFramePr>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="{doc_id}" name="{name}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rel_id}"/>
                <a:stretch>
                  <a:fillRect/>
                </a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:off x="0" y="0"/>
                  <a:ext cx="{width_emu}" cy="{height_emu}"/>
                </a:xfrm>
                <a:prstGeom prst="rect">
                  <a:avLst/>
                </a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>"""


def create_anchor_image(
    rel_id: str,
    width_emu: int,
    height_emu: int,
    name: str = "Image",
    description: str = "",
    doc_id: int = 1,
    h_align: str = "left",
    wrap_type: str = "square",
) -> str:
    """Create an anchored/floating image element."""
    descr_attr = f' descr="{description}"' if description else ""

    # Position offset (0 = relative to column/paragraph)
    pos_h = f"""<wp:positionH relativeFrom="column">
          <wp:align>{h_align}</wp:align>
        </wp:positionH>"""

    pos_v = """<wp:positionV relativeFrom="paragraph">
          <wp:posOffset>0</wp:posOffset>
        </wp:positionV>"""

    # Wrap type
    if wrap_type == "square":
        wrap = '<wp:wrapSquare wrapText="bothSides"/>'
    elif wrap_type == "tight":
        wrap = '<wp:wrapTight wrapText="bothSides"><wp:wrapPolygon edited="0"><wp:start x="0" y="0"/><wp:lineTo x="0" y="21600"/><wp:lineTo x="21600" y="21600"/><wp:lineTo x="21600" y="0"/><wp:lineTo x="0" y="0"/></wp:wrapPolygon></wp:wrapTight>'
    elif wrap_type == "none":
        wrap = "<wp:wrapNone/>"
    else:
        wrap = '<wp:wrapSquare wrapText="bothSides"/>'

    return f"""<w:drawing>
      <wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
        <wp:simplePos x="0" y="0"/>
        {pos_h}
        {pos_v}
        <wp:extent cx="{width_emu}" cy="{height_emu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        {wrap}
        <wp:docPr id="{doc_id}" name="{name}"{descr_attr}/>
        <wp:cNvGraphicFramePr>
          <a:graphicFrameLocks noChangeAspect="1"/>
        </wp:cNvGraphicFramePr>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="{doc_id}" name="{name}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rel_id}"/>
                <a:stretch>
                  <a:fillRect/>
                </a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:off x="0" y="0"/>
                  <a:ext cx="{width_emu}" cy="{height_emu}"/>
                </a:xfrm>
                <a:prstGeom prst="rect">
                  <a:avLst/>
                </a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    </w:drawing>"""


def create_paragraph_with_inline_image(
    rel_id: str,
    width_px: int,
    height_px: int,
    name: str = "Image",
    description: str = "",
    doc_id: int = 1,
) -> str:
    """Create a paragraph containing an inline image."""
    width_emu = width_px * EMU_PER_PIXEL
    height_emu = height_px * EMU_PER_PIXEL
    drawing = create_inline_image(rel_id, width_emu, height_emu, name, description, doc_id)
    return f"""<w:p>
      <w:r>
        {drawing}
      </w:r>
    </w:p>"""


def create_paragraph_with_anchor_image(
    rel_id: str,
    width_px: int,
    height_px: int,
    name: str = "Image",
    description: str = "",
    doc_id: int = 1,
    h_align: str = "left",
    wrap_type: str = "square",
) -> str:
    """Create a paragraph containing an anchored image."""
    width_emu = width_px * EMU_PER_PIXEL
    height_emu = height_px * EMU_PER_PIXEL
    drawing = create_anchor_image(
        rel_id, width_emu, height_emu, name, description, doc_id, h_align, wrap_type
    )
    return f"""<w:p>
      <w:r>
        {drawing}
      </w:r>
    </w:p>"""


def create_paragraph_with_text_and_image(
    text_before: str, text_after: str, rel_id: str, width_px: int, height_px: int, doc_id: int = 1
) -> str:
    """Create a paragraph with text before and after an inline image."""
    width_emu = width_px * EMU_PER_PIXEL
    height_emu = height_px * EMU_PER_PIXEL
    drawing = create_inline_image(rel_id, width_emu, height_emu, "Image", "", doc_id)
    return f"""<w:p>
      <w:r>
        <w:t xml:space="preserve">{text_before}</w:t>
      </w:r>
      <w:r>
        {drawing}
      </w:r>
      <w:r>
        <w:t xml:space="preserve">{text_after}</w:t>
      </w:r>
    </w:p>"""


def create_paragraph_with_multiple_images(
    rel_ids: list[str], width_px: int, height_px: int, start_doc_id: int = 1
) -> str:
    """Create a paragraph with multiple inline images."""
    runs = []
    for i, rel_id in enumerate(rel_ids):
        width_emu = width_px * EMU_PER_PIXEL
        height_emu = height_px * EMU_PER_PIXEL
        drawing = create_inline_image(
            rel_id, width_emu, height_emu, f"Image{i + 1}", "", start_doc_id + i
        )
        runs.append(f"<w:r>{drawing}</w:r>")
    return f"""<w:p>
      {"".join(runs)}
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
    <Default Extension="png" ContentType="image/png"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""


def create_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""


def create_document_rels_xml(image_rels: list[tuple[str, str]]) -> str:
    """Create document relationships including image references.

    Args:
        image_rels: List of (rel_id, target_path) tuples
    """
    rels = []
    for rel_id, target in image_rels:
        rels.append(
            f'    <Relationship Id="{rel_id}" '
            f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
            f'Target="{target}"/>'
        )

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
{chr(10).join(rels)}
</Relationships>"""


def create_image_tests(output_path: str) -> None:
    """Create image tests DOCX."""
    content_parts = []

    content_parts.append(create_paragraph("Image Tests", bold=True, size=32))
    content_parts.append(create_paragraph(""))

    # Test #1: Simple inline image
    content_parts.append(create_paragraph("Test #1: Simple Inline Image"))
    content_parts.append(create_paragraph("A simple inline image."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "inline", "width": 100, "height": 100}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_paragraph_with_inline_image("rId4", 100, 100, "RedSquare", "", 1))
    content_parts.append(create_paragraph(""))

    # Test #2: Inline image with alt text
    content_parts.append(create_paragraph("Test #2: Inline Image with Alt Text"))
    content_parts.append(create_paragraph("An image with alt text description."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "inline", "alt_text": "A red square image"}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_inline_image("rId4", 80, 80, "AltImage", "A red square image", 2)
    )
    content_parts.append(create_paragraph(""))

    # Test #3: Image with specific dimensions
    content_parts.append(create_paragraph("Test #3: Image with Specific Dimensions"))
    content_parts.append(create_paragraph("A 150x75 pixel image."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "inline", "width": 150, "height": 75}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(create_paragraph_with_inline_image("rId5", 150, 75, "BlueRect", "", 3))
    content_parts.append(create_paragraph(""))

    # Test #4: Left-aligned floating image
    content_parts.append(create_paragraph("Test #4: Left-Aligned Floating Image"))
    content_parts.append(create_paragraph("A left-aligned floating image with text wrap."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "anchor", "h_align": "left", "wrap": "square"}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_anchor_image(
            "rId4", 80, 80, "LeftFloat", "", 4, h_align="left", wrap_type="square"
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #5: Right-aligned floating image
    content_parts.append(create_paragraph("Test #5: Right-Aligned Floating Image"))
    content_parts.append(create_paragraph("A right-aligned floating image."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "anchor", "h_align": "right", "wrap": "square"}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_anchor_image(
            "rId5", 80, 80, "RightFloat", "", 5, h_align="right", wrap_type="square"
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #6: Center-aligned floating image
    content_parts.append(create_paragraph("Test #6: Center-Aligned Floating Image"))
    content_parts.append(create_paragraph("A center-aligned floating image."))
    content_parts.append(
        create_paragraph('Expected: {"image_type": "anchor", "h_align": "center"}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_anchor_image(
            "rId6", 80, 80, "CenterFloat", "", 6, h_align="center", wrap_type="square"
        )
    )
    content_parts.append(create_paragraph(""))

    # Test #7: Image inside paragraph with text
    content_parts.append(create_paragraph("Test #7: Image Inside Paragraph with Text"))
    content_parts.append(create_paragraph("Text before and after an inline image."))
    content_parts.append(
        create_paragraph('Expected: {"text_before": "Here is ", "text_after": " in the text."}')
    )
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_text_and_image("Here is ", " in the text.", "rId4", 50, 50, 7)
    )
    content_parts.append(create_paragraph(""))

    # Test #8: Multiple images in one paragraph
    content_parts.append(create_paragraph("Test #8: Multiple Images in One Paragraph"))
    content_parts.append(create_paragraph("Three images in a single paragraph."))
    content_parts.append(create_paragraph('Expected: {"image_count": 3}'))
    content_parts.append(create_paragraph(""))
    content_parts.append(
        create_paragraph_with_multiple_images(["rId4", "rId5", "rId6"], 40, 40, start_doc_id=8)
    )
    content_parts.append(create_paragraph(""))

    # Build document
    document_content = "\n".join(content_parts)
    document_xml = create_document_xml(document_content)

    # Image relationships
    image_rels = [
        ("rId4", "media/image1.png"),  # Red
        ("rId5", "media/image2.png"),  # Blue
        ("rId6", "media/image3.png"),  # Green
    ]

    # Use pre-generated PNG images
    red_png = RED_PNG
    blue_png = BLUE_PNG
    green_png = GREEN_PNG

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", create_content_types_xml())
        zf.writestr("_rels/.rels", create_rels_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", create_document_rels_xml(image_rels))
        # Add images to media folder
        zf.writestr("word/media/image1.png", red_png)
        zf.writestr("word/media/image2.png", blue_png)
        zf.writestr("word/media/image3.png", green_png)

    print(f"Created: {output_path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "fixtures" / "tagged_tests"
    output_dir.mkdir(parents=True, exist_ok=True)

    create_image_tests(str(output_dir / "image_tests.docx"))
