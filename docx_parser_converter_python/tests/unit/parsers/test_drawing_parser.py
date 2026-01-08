"""Unit tests for drawing parsers (images, shapes).

Tests cover:
- Drawing extent parsing (<wp:extent>, <a:ext>)
- Document properties parsing (<wp:docPr>)
- Blip/image reference parsing (<a:blip>)
- Picture parsing (<pic:pic>)
- Inline drawing parsing (<wp:inline>)
- Anchor drawing parsing (<wp:anchor>)
- Complete drawing parsing (<w:drawing>)
"""

from lxml import etree

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
    ShapeProperties,
)
from docx_parser_converter.parsers.document.drawing_parser import (
    parse_anchor_drawing,
    parse_blip,
    parse_blip_fill,
    parse_doc_pr,
    parse_drawing,
    parse_extent,
    parse_graphic,
    parse_graphic_data,
    parse_inline_drawing,
    parse_picture,
    parse_shape_properties,
)

# Namespaces for drawing elements
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def make_drawing_element(xml_string: str) -> etree._Element:
    """Parse XML string with drawing namespaces into an lxml element.

    Args:
        xml_string: XML string with namespace prefixes (w:, wp:, a:, pic:, r:).

    Returns:
        Parsed lxml Element (the first child of root).
    """
    wrapped = f"""<root xmlns:w="{W_NS}" xmlns:wp="{WP_NS}" xmlns:a="{A_NS}"
                        xmlns:pic="{PIC_NS}" xmlns:r="{R_NS}">{xml_string}</root>"""
    root = etree.fromstring(wrapped.encode())
    return root[0]


# =============================================================================
# Extent Parser Tests (<wp:extent>, <a:ext>)
# =============================================================================


class TestExtentParser:
    """Tests for parse_extent function.

    XML Element: <wp:extent> or <a:ext>
    Attributes: cx, cy (dimensions in EMUs)
    """

    def test_parse_extent_none(self):
        """None input returns None."""
        result = parse_extent(None)
        assert result is None

    def test_parse_extent_with_dimensions(self):
        """Parse extent with width and height."""
        elem = make_drawing_element('<wp:extent cx="914400" cy="457200"/>')
        result = parse_extent(elem)
        assert result is not None
        assert isinstance(result, DrawingExtent)
        assert result.cx == 914400  # 1 inch
        assert result.cy == 457200  # 0.5 inch

    def test_parse_extent_only_width(self):
        """Parse extent with only width."""
        elem = make_drawing_element('<wp:extent cx="914400"/>')
        result = parse_extent(elem)
        assert result is not None
        assert result.cx == 914400
        assert result.cy is None

    def test_parse_extent_only_height(self):
        """Parse extent with only height."""
        elem = make_drawing_element('<wp:extent cy="914400"/>')
        result = parse_extent(elem)
        assert result is not None
        assert result.cx is None
        assert result.cy == 914400

    def test_parse_extent_empty(self):
        """Parse extent without attributes."""
        elem = make_drawing_element("<wp:extent/>")
        result = parse_extent(elem)
        assert result is not None
        assert result.cx is None
        assert result.cy is None

    def test_parse_extent_a_ext(self):
        """Parse <a:ext> element (same structure as wp:extent)."""
        elem = make_drawing_element('<a:ext cx="1000000" cy="500000"/>')
        result = parse_extent(elem)
        assert result is not None
        assert result.cx == 1000000
        assert result.cy == 500000


# =============================================================================
# Document Properties Parser Tests (<wp:docPr>)
# =============================================================================


class TestDocPrParser:
    """Tests for parse_doc_pr function.

    XML Element: <wp:docPr>
    Attributes: id, name, descr (alt text)
    """

    def test_parse_doc_pr_none(self):
        """None input returns None."""
        result = parse_doc_pr(None)
        assert result is None

    def test_parse_doc_pr_full(self):
        """Parse docPr with all attributes."""
        elem = make_drawing_element('<wp:docPr id="1" name="Picture 1" descr="A sample image"/>')
        result = parse_doc_pr(elem)
        assert result is not None
        assert isinstance(result, DrawingProperties)
        assert result.id == 1
        assert result.name == "Picture 1"
        assert result.descr == "A sample image"

    def test_parse_doc_pr_minimal(self):
        """Parse docPr with only id."""
        elem = make_drawing_element('<wp:docPr id="5"/>')
        result = parse_doc_pr(elem)
        assert result is not None
        assert result.id == 5
        assert result.name is None
        assert result.descr is None

    def test_parse_doc_pr_empty(self):
        """Parse docPr without attributes."""
        elem = make_drawing_element("<wp:docPr/>")
        result = parse_doc_pr(elem)
        assert result is not None
        assert result.id is None
        assert result.name is None
        assert result.descr is None

    def test_parse_doc_pr_special_characters_in_descr(self):
        """Parse docPr with special characters in description."""
        elem = make_drawing_element(
            '<wp:docPr id="1" descr="Image with &amp; and &lt;special&gt; chars"/>'
        )
        result = parse_doc_pr(elem)
        assert result is not None
        assert result.descr == "Image with & and <special> chars"


