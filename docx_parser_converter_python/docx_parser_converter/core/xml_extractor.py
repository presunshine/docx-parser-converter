"""XML extraction utilities for DOCX files.

This module provides functions for extracting and parsing XML content
from DOCX archives.
"""

import logging
import zipfile

from lxml import etree
from lxml.etree import _Element as Element

from .constants import (
    DOCUMENT_XML_PATH,
    LOGGER_NAME,
    NUMBERING_XML_PATH,
    REL_NS_URI,
    RELS_XML_PATH,
    STYLES_XML_PATH,
)
from .exceptions import XmlParseError

logger = logging.getLogger(LOGGER_NAME)


def extract_xml(zf: zipfile.ZipFile, part_name: str) -> Element:
    """Extract and parse an XML part from the DOCX archive.

    Args:
        zf: An open ZipFile containing the DOCX.
        part_name: The path to the XML part (e.g., "word/document.xml").

    Returns:
        The root Element of the parsed XML.

    Raises:
        XmlParseError: If the XML cannot be parsed.
        KeyError: If the part doesn't exist in the archive.

    Example:
        >>> with open_docx("document.docx") as zf:
        ...     doc = extract_xml(zf, "word/document.xml")
        ...     print(doc.tag)
    """
    try:
        content = zf.read(part_name)
        return etree.fromstring(content)
    except etree.XMLSyntaxError as e:
        raise XmlParseError(part_name, e) from e
    except KeyError as e:
        raise KeyError(f"Part not found in archive: {part_name}") from e


def extract_xml_safe(zf: zipfile.ZipFile, part_name: str) -> Element | None:
    """Extract and parse an XML part, returning None if not found.

    This is a safe version of extract_xml that returns None instead of
    raising an exception if the part doesn't exist.

    Args:
        zf: An open ZipFile containing the DOCX.
        part_name: The path to the XML part.

    Returns:
        The root Element of the parsed XML, or None if the part
        doesn't exist or cannot be parsed.
    """
    if part_name not in zf.namelist():
        return None

    try:
        return extract_xml(zf, part_name)
    except XmlParseError as e:
        logger.warning(f"Failed to parse {part_name}: {e}")
        return None


def extract_document_xml(zf: zipfile.ZipFile) -> Element:
    """Extract and parse the main document.xml.

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        The root <w:document> Element.

    Raises:
        XmlParseError: If the XML cannot be parsed.
        KeyError: If document.xml doesn't exist.
    """
    return extract_xml(zf, DOCUMENT_XML_PATH)


def extract_styles_xml(zf: zipfile.ZipFile) -> Element | None:
    """Extract and parse styles.xml if present.

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        The root <w:styles> Element, or None if not present.
    """
    return extract_xml_safe(zf, STYLES_XML_PATH)


def extract_numbering_xml(zf: zipfile.ZipFile) -> Element | None:
    """Extract and parse numbering.xml if present.

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        The root <w:numbering> Element, or None if not present.
    """
    return extract_xml_safe(zf, NUMBERING_XML_PATH)


def extract_relationships(zf: zipfile.ZipFile) -> dict[str, str]:
    """Extract document relationships.

    Relationships map relationship IDs (rId) to target URLs.
    This is used for resolving hyperlinks, images, etc.

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        Dictionary mapping relationship IDs to target URLs.
        Empty dict if relationships file doesn't exist.

    Example:
        >>> rels = extract_relationships(zf)
        >>> rels.get("rId1")
        'http://example.com'
    """
    rels_elem = extract_xml_safe(zf, RELS_XML_PATH)
    if rels_elem is None:
        return {}

    result: dict[str, str] = {}
    ns = f"{{{REL_NS_URI}}}"

    for rel in rels_elem.findall(f"{ns}Relationship"):
        rel_id = rel.get("Id")
        target = rel.get("Target")
        if rel_id and target:
            result[rel_id] = target

    return result


