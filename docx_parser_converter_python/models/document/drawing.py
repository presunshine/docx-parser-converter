"""Drawing models for DOCX documents.

These models represent drawing elements (images, shapes) that can appear inside a run.
"""

from pydantic import BaseModel


class DrawingExtent(BaseModel):
    """Image dimensions in EMUs (English Metric Units).

    XML Element: <wp:extent> or <a:ext>

    XML Example:
        <wp:extent cx="914400" cy="914400"/>

    Note: 914400 EMU = 1 inch = 72 points

    Attributes:
        cx: Width in EMUs
        cy: Height in EMUs
    """

    cx: int | None = None
    cy: int | None = None

    model_config = {"extra": "ignore"}


class DrawingProperties(BaseModel):
    """Drawing document properties.

    XML Element: <wp:docPr>

    XML Example:
        <wp:docPr id="1" name="Picture 1" descr="A sample image"/>

    Attributes:
        id: Unique identifier
        name: Name of the drawing
        descr: Description/alt text for accessibility
    """

    id: int | None = None
    name: str | None = None
    descr: str | None = None

    model_config = {"extra": "ignore"}


class Blip(BaseModel):
    """Binary Large Image/Picture reference.

    XML Element: <a:blip>

    XML Example:
        <a:blip r:embed="rId4"/>

    Attributes:
        embed: Relationship ID pointing to the image file in word/media/
    """

    embed: str | None = None

    model_config = {"extra": "ignore"}


class BlipFill(BaseModel):
    """Blip fill containing image reference.

    XML Element: <pic:blipFill>

    XML Example:
        <pic:blipFill>
            <a:blip r:embed="rId4"/>
            <a:stretch><a:fillRect/></a:stretch>
        </pic:blipFill>

    Attributes:
        blip: The image reference
    """

    blip: Blip | None = None

    model_config = {"extra": "ignore"}


class ShapeProperties(BaseModel):
    """Shape properties including transforms.

    XML Element: <pic:spPr>

    XML Example:
        <pic:spPr>
            <a:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="914400" cy="914400"/>
            </a:xfrm>
        </pic:spPr>

    Attributes:
        extent: Size from transform
    """

    extent: DrawingExtent | None = None

    model_config = {"extra": "ignore"}


class Picture(BaseModel):
    """Picture element containing image data reference.

    XML Element: <pic:pic>

    XML Example:
        <pic:pic>
            <pic:nvPicPr>...</pic:nvPicPr>
            <pic:blipFill>
                <a:blip r:embed="rId4"/>
            </pic:blipFill>
            <pic:spPr>...</pic:spPr>
        </pic:pic>

    Attributes:
        blip_fill: Contains the image reference
        sp_pr: Shape properties with dimensions
    """

    blip_fill: BlipFill | None = None
    sp_pr: ShapeProperties | None = None

    model_config = {"extra": "ignore"}


class GraphicData(BaseModel):
    """Graphic data container.

    XML Element: <a:graphicData>

    XML Example:
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>...</pic:pic>
        </a:graphicData>

    Attributes:
        uri: Namespace URI identifying the graphic type
        pic: Picture element (for images)
    """

    uri: str | None = None
    pic: Picture | None = None

    model_config = {"extra": "ignore"}


class Graphic(BaseModel):
    """Graphic container.

    XML Element: <a:graphic>

    XML Example:
        <a:graphic>
            <a:graphicData uri="...">
                <pic:pic>...</pic:pic>
            </a:graphicData>
        </a:graphic>

    Attributes:
        graphic_data: The graphic data containing the picture
    """

    graphic_data: GraphicData | None = None

    model_config = {"extra": "ignore"}


class InlineDrawing(BaseModel):
    """Inline image positioning.

    XML Element: <wp:inline>

    XML Example:
        <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="914400" cy="914400"/>
            <wp:docPr id="1" name="Picture 1"/>
            <a:graphic>...</a:graphic>
        </wp:inline>

    Inline images flow with text, like a character.

    Attributes:
        extent: Image dimensions
        doc_pr: Document properties (id, name, alt text)
        graphic: The graphic content
    """

    extent: DrawingExtent | None = None
    doc_pr: DrawingProperties | None = None
    graphic: Graphic | None = None

    model_config = {"extra": "ignore"}


class AnchorDrawing(BaseModel):
    """Floating/anchored image positioning.

    XML Element: <wp:anchor>

    XML Example:
        <wp:anchor distT="0" distB="0" distL="114300" distR="114300"
                   simplePos="0" relativeHeight="251658240"
                   behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
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

    Anchored images float and can be positioned relative to page/column/paragraph.

    Attributes:
        extent: Image dimensions
        doc_pr: Document properties (id, name, alt text)
        graphic: The graphic content
        h_align: Horizontal alignment (left, center, right)
        v_align: Vertical alignment
        wrap_type: Text wrapping type (square, tight, none, etc.)
        behind_doc: Whether image is behind text
    """

    extent: DrawingExtent | None = None
    doc_pr: DrawingProperties | None = None
    graphic: Graphic | None = None
    h_align: str | None = None
    v_align: str | None = None
    wrap_type: str | None = None
    behind_doc: bool | None = None

    model_config = {"extra": "ignore"}


class Drawing(BaseModel):
    """Container for drawing elements (images, shapes).

    XML Element: <w:drawing>

    XML Example:
        <w:drawing>
            <wp:inline>...</wp:inline>
        </w:drawing>

    or:
        <w:drawing>
            <wp:anchor>...</wp:anchor>
        </w:drawing>

    A drawing can contain either an inline image or an anchored (floating) image.

    Attributes:
        inline: Inline image (flows with text)
        anchor: Anchored/floating image
    """

    inline: InlineDrawing | None = None
    anchor: AnchorDrawing | None = None

    model_config = {"extra": "ignore"}
