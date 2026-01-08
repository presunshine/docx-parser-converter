"""Image to HTML converter.

Converts Drawing elements to HTML img tags with base64 data URLs.
"""

import base64
from html import escape

from ...models.document.drawing import AnchorDrawing, Drawing, InlineDrawing

# EMU to pixels conversion (914400 EMU = 1 inch at 96 DPI)
EMU_PER_PIXEL = 9525


def emu_to_px(emu: int | None) -> int | None:
    """Convert EMU (English Metric Units) to pixels.

    Args:
        emu: Value in EMUs

    Returns:
        Value in pixels, or None if input is None
    """
    if emu is None:
        return None
    return round(emu / EMU_PER_PIXEL)


def drawing_to_html(
    drawing: Drawing,
    image_data: dict[str, tuple[bytes, str]],
) -> str:
    """Convert Drawing element to HTML img tag.

    Args:
        drawing: Drawing model instance
        image_data: Pre-loaded image data keyed by relationship ID.
            Each value is (image_bytes, content_type).

    Returns:
        HTML img tag or empty string if image cannot be loaded
    """
    if drawing.inline:
        return inline_drawing_to_html(drawing.inline, image_data)
    elif drawing.anchor:
        return anchor_drawing_to_html(drawing.anchor, image_data)
    return ""


def inline_drawing_to_html(
    inline: InlineDrawing,
    image_data: dict[str, tuple[bytes, str]],
) -> str:
    """Convert inline drawing to HTML img tag.

    Args:
        inline: InlineDrawing model instance
        image_data: Pre-loaded image data keyed by relationship ID

    Returns:
        HTML img tag or empty string
    """
    # Get the relationship ID from the blip
    rel_id = _get_blip_embed(inline.graphic)
    if not rel_id:
        return ""

    # Get the pre-loaded image data
    data = image_data.get(rel_id)
    if not data:
        return ""

    img_bytes, content_type = data

    # Create base64 data URL
    b64_data = base64.b64encode(img_bytes).decode("ascii")
    data_url = f"data:{content_type};base64,{b64_data}"

    # Get dimensions
    width_px = None
    height_px = None
    if inline.extent:
        width_px = emu_to_px(inline.extent.cx)
        height_px = emu_to_px(inline.extent.cy)

    # Get alt text
    alt_text = ""
    if inline.doc_pr and inline.doc_pr.descr:
        alt_text = inline.doc_pr.descr

    # Build style attribute
    style_parts = []
    if width_px:
        style_parts.append(f"width: {width_px}px")
    if height_px:
        style_parts.append(f"height: {height_px}px")

    # Build the img tag
    return _build_img_tag(data_url, alt_text, style_parts)


def anchor_drawing_to_html(
    anchor: AnchorDrawing,
    image_data: dict[str, tuple[bytes, str]],
) -> str:
    """Convert anchored/floating drawing to HTML img tag.

    Args:
        anchor: AnchorDrawing model instance
        image_data: Pre-loaded image data keyed by relationship ID

    Returns:
        HTML img tag with float styling, or empty string
    """
    # Get the relationship ID from the blip
    rel_id = _get_blip_embed(anchor.graphic)
    if not rel_id:
        return ""

    # Get the pre-loaded image data
    data = image_data.get(rel_id)
    if not data:
        return ""

    img_bytes, content_type = data

    # Create base64 data URL
    b64_data = base64.b64encode(img_bytes).decode("ascii")
    data_url = f"data:{content_type};base64,{b64_data}"

    # Get dimensions
    width_px = None
    height_px = None
    if anchor.extent:
        width_px = emu_to_px(anchor.extent.cx)
        height_px = emu_to_px(anchor.extent.cy)

    # Get alt text
    alt_text = ""
    if anchor.doc_pr and anchor.doc_pr.descr:
        alt_text = anchor.doc_pr.descr

    # Build style attribute with float positioning
    style_parts = []
    if width_px:
        style_parts.append(f"width: {width_px}px")
    if height_px:
        style_parts.append(f"height: {height_px}px")

    # Apply float based on horizontal alignment
    # Wrap floated images in a container with clearfix to prevent float from
    # affecting subsequent content (Word anchored images don't bleed into next sections)
    needs_clearfix = False
    if anchor.h_align == "left":
        style_parts.append("float: left")
        style_parts.append("margin-right: 10px")
        style_parts.append("margin-bottom: 10px")
        needs_clearfix = True
    elif anchor.h_align == "right":
        style_parts.append("float: right")
        style_parts.append("margin-left: 10px")
        style_parts.append("margin-bottom: 10px")
        needs_clearfix = True
    elif anchor.h_align == "center":
        style_parts.append("display: block")
        style_parts.append("margin-left: auto")
        style_parts.append("margin-right: auto")

    # Build the img tag
    img_tag = _build_img_tag(data_url, alt_text, style_parts)

    # Wrap floated images in a clearfix container to contain the float
    if needs_clearfix:
        return f'<div style="overflow: hidden;">{img_tag}</div>'

    return img_tag


def _get_blip_embed(graphic: object | None) -> str | None:
    """Extract the blip embed relationship ID from a graphic.

    Args:
        graphic: Graphic model instance

    Returns:
        Relationship ID (e.g., "rId4") or None
    """
    if graphic is None:
        return None

    from ...models.document.drawing import Graphic

    if not isinstance(graphic, Graphic):
        return None

    if graphic.graphic_data is None:
        return None

    if graphic.graphic_data.pic is None:
        return None

    if graphic.graphic_data.pic.blip_fill is None:
        return None

    if graphic.graphic_data.pic.blip_fill.blip is None:
        return None

    return graphic.graphic_data.pic.blip_fill.blip.embed


def _build_img_tag(src: str, alt: str, style_parts: list[str]) -> str:
    """Build an HTML img tag.

    Args:
        src: Image source (data URL or path)
        alt: Alt text for accessibility
        style_parts: List of CSS style declarations

    Returns:
        HTML img tag string
    """
    attrs = [f'src="{src}"']

    if alt:
        attrs.append(f'alt="{escape(alt)}"')
    else:
        attrs.append('alt=""')

    if style_parts:
        style = "; ".join(style_parts)
        attrs.append(f'style="{style}"')

    return f"<img {' '.join(attrs)}>"