# =============================================================================
# Blip Parser Tests (<a:blip>)
# =============================================================================


class TestBlipParser:
    """Tests for parse_blip function.

    XML Element: <a:blip>
    Attributes: r:embed (relationship ID)
    """

    def test_parse_blip_none(self):
        """None input returns None."""
        result = parse_blip(None)
        assert result is None

    def test_parse_blip_with_embed(self):
        """Parse blip with relationship ID."""
        elem = make_drawing_element('<a:blip r:embed="rId4"/>')
        result = parse_blip(elem)
        assert result is not None
        assert isinstance(result, Blip)
        assert result.embed == "rId4"

    def test_parse_blip_different_rid(self):
        """Parse blip with different relationship ID."""
        elem = make_drawing_element('<a:blip r:embed="rId123"/>')
        result = parse_blip(elem)
        assert result is not None
        assert result.embed == "rId123"

    def test_parse_blip_empty(self):
        """Parse blip without embed attribute."""
        elem = make_drawing_element("<a:blip/>")
        result = parse_blip(elem)
        assert result is not None
        assert result.embed is None


# =============================================================================
# BlipFill Parser Tests (<pic:blipFill>)
# =============================================================================


class TestBlipFillParser:
    """Tests for parse_blip_fill function.

    XML Element: <pic:blipFill>
    Children: <a:blip>
    """

    def test_parse_blip_fill_none(self):
        """None input returns None."""
        result = parse_blip_fill(None)
        assert result is None

    def test_parse_blip_fill_with_blip(self):
        """Parse blipFill containing blip."""
        elem = make_drawing_element(
            """<pic:blipFill>
                <a:blip r:embed="rId5"/>
            </pic:blipFill>"""
        )
        result = parse_blip_fill(elem)
        assert result is not None
        assert isinstance(result, BlipFill)
        assert result.blip is not None
        assert result.blip.embed == "rId5"

    def test_parse_blip_fill_empty(self):
        """Parse blipFill without blip child."""
        elem = make_drawing_element("<pic:blipFill/>")
        result = parse_blip_fill(elem)
        assert result is not None
        assert result.blip is None


# =============================================================================
# Shape Properties Parser Tests (<pic:spPr>)
# =============================================================================


class TestShapePropertiesParser:
    """Tests for parse_shape_properties function.

    XML Element: <pic:spPr>
    Children: <a:xfrm> with <a:ext>
    """

    def test_parse_shape_properties_none(self):
        """None input returns None."""
        result = parse_shape_properties(None)
        assert result is None

    def test_parse_shape_properties_with_transform(self):
        """Parse spPr with transform containing extent."""
        elem = make_drawing_element(
            """<pic:spPr>
                <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="914400" cy="914400"/>
                </a:xfrm>
            </pic:spPr>"""
        )
        result = parse_shape_properties(elem)
        assert result is not None
        assert isinstance(result, ShapeProperties)
        assert result.extent is not None
        assert result.extent.cx == 914400
        assert result.extent.cy == 914400

    def test_parse_shape_properties_empty(self):
        """Parse spPr without transform."""
        elem = make_drawing_element("<pic:spPr/>")
        result = parse_shape_properties(elem)
        assert result is not None
        assert result.extent is None


# =============================================================================
# Picture Parser Tests (<pic:pic>)
# =============================================================================


