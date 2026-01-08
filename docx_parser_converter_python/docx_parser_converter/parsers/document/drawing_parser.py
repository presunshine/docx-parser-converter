"""Parsers for drawing elements (images, shapes).

These are elements that appear inside a run as <w:drawing>.
"""

from lxml.etree import _Element as Element

from ...core.constants import DRAWING_NS, R_NS, WP_NS
from ...models.document.drawing import (
    AnchorDrawing,
    Blip,
    BlipFill,
    Drawing,
    DrawingExtent,
    DrawingProperties,
    Graphic,
    GraphicData,
    InlineDrawing,
    Picture,
    ShapeProperties,
)

# Picture namespace
PIC_NS = "{http://schemas.openxmlformats.org/drawingml/2006/picture}"


def parse_extent(element: Element | None) -> DrawingExtent | None:
    """Parse <wp:extent> or <a:ext> element.

    XML Example:
        <wp:extent cx="914400" cy="914400"/>

    Args:
        element: The extent element or None

    Returns:
        DrawingExtent model or None if element is None
    """
    if element is None:
        return None

    cx = element.get("cx")
    cy = element.get("cy")

    return DrawingExtent(
        cx=int(cx) if cx else None,
        cy=int(cy) if cy else None,
    )


def parse_doc_pr(element: Element | None) -> DrawingProperties | None:
    """Parse <wp:docPr> element.

    XML Example:
        <wp:docPr id="1" name="Picture 1" descr="Alt text"/>

    Args:
        element: The <wp:docPr> element or None

    Returns:
        DrawingProperties model or None if element is None
    """
    if element is None:
        return None

    id_str = element.get("id")

    return DrawingProperties(
        id=int(id_str) if id_str else None,
        name=element.get("name"),
        descr=element.get("descr"),
    )


def parse_blip(element: Element | None) -> Blip | None:
    """Parse <a:blip> element.

    XML Example:
        <a:blip r:embed="rId4"/>

    Args:
        element: The <a:blip> element or None

    Returns:
        Blip model or None if element is None
    """
    if element is None:
        return None

    # r:embed attribute uses the relationship namespace
    embed = element.get(f"{R_NS}embed")

    return Blip(embed=embed)


def parse_blip_fill(element: Element | None) -> BlipFill | None:
    """Parse <pic:blipFill> element.

    XML Example:
        <pic:blipFill>
            <a:blip r:embed="rId4"/>
            <a:stretch><a:fillRect/></a:stretch>
        </pic:blipFill>

    Args:
        element: The <pic:blipFill> element or None

    Returns:
        BlipFill model or None if element is None
    """
    if element is None:
        return None

    blip_elem = element.find(f"{DRAWING_NS}blip")
    blip = parse_blip(blip_elem)

    return BlipFill(blip=blip)


def parse_shape_properties(element: Element | None) -> ShapeProperties | None:
    """Parse <pic:spPr> element.

    XML Example:
        <pic:spPr>
            <a:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="914400" cy="914400"/>
            </a:xfrm>
        </pic:spPr>

    Args:
        element: The <pic:spPr> element or None

    Returns:
        ShapeProperties model or None if element is None
    """
    if element is None:
        return None

    # Look for transform with extent
    xfrm = element.find(f"{DRAWING_NS}xfrm")
    extent = None
    if xfrm is not None:
        ext_elem = xfrm.find(f"{DRAWING_NS}ext")
        extent = parse_extent(ext_elem)

    return ShapeProperties(extent=extent)


def parse_picture(element: Element | None) -> Picture | None:
    """Parse <pic:pic> element.

    XML Example:
        <pic:pic>
            <pic:nvPicPr>...</pic:nvPicPr>
            <pic:blipFill>
                <a:blip r:embed="rId4"/>
            </pic:blipFill>
            <pic:spPr>...</pic:spPr>
        </pic:pic>

    Args:
        element: The <pic:pic> element or None

    Returns:
        Picture model or None if element is None
    """
    if element is None:
        return None

    blip_fill_elem = element.find(f"{PIC_NS}blipFill")
    blip_fill = parse_blip_fill(blip_fill_elem)

    sp_pr_elem = element.find(f"{PIC_NS}spPr")
    sp_pr = parse_shape_properties(sp_pr_elem)

    return Picture(blip_fill=blip_fill, sp_pr=sp_pr)


def parse_graphic_data(element: Element | None) -> GraphicData | None:
    """Parse <a:graphicData> element.

    XML Example:
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>...</pic:pic>
        </a:graphicData>

    Args:
        element: The <a:graphicData> element or None

    Returns:
        GraphicData model or None if element is None
    """
    if element is None:
        return None

    uri = element.get("uri")

    # Look for picture element
    pic_elem = element.find(f"{PIC_NS}pic")
    pic = parse_picture(pic_elem)

    return GraphicData(uri=uri, pic=pic)


