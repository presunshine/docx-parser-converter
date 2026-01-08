"""Parser for document body elements."""

from lxml.etree import _Element as Element

from ...models.document.document import Body
from ..utils import find_child, get_local_name
from .paragraph_parser import parse_paragraph
from .section_parser import parse_section_properties
from .table_parser import parse_table


def parse_body(element: Element | None) -> Body | None:
    """Parse <w:body> element.

    XML Example:
        <w:body>
            <w:p>...</w:p>
            <w:tbl>...</w:tbl>
            <w:p>...</w:p>
            <w:sectPr>...</w:sectPr>
        </w:body>

    Args:
        element: The <w:body> element or None

    Returns:
        Body model or None if element is None
    """
    if element is None:
        return None

    # Parse content (paragraphs, tables, etc.)
    content = []

    for child in element:
        local_name = get_local_name(child)

        if local_name == "p":
            item = parse_paragraph(child)
        elif local_name == "tbl":
            item = parse_table(child)
        elif local_name == "sectPr":
            # Section properties are handled separately
            continue
        else:
            # Skip unrecognized elements (sdt, customXml, etc.)
            continue

        if item is not None:
            content.append(item)

    # Parse final section properties
    sect_pr = parse_section_properties(find_child(element, "sectPr"))

    return Body(
        content=content,
        sect_pr=sect_pr,
    )