class TestPictureParser:
    """Tests for parse_picture function.

    XML Element: <pic:pic>
    Children: <pic:blipFill>, <pic:spPr>
    """

    def test_parse_picture_none(self):
        """None input returns None."""
        result = parse_picture(None)
        assert result is None

    def test_parse_picture_full(self):
        """Parse picture with blipFill and spPr."""
        elem = make_drawing_element(
            """<pic:pic>
                <pic:nvPicPr>
                    <pic:cNvPr id="0" name="image.png"/>
                </pic:nvPicPr>
                <pic:blipFill>
                    <a:blip r:embed="rId6"/>
                </pic:blipFill>
                <pic:spPr>
                    <a:xfrm>
                        <a:ext cx="500000" cy="300000"/>
                    </a:xfrm>
                </pic:spPr>
            </pic:pic>"""
        )
        result = parse_picture(elem)
        assert result is not None
        assert isinstance(result, Picture)
        assert result.blip_fill is not None
        assert result.blip_fill.blip is not None
        assert result.blip_fill.blip.embed == "rId6"
        assert result.sp_pr is not None
        assert result.sp_pr.extent is not None
        assert result.sp_pr.extent.cx == 500000

    def test_parse_picture_minimal(self):
        """Parse picture with only blipFill."""
        elem = make_drawing_element(
            """<pic:pic>
                <pic:blipFill>
                    <a:blip r:embed="rId7"/>
                </pic:blipFill>
            </pic:pic>"""
        )
        result = parse_picture(elem)
        assert result is not None
        assert result.blip_fill is not None
        assert result.blip_fill.blip is not None
        assert result.blip_fill.blip.embed == "rId7"
        assert result.sp_pr is None

    def test_parse_picture_empty(self):
        """Parse empty picture element."""
        elem = make_drawing_element("<pic:pic/>")
        result = parse_picture(elem)
        assert result is not None
        assert result.blip_fill is None
        assert result.sp_pr is None


# =============================================================================
# Graphic Data Parser Tests (<a:graphicData>)
# =============================================================================


class TestGraphicDataParser:
    """Tests for parse_graphic_data function.

    XML Element: <a:graphicData>
    Attributes: uri
    Children: <pic:pic>
    """

    def test_parse_graphic_data_none(self):
        """None input returns None."""
        result = parse_graphic_data(None)
        assert result is None

    def test_parse_graphic_data_with_picture(self):
        """Parse graphicData with picture."""
        elem = make_drawing_element(
            """<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                    <pic:blipFill>
                        <a:blip r:embed="rId8"/>
                    </pic:blipFill>
                </pic:pic>
            </a:graphicData>"""
        )
        result = parse_graphic_data(elem)
        assert result is not None
        assert isinstance(result, GraphicData)
        assert result.uri == "http://schemas.openxmlformats.org/drawingml/2006/picture"
        assert result.pic is not None
        assert result.pic.blip_fill is not None
        assert result.pic.blip_fill.blip is not None
        assert result.pic.blip_fill.blip.embed == "rId8"

    def test_parse_graphic_data_empty(self):
        """Parse graphicData without picture."""
        elem = make_drawing_element("<a:graphicData/>")
        result = parse_graphic_data(elem)
        assert result is not None
        assert result.uri is None
        assert result.pic is None


# =============================================================================
# Graphic Parser Tests (<a:graphic>)
# =============================================================================


class TestGraphicParser:
    """Tests for parse_graphic function.

    XML Element: <a:graphic>
    Children: <a:graphicData>
    """

    def test_parse_graphic_none(self):
        """None input returns None."""
        result = parse_graphic(None)
        assert result is None

    def test_parse_graphic_with_data(self):
        """Parse graphic with graphicData."""
        elem = make_drawing_element(
            """<a:graphic>
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic>
                        <pic:blipFill>
                            <a:blip r:embed="rId9"/>
                        </pic:blipFill>
                    </pic:pic>
                </a:graphicData>
            </a:graphic>"""
        )
        result = parse_graphic(elem)
        assert result is not None
        assert isinstance(result, Graphic)
        assert result.graphic_data is not None
        assert result.graphic_data.pic is not None
        assert result.graphic_data.pic.blip_fill is not None
        assert result.graphic_data.pic.blip_fill.blip is not None
        assert result.graphic_data.pic.blip_fill.blip.embed == "rId9"

    def test_parse_graphic_empty(self):
        """Parse empty graphic element."""
        elem = make_drawing_element("<a:graphic/>")
        result = parse_graphic(elem)
        assert result is not None
        assert result.graphic_data is None


# =============================================================================
# Inline Drawing Parser Tests (<wp:inline>)
# =============================================================================


