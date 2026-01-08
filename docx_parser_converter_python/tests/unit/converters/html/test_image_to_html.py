"""Unit tests for image to HTML conversion.

Tests cover:
- EMU to pixel conversion
- Inline image conversion
- Anchor/floating image conversion
- Alt text handling
- Image dimensions
- Float positioning (left, right, center)
"""

import base64

from docx_parser_converter.converters.html.image_to_html import (
    _build_img_tag,
    _get_blip_embed,
    anchor_drawing_to_html,
    drawing_to_html,
    emu_to_px,
    inline_drawing_to_html,
)
from docx_parser_converter.models.document.drawing import (
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
)

# =============================================================================
# EMU to Pixel Conversion Tests
# =============================================================================


class TestEmuToPixel:
    """Tests for emu_to_px function."""

    def test_none_returns_none(self):
        """None input returns None."""
        assert emu_to_px(None) is None

    def test_one_inch(self):
        """914400 EMU = 1 inch = 96 pixels at 96 DPI."""
        # 914400 / 9525 = 96
        assert emu_to_px(914400) == 96

    def test_half_inch(self):
        """457200 EMU = 0.5 inch = 48 pixels."""
        assert emu_to_px(457200) == 48

    def test_100_pixels(self):
        """952500 EMU = 100 pixels."""
        # 100 * 9525 = 952500
        assert emu_to_px(952500) == 100

    def test_small_value(self):
        """Small EMU value rounds correctly."""
        # 9525 EMU = 1 pixel
        assert emu_to_px(9525) == 1

    def test_zero(self):
        """Zero EMU returns 0 pixels."""
        assert emu_to_px(0) == 0


# =============================================================================
# Build Img Tag Tests
# =============================================================================


class TestBuildImgTag:
    """Tests for _build_img_tag helper function."""

    def test_basic_img_tag(self):
        """Build basic img tag with src."""
        result = _build_img_tag("data:image/png;base64,ABC", "", [])
        assert result == '<img src="data:image/png;base64,ABC" alt="">'

    def test_img_tag_with_alt(self):
        """Build img tag with alt text."""
        result = _build_img_tag("data:image/png;base64,ABC", "My image", [])
        assert result == '<img src="data:image/png;base64,ABC" alt="My image">'

    def test_img_tag_with_styles(self):
        """Build img tag with style attributes."""
        result = _build_img_tag("data:image/png;base64,ABC", "", ["width: 100px", "height: 50px"])
        assert 'style="width: 100px; height: 50px"' in result

    def test_img_tag_escapes_alt_text(self):
        """Alt text is HTML escaped."""
        result = _build_img_tag("data:image/png;base64,ABC", '<script>"xss"</script>', [])
        assert "&lt;script&gt;" in result
        assert "&quot;xss&quot;" in result


# =============================================================================
# Get Blip Embed Tests
# =============================================================================


class TestGetBlipEmbed:
    """Tests for _get_blip_embed helper function."""

    def test_none_graphic(self):
        """None graphic returns None."""
        assert _get_blip_embed(None) is None

    def test_non_graphic_type(self):
        """Non-Graphic type returns None."""
        assert _get_blip_embed("not a graphic") is None

    def test_graphic_without_data(self):
        """Graphic without graphic_data returns None."""
        graphic = Graphic(graphic_data=None)
        assert _get_blip_embed(graphic) is None

    def test_graphic_without_pic(self):
        """Graphic without pic returns None."""
        graphic = Graphic(graphic_data=GraphicData(pic=None))
        assert _get_blip_embed(graphic) is None

    def test_graphic_without_blip_fill(self):
        """Graphic without blip_fill returns None."""
        graphic = Graphic(graphic_data=GraphicData(pic=Picture(blip_fill=None)))
        assert _get_blip_embed(graphic) is None

    def test_graphic_without_blip(self):
        """Graphic without blip returns None."""
        graphic = Graphic(graphic_data=GraphicData(pic=Picture(blip_fill=BlipFill(blip=None))))
        assert _get_blip_embed(graphic) is None

    def test_graphic_with_embed(self):
        """Graphic with full chain returns embed ID."""
        graphic = Graphic(
            graphic_data=GraphicData(pic=Picture(blip_fill=BlipFill(blip=Blip(embed="rId4"))))
        )
        assert _get_blip_embed(graphic) == "rId4"


# =============================================================================
# Inline Drawing to HTML Tests
# =============================================================================


