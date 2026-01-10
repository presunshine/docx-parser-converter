/**
 * XML namespaces and constants for DOCX parsing.
 *
 * Matches Python: core/constants.py
 */

// =============================================================================
// XML Namespaces (with curly braces for element queries)
// =============================================================================

/** WordprocessingML namespace - main namespace for document content */
export const WORD_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}';

/** Relationships namespace */
export const REL_NS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}';

/** Content Types namespace */
export const CONTENT_TYPES_NS = '{http://schemas.openxmlformats.org/package/2006/content-types}';

/** DrawingML namespace - for shapes and drawings */
export const DRAWING_NS = '{http://schemas.openxmlformats.org/drawingml/2006/main}';

/** WordprocessingDrawing namespace - for positioning drawings in document */
export const WP_NS = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}';

/** Relationship ID namespace (used in element attributes like r:id) */
export const R_NS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}';

/** VML namespace (legacy vector graphics) */
export const VML_NS = '{urn:schemas-microsoft-com:vml}';

/** Office namespace */
export const OFFICE_NS = '{urn:schemas-microsoft-com:office:office}';

// =============================================================================
// Namespace Map (without curly braces, for XPath and element creation)
// =============================================================================

export const NSMAP: Record<string, string> = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  v: 'urn:schemas-microsoft-com:vml',
  o: 'urn:schemas-microsoft-com:office:office',
};

/** Namespace URIs (without curly braces, for reference) */
export const WORD_NS_URI = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const REL_NS_URI = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

// =============================================================================
// File Paths within DOCX Archive
// =============================================================================

/** Main document content */
export const DOCUMENT_XML_PATH = 'word/document.xml';

/** Style definitions */
export const STYLES_XML_PATH = 'word/styles.xml';

/** Numbering (lists) definitions */
export const NUMBERING_XML_PATH = 'word/numbering.xml';

/** Document relationships (for hyperlinks, images, etc.) */
export const RELS_XML_PATH = 'word/_rels/document.xml.rels';

/** Content types manifest */
export const CONTENT_TYPES_PATH = '[Content_Types].xml';

/** Theme definitions (colors, fonts) */
export const THEME_XML_PATH = 'word/theme/theme1.xml';

/** Footnotes and endnotes */
export const FOOTNOTES_XML_PATH = 'word/footnotes.xml';
export const ENDNOTES_XML_PATH = 'word/endnotes.xml';

/** Comments */
export const COMMENTS_XML_PATH = 'word/comments.xml';

/** Headers and footers (numbered patterns) */
export const HEADER_XML_PATTERN = 'word/header{}.xml';
export const FOOTER_XML_PATTERN = 'word/footer{}.xml';

// =============================================================================
// Content Type Constants
// =============================================================================

/** MIME types for validation */
export const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml';
export const STYLES_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml';
export const NUMBERING_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml';