def parse_graphic(element: Element | None) -> Graphic | None:
    """Parse <a:graphic> element.

    XML Example:
        <a:graphic>
            <a:graphicData uri="...">
                <pic:pic>...</pic:pic>
            </a:graphicData>
        </a:graphic>

    Args:
        element: The <a:graphic> element or None

    Returns:
        Graphic model or None if element is None
    """
    if element is None:
        return None

    graphic_data_elem = element.find(f"{DRAWING_NS}graphicData")
    graphic_data = parse_graphic_data(graphic_data_elem)

    return Graphic(graphic_data=graphic_data)


def parse_inline_drawing(element: Element | None) -> InlineDrawing | None:
    """Parse <wp:inline> element.

    XML Example:
        <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="914400" cy="914400"/>
            <wp:docPr id="1" name="Picture 1"/>
            <a:graphic>...</a:graphic>
        </wp:inline>

    Args:
        element: The <wp:inline> element or None

    Returns:
        InlineDrawing model or None if element is None
    """
    if element is None:
        return None

    extent_elem = element.find(f"{WP_NS}extent")
    extent = parse_extent(extent_elem)

    doc_pr_elem = element.find(f"{WP_NS}docPr")
    doc_pr = parse_doc_pr(doc_pr_elem)

    graphic_elem = element.find(f"{DRAWING_NS}graphic")
    graphic = parse_graphic(graphic_elem)

    return InlineDrawing(
        extent=extent,
        doc_pr=doc_pr,
        graphic=graphic,
    )


def parse_anchor_drawing(element: Element | None) -> AnchorDrawing | None:
    """Parse <wp:anchor> element.

    XML Example:
        <wp:anchor distT="0" distB="0" distL="114300" distR="114300"
                   behindDoc="0" ...>
            <wp:positionH relativeFrom="column">
                <wp:align>left</wp:align>
            </wp:positionH>
            <wp:positionV relativeFrom="paragraph">
                <wp:posOffset>0</wp:posOffset>
            </wp:positionV>
            <wp:extent cx="914400" cy="914400"/>
            <wp:wrapSquare wrapText="bothSides"/>
            <wp:docPr id="1" name="Picture 1"/>
            <a:graphic>...</a:graphic>
        </wp:anchor>

    Args:
        element: The <wp:anchor> element or None

    Returns:
        AnchorDrawing model or None if element is None
    """
    if element is None:
        return None

    extent_elem = element.find(f"{WP_NS}extent")
    extent = parse_extent(extent_elem)

    doc_pr_elem = element.find(f"{WP_NS}docPr")
    doc_pr = parse_doc_pr(doc_pr_elem)

    graphic_elem = element.find(f"{DRAWING_NS}graphic")
    graphic = parse_graphic(graphic_elem)

    # Parse horizontal alignment
    h_align = None
    pos_h = element.find(f"{WP_NS}positionH")
    if pos_h is not None:
        align_elem = pos_h.find(f"{WP_NS}align")
        if align_elem is not None and align_elem.text:
            h_align = align_elem.text

    # Parse vertical alignment
    v_align = None
    pos_v = element.find(f"{WP_NS}positionV")
    if pos_v is not None:
        align_elem = pos_v.find(f"{WP_NS}align")
        if align_elem is not None and align_elem.text:
            v_align = align_elem.text

    # Parse wrap type
    wrap_type = None
    for wrap_name in ["wrapSquare", "wrapTight", "wrapThrough", "wrapTopAndBottom", "wrapNone"]:
        wrap_elem = element.find(f"{WP_NS}{wrap_name}")
        if wrap_elem is not None:
            wrap_type = wrap_name.replace("wrap", "").lower()
            break

    # Parse behindDoc attribute
    behind_doc_str = element.get("behindDoc")
    behind_doc = behind_doc_str == "1" if behind_doc_str else None

    return AnchorDrawing(
        extent=extent,
        doc_pr=doc_pr,
        graphic=graphic,
        h_align=h_align,
        v_align=v_align,
        wrap_type=wrap_type,
        behind_doc=behind_doc,
    )


def parse_drawing(element: Element | None) -> Drawing | None:
    """Parse <w:drawing> element.

    XML Example:
        <w:drawing>
            <wp:inline>...</wp:inline>
        </w:drawing>

    or:
        <w:drawing>
            <wp:anchor>...</wp:anchor>
        </w:drawing>

    Args:
        element: The <w:drawing> element or None

    Returns:
        Drawing model or None if element is None
    """
    if element is None:
        return None

    # Check for inline image
    inline_elem = element.find(f"{WP_NS}inline")
    inline = parse_inline_drawing(inline_elem)

    # Check for anchored image
    anchor_elem = element.find(f"{WP_NS}anchor")
    anchor = parse_anchor_drawing(anchor_elem)

    return Drawing(inline=inline, anchor=anchor)