class TestInlineDrawingParser:
    """Tests for parse_inline_drawing function.

    XML Element: <wp:inline>
    Children: <wp:extent>, <wp:docPr>, <a:graphic>
    """

    def test_parse_inline_drawing_none(self):
        """None input returns None."""
        result = parse_inline_drawing(None)
        assert result is None

    def test_parse_inline_drawing_full(self):
        """Parse complete inline drawing with all children."""
        elem = make_drawing_element(
            """<wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="952500" cy="476250"/>
                <wp:docPr id="1" name="Picture 1" descr="Alt text here"/>
                <a:graphic>
                    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                        <pic:pic>
                            <pic:blipFill>
                                <a:blip r:embed="rId10"/>
                            </pic:blipFill>
                        </pic:pic>
                    </a:graphicData>
                </a:graphic>
            </wp:inline>"""
        )
        result = parse_inline_drawing(elem)
        assert result is not None
        assert isinstance(result, InlineDrawing)
        # Check extent
        assert result.extent is not None
        assert result.extent.cx == 952500
        assert result.extent.cy == 476250
        # Check docPr
        assert result.doc_pr is not None
        assert result.doc_pr.id == 1
        assert result.doc_pr.name == "Picture 1"
        assert result.doc_pr.descr == "Alt text here"
        # Check graphic
        assert result.graphic is not None
        assert result.graphic.graphic_data is not None
        assert result.graphic.graphic_data.pic is not None
        assert result.graphic.graphic_data.pic.blip_fill is not None
        assert result.graphic.graphic_data.pic.blip_fill.blip is not None
        assert result.graphic.graphic_data.pic.blip_fill.blip.embed == "rId10"

    def test_parse_inline_drawing_minimal(self):
        """Parse inline drawing with only extent."""
        elem = make_drawing_element(
            """<wp:inline>
                <wp:extent cx="100000" cy="100000"/>
            </wp:inline>"""
        )
        result = parse_inline_drawing(elem)
        assert result is not None
        assert result.extent is not None
        assert result.extent.cx == 100000
        assert result.doc_pr is None
        assert result.graphic is None

    def test_parse_inline_drawing_empty(self):
        """Parse empty inline drawing."""
        elem = make_drawing_element("<wp:inline/>")
        result = parse_inline_drawing(elem)
        assert result is not None
        assert result.extent is None
        assert result.doc_pr is None
        assert result.graphic is None


# =============================================================================
# Anchor Drawing Parser Tests (<wp:anchor>)
# =============================================================================