class TestInlineDrawingToHtml:
    """Tests for inline_drawing_to_html function."""

    def _make_image_data(self, rel_id: str = "rId1") -> dict[str, tuple[bytes, str]]:
        """Create test image data dict."""
        # 1x1 red PNG
        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        return {rel_id: (png_bytes, "image/png")}

    def _make_inline_drawing(
        self,
        embed: str = "rId1",
        cx: int | None = 952500,
        cy: int | None = 952500,
        descr: str | None = None,
    ) -> InlineDrawing:
        """Create test inline drawing."""
        return InlineDrawing(
            extent=DrawingExtent(cx=cx, cy=cy) if cx or cy else None,
            doc_pr=DrawingProperties(id=1, name="Image", descr=descr),
            graphic=Graphic(
                graphic_data=GraphicData(pic=Picture(blip_fill=BlipFill(blip=Blip(embed=embed))))
            ),
        )

    def test_inline_with_dimensions(self):
        """Inline image has width and height in style."""
        inline = self._make_inline_drawing(cx=952500, cy=476250)
        image_data = self._make_image_data()

        result = inline_drawing_to_html(inline, image_data)

        assert "<img " in result
        assert 'src="data:image/png;base64,' in result
        assert "width: 100px" in result
        assert "height: 50px" in result

    def test_inline_with_alt_text(self):
        """Inline image has alt text."""
        inline = self._make_inline_drawing(descr="A red square")
        image_data = self._make_image_data()

        result = inline_drawing_to_html(inline, image_data)

        assert 'alt="A red square"' in result

    def test_inline_without_alt_text(self):
        """Inline image without alt text has empty alt."""
        inline = self._make_inline_drawing(descr=None)
        image_data = self._make_image_data()

        result = inline_drawing_to_html(inline, image_data)

        assert 'alt=""' in result

    def test_inline_missing_image_data(self):
        """Missing image data returns empty string."""
        inline = self._make_inline_drawing(embed="rId999")
        image_data = self._make_image_data("rId1")

        result = inline_drawing_to_html(inline, image_data)

        assert result == ""

    def test_inline_without_graphic(self):
        """Inline without graphic returns empty string."""
        inline = InlineDrawing(
            extent=DrawingExtent(cx=100000, cy=100000),
            graphic=None,
        )
        image_data = self._make_image_data()

        result = inline_drawing_to_html(inline, image_data)

        assert result == ""


# =============================================================================
# Anchor Drawing to HTML Tests
# =============================================================================


class TestAnchorDrawingToHtml:
    """Tests for anchor_drawing_to_html function."""

    def _make_image_data(self, rel_id: str = "rId1") -> dict[str, tuple[bytes, str]]:
        """Create test image data dict."""
        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        return {rel_id: (png_bytes, "image/png")}

    def _make_anchor_drawing(
        self,
        embed: str = "rId1",
        cx: int | None = 952500,
        cy: int | None = 952500,
        h_align: str | None = None,
        descr: str | None = None,
    ) -> AnchorDrawing:
        """Create test anchor drawing."""
        return AnchorDrawing(
            extent=DrawingExtent(cx=cx, cy=cy) if cx or cy else None,
            doc_pr=DrawingProperties(id=1, name="Image", descr=descr),
            graphic=Graphic(
                graphic_data=GraphicData(pic=Picture(blip_fill=BlipFill(blip=Blip(embed=embed))))
            ),
            h_align=h_align,
        )

    def test_anchor_left_aligned(self):
        """Left-aligned anchor uses float: left."""
        anchor = self._make_anchor_drawing(h_align="left")
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert "float: left" in result
        assert "margin-right: 10px" in result
        assert "margin-bottom: 10px" in result
        # Wrapped in clearfix div
        assert '<div style="overflow: hidden;">' in result

    def test_anchor_right_aligned(self):
        """Right-aligned anchor uses float: right."""
        anchor = self._make_anchor_drawing(h_align="right")
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert "float: right" in result
        assert "margin-left: 10px" in result
        assert "margin-bottom: 10px" in result
        # Wrapped in clearfix div
        assert '<div style="overflow: hidden;">' in result

    def test_anchor_center_aligned(self):
        """Center-aligned anchor uses display: block with auto margins."""
        anchor = self._make_anchor_drawing(h_align="center")
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert "display: block" in result
        assert "margin-left: auto" in result
        assert "margin-right: auto" in result
        # Not wrapped in clearfix (no float)
        assert '<div style="overflow: hidden;">' not in result

    def test_anchor_no_alignment(self):
        """Anchor without alignment has no float styling."""
        anchor = self._make_anchor_drawing(h_align=None)
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert "float:" not in result
        assert '<div style="overflow: hidden;">' not in result

    def test_anchor_with_dimensions(self):
        """Anchor image has width and height."""
        anchor = self._make_anchor_drawing(cx=952500, cy=476250)
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert "width: 100px" in result
        assert "height: 50px" in result

    def test_anchor_with_alt_text(self):
        """Anchor image has alt text."""
        anchor = self._make_anchor_drawing(descr="Floating image")
        image_data = self._make_image_data()

        result = anchor_drawing_to_html(anchor, image_data)

        assert 'alt="Floating image"' in result

    def test_anchor_missing_image_data(self):
        """Missing image data returns empty string."""
        anchor = self._make_anchor_drawing(embed="rId999")
        image_data = self._make_image_data("rId1")

        result = anchor_drawing_to_html(anchor, image_data)

        assert result == ""