def extract_external_hyperlinks(zf: zipfile.ZipFile) -> dict[str, str]:
    """Extract only external hyperlink relationships.

    Filters relationships to include only external hyperlinks
    (those with TargetMode="External").

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        Dictionary mapping relationship IDs to external URLs.

    Example:
        >>> links = extract_external_hyperlinks(zf)
        >>> links.get("rId5")
        'https://www.example.com'
    """
    rels_elem = extract_xml_safe(zf, RELS_XML_PATH)
    if rels_elem is None:
        return {}

    result: dict[str, str] = {}
    ns = f"{{{REL_NS_URI}}}"

    for rel in rels_elem.findall(f"{ns}Relationship"):
        # Only include external relationships
        if rel.get("TargetMode") == "External":
            rel_id = rel.get("Id")
            target = rel.get("Target")
            if rel_id and target:
                result[rel_id] = target

    return result


# Package relationships namespace (used in .rels files)
PACKAGE_REL_NS_URI = "http://schemas.openxmlformats.org/package/2006/relationships"


def extract_image_relationships(zf: zipfile.ZipFile) -> dict[str, str]:
    """Extract image relationships from the document.

    Filters relationships to include only image references
    (those with Type ending in '/image').

    Args:
        zf: An open ZipFile containing the DOCX.

    Returns:
        Dictionary mapping relationship IDs to image paths (relative to word/).

    Example:
        >>> imgs = extract_image_relationships(zf)
        >>> imgs.get("rId4")
        'media/image1.png'
    """
    rels_elem = extract_xml_safe(zf, RELS_XML_PATH)
    if rels_elem is None:
        return {}

    result: dict[str, str] = {}
    # Package relationships use the package namespace, not the office document namespace
    ns = f"{{{PACKAGE_REL_NS_URI}}}"

    for rel in rels_elem.findall(f"{ns}Relationship"):
        rel_type = rel.get("Type") or ""
        # Image relationships have type ending in /image
        if rel_type.endswith("/image"):
            rel_id = rel.get("Id")
            target = rel.get("Target")
            if rel_id and target:
                result[rel_id] = target

    return result


def read_media_file(zf: zipfile.ZipFile, media_path: str) -> bytes | None:
    """Read a media file from the DOCX archive.

    Args:
        zf: An open ZipFile containing the DOCX.
        media_path: Path to the media file relative to word/ (e.g., "media/image1.png").

    Returns:
        The file contents as bytes, or None if not found.

    Example:
        >>> data = read_media_file(zf, "media/image1.png")
        >>> len(data)
        1234
    """
    # The path in relationships is relative to word/
    full_path = f"word/{media_path}"

    if full_path not in zf.namelist():
        logger.warning(f"Media file not found: {full_path}")
        return None

    try:
        return zf.read(full_path)
    except Exception as e:
        logger.warning(f"Failed to read media file {full_path}: {e}")
        return None


def get_media_content_type(filename: str) -> str:
    """Get the MIME content type for a media file.

    Args:
        filename: The filename or path of the media file.

    Returns:
        The MIME type string.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    content_types = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "tif": "image/tiff",
        "webp": "image/webp",
        "svg": "image/svg+xml",
        "emf": "image/x-emf",
        "wmf": "image/x-wmf",
    }

    return content_types.get(ext, "application/octet-stream")


def get_body_element(document: Element) -> Element | None:
    """Get the body element from a document.

    Args:
        document: The root <w:document> element.

    Returns:
        The <w:body> element, or None if not found.
    """
    from .constants import WORD_NS

    return document.find(f"{WORD_NS}body")


def iter_paragraphs(body: Element) -> list[Element]:
    """Iterate over all paragraph elements in the body.

    Args:
        body: The <w:body> element.

    Returns:
        List of <w:p> elements.
    """
    from .constants import WORD_NS

    return body.findall(f".//{WORD_NS}p")


def iter_tables(body: Element) -> list[Element]:
    """Iterate over all table elements in the body.

    Args:
        body: The <w:body> element.

    Returns:
        List of <w:tbl> elements.
    """
    from .constants import WORD_NS

    return body.findall(f".//{WORD_NS}tbl")