class TestAnchorDrawingParser:
    """Tests for parse_anchor_drawing function.

    XML Element: <wp:anchor>
    Attributes: behindDoc
    Children: <wp:positionH>, <wp:positionV>, <wp:extent>, <wp:wrapX>, <wp:docPr>, <a:graphic>
    """

    def test_parse_anchor_drawing_none(self):
        """None input returns None."""
        result = parse_anchor_drawing(None)
        assert result is None

    def test_parse_anchor_drawing_left_aligned(self):
        """Parse anchor with left horizontal alignment."""
        elem = make_drawing_element(
            """<wp:anchor behindDoc="0">
                <wp:positionH relativeFrom="column">
                    <wp:align>left</wp:align>
                </wp:positionH>
                <wp:positionV relativeFrom="paragraph">
                    <wp:posOffset>0</wp:posOffset>
                </wp:positionV>
                <wp:extent cx="800000" cy="800000"/>
                <wp:wrapSquare wrapText="bothSides"/>
                <wp:docPr id="2" name="Floating Image"/>
                <a:graphic>
                    <a:graphicData>
                        <pic:pic>
                            <pic:blipFill>
                                <a:blip r:embed="rId11"/>
                            </pic:blipFill>
                        </pic:pic>
                    </a:graphicData>
                </a:graphic>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert isinstance(result, AnchorDrawing)
        assert result.h_align == "left"
        assert result.v_align is None  # posOffset, not align
        assert result.wrap_type == "square"
        assert result.behind_doc is False
        assert result.extent is not None
        assert result.extent.cx == 800000
        assert result.doc_pr is not None
        assert result.doc_pr.name == "Floating Image"

    def test_parse_anchor_drawing_right_aligned(self):
        """Parse anchor with right horizontal alignment."""
        elem = make_drawing_element(
            """<wp:anchor>
                <wp:positionH relativeFrom="margin">
                    <wp:align>right</wp:align>
                </wp:positionH>
                <wp:extent cx="500000" cy="500000"/>
                <wp:wrapTight wrapText="bothSides"/>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.h_align == "right"
        assert result.wrap_type == "tight"

    def test_parse_anchor_drawing_center_aligned(self):
        """Parse anchor with center horizontal alignment."""
        elem = make_drawing_element(
            """<wp:anchor>
                <wp:positionH relativeFrom="page">
                    <wp:align>center</wp:align>
                </wp:positionH>
                <wp:extent cx="600000" cy="400000"/>
                <wp:wrapTopAndBottom/>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.h_align == "center"
        assert result.wrap_type == "topandbottom"

    def test_parse_anchor_drawing_wrap_none(self):
        """Parse anchor with no wrapping."""
        elem = make_drawing_element(
            """<wp:anchor>
                <wp:extent cx="400000" cy="400000"/>
                <wp:wrapNone/>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.wrap_type == "none"

    def test_parse_anchor_drawing_behind_doc(self):
        """Parse anchor with behindDoc='1'."""
        elem = make_drawing_element(
            """<wp:anchor behindDoc="1">
                <wp:extent cx="300000" cy="300000"/>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.behind_doc is True

    def test_parse_anchor_drawing_vertical_align(self):
        """Parse anchor with vertical alignment."""
        elem = make_drawing_element(
            """<wp:anchor>
                <wp:positionH relativeFrom="column">
                    <wp:align>left</wp:align>
                </wp:positionH>
                <wp:positionV relativeFrom="paragraph">
                    <wp:align>top</wp:align>
                </wp:positionV>
                <wp:extent cx="200000" cy="200000"/>
            </wp:anchor>"""
        )
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.h_align == "left"
        assert result.v_align == "top"

    def test_parse_anchor_drawing_empty(self):
        """Parse empty anchor element."""
        elem = make_drawing_element("<wp:anchor/>")
        result = parse_anchor_drawing(elem)
        assert result is not None
        assert result.extent is None
        assert result.doc_pr is None
        assert result.graphic is None
        assert result.h_align is None
        assert result.v_align is None
        assert result.wrap_type is None
        assert result.behind_doc is None


# =============================================================================
# Drawing Parser Tests (<w:drawing>)
# =============================================================================


class TestDrawingParser:
    """Tests for parse_drawing function.

    XML Element: <w:drawing>
    Children: <wp:inline> or <wp:anchor>
    """

    def test_parse_drawing_none(self):
        """None input returns None."""
        result = parse_drawing(None)
        assert result is None

    def test_parse_drawing_inline(self):
        """Parse drawing containing inline image."""
        elem = make_drawing_element(
            """<w:drawing>
                <wp:inline>
                    <wp:extent cx="914400" cy="914400"/>
                    <wp:docPr id="1" name="Inline Image"/>
                    <a:graphic>
                        <a:graphicData>
                            <pic:pic>
                                <pic:blipFill>
                                    <a:blip r:embed="rId12"/>
                                </pic:blipFill>
                            </pic:pic>
                        </a:graphicData>
                    </a:graphic>
                </wp:inline>
            </w:drawing>"""
        )
        result = parse_drawing(elem)
        assert result is not None
        assert isinstance(result, Drawing)
        assert result.inline is not None
        assert result.anchor is None
        assert result.inline.extent is not None
        assert result.inline.extent.cx == 914400
        assert result.inline.doc_pr is not None
        assert result.inline.doc_pr.name == "Inline Image"
        assert result.inline.graphic is not None
        assert result.inline.graphic.graphic_data is not None
        assert result.inline.graphic.graphic_data.pic is not None
        assert result.inline.graphic.graphic_data.pic.blip_fill is not None
        assert result.inline.graphic.graphic_data.pic.blip_fill.blip is not None
        assert result.inline.graphic.graphic_data.pic.blip_fill.blip.embed == "rId12"

    def test_parse_drawing_anchor(self):
        """Parse drawing containing anchor image."""
        elem = make_drawing_element(
            """<w:drawing>
                <wp:anchor behindDoc="0">
                    <wp:positionH relativeFrom="column">
                        <wp:align>right</wp:align>
                    </wp:positionH>
                    <wp:extent cx="1000000" cy="500000"/>
                    <wp:wrapSquare wrapText="bothSides"/>
                    <wp:docPr id="2" name="Floating Image"/>
                    <a:graphic>
                        <a:graphicData>
                            <pic:pic>
                                <pic:blipFill>
                                    <a:blip r:embed="rId13"/>
                                </pic:blipFill>
                            </pic:pic>
                        </a:graphicData>
                    </a:graphic>
                </wp:anchor>
            </w:drawing>"""
        )
        result = parse_drawing(elem)
        assert result is not None
        assert result.inline is None
        assert result.anchor is not None
        assert result.anchor.h_align == "right"
        assert result.anchor.wrap_type == "square"
        assert result.anchor.extent is not None
        assert result.anchor.extent.cx == 1000000

    def test_parse_drawing_empty(self):
        """Parse empty drawing element."""
        elem = make_drawing_element("<w:drawing/>")
        result = parse_drawing(elem)
        assert result is not None
        assert result.inline is None
        assert result.anchor is None