# =============================================================================
# Drawing to HTML Tests
# =============================================================================


class TestDrawingToHtml:
    """Tests for drawing_to_html function."""

    def _make_image_data(self, rel_id: str = "rId1") -> dict[str, tuple[bytes, str]]:
        """Create test image data dict."""
        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        return {rel_id: (png_bytes, "image/png")}

    def test_drawing_with_inline(self):
        """Drawing with inline image."""
        drawing = Drawing(
            inline=InlineDrawing(
                extent=DrawingExtent(cx=952500, cy=952500),
                doc_pr=DrawingProperties(id=1, descr="Inline"),
                graphic=Graphic(
                    graphic_data=GraphicData(
                        pic=Picture(blip_fill=BlipFill(blip=Blip(embed="rId1")))
                    )
                ),
            ),
            anchor=None,
        )
        image_data = self._make_image_data()

        result = drawing_to_html(drawing, image_data)

        assert "<img " in result
        assert 'alt="Inline"' in result

    def test_drawing_with_anchor(self):
        """Drawing with anchor image."""
        drawing = Drawing(
            inline=None,
            anchor=AnchorDrawing(
                extent=DrawingExtent(cx=952500, cy=952500),
                doc_pr=DrawingProperties(id=1, descr="Floating"),
                graphic=Graphic(
                    graphic_data=GraphicData(
                        pic=Picture(blip_fill=BlipFill(blip=Blip(embed="rId1")))
                    )
                ),
                h_align="left",
            ),
        )
        image_data = self._make_image_data()

        result = drawing_to_html(drawing, image_data)

        assert "<img " in result
        assert 'alt="Floating"' in result
        assert "float: left" in result

    def test_drawing_empty(self):
        """Drawing without inline or anchor returns empty string."""
        drawing = Drawing(inline=None, anchor=None)
        image_data = self._make_image_data()

        result = drawing_to_html(drawing, image_data)

        assert result == ""


# =============================================================================
# Image Format Tests
# =============================================================================


class TestImageFormats:
    """Tests for different image format handling."""

    def _make_inline_with_data(
        self, image_bytes: bytes, content_type: str
    ) -> tuple[InlineDrawing, dict[str, tuple[bytes, str]]]:
        """Create inline drawing with specific image data."""
        inline = InlineDrawing(
            extent=DrawingExtent(cx=952500, cy=952500),
            graphic=Graphic(
                graphic_data=GraphicData(pic=Picture(blip_fill=BlipFill(blip=Blip(embed="rId1"))))
            ),
        )
        image_data = {"rId1": (image_bytes, content_type)}
        return inline, image_data

    def test_png_format(self):
        """PNG image uses image/png content type."""
        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        inline, image_data = self._make_inline_with_data(png_bytes, "image/png")

        result = inline_drawing_to_html(inline, image_data)

        assert 'src="data:image/png;base64,' in result

    def test_jpeg_format(self):
        """JPEG image uses image/jpeg content type."""
        # Minimal valid JPEG (1x1 pixel)
        jpeg_bytes = bytes(
            [
                0xFF,
                0xD8,
                0xFF,
                0xE0,
                0x00,
                0x10,
                0x4A,
                0x46,
                0x49,
                0x46,
                0x00,
                0x01,
                0x01,
                0x00,
                0x00,
                0x01,
                0x00,
                0x01,
                0x00,
                0x00,
                0xFF,
                0xD9,
            ]
        )
        inline, image_data = self._make_inline_with_data(jpeg_bytes, "image/jpeg")

        result = inline_drawing_to_html(inline, image_data)

        assert 'src="data:image/jpeg;base64,' in result

    def test_gif_format(self):
        """GIF image uses image/gif content type."""
        # Minimal GIF header
        gif_bytes = b"GIF89a\x01\x00\x01\x00\x00\x00\x00;"
        inline, image_data = self._make_inline_with_data(gif_bytes, "image/gif")

        result = inline_drawing_to_html(inline, image_data)

        assert 'src="data:image/gif;base64,' in result
