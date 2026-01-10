/**
 * DOCX Parser Converter - TypeScript Library
 *
 * A browser-compatible library for converting DOCX files to HTML or plain text
 * while preserving formatting, styles, lists, and tables.
 *
 * @example
 * ```typescript
 * import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';
 *
 * // Convert to HTML
 * const html = await docxToHtml(buffer);
 *
 * // Convert to plain text
 * const text = await docxToText(buffer);
 *
 * // With configuration
 * const html = await docxToHtml(buffer, {
 *   title: 'My Document',
 *   styleMode: 'class',
 * });
 * ```
 */

// =============================================================================
// Public API
// =============================================================================

export { docxToHtml, docxToText, parseDocx } from './api';

// =============================================================================
// Configuration
// =============================================================================

export type { ConversionConfig, StyleMode, TextFormatting, TableMode } from './config';
export { DEFAULT_CONFIG, toHtmlConfig, toTextConfig } from './config';

// =============================================================================
// Types
// =============================================================================

export type { DocxInput, DocxMetadata } from './api';
export type { DocxSource } from './core/docx-reader';

// =============================================================================
// Exceptions
// =============================================================================

export {
  DocxParserError,
  DocxNotFoundError,
  DocxReadError,
  DocxValidationError,
  DocxEncryptedError,
  DocxMissingPartError,
  DocxInvalidContentTypeError,
  XmlParseError,
} from './core/exceptions';

// =============================================================================
// Core (for advanced usage)
// =============================================================================

export {
  openDocx,
  validateDocx,
  isValidDocx,
  listDocxParts,
  hasPart,
} from './core/docx-reader';

export {
  extractXml,
  extractXmlSafe,
  extractDocumentXml,
  extractStylesXml,
  extractNumberingXml,
  extractRelationships,
  extractExternalHyperlinks,
  extractImageRelationships,
  readMediaFile,
  getMediaContentType,
  getBodyElement,
  iterParagraphs,
  iterTables,
} from './core/xml-extractor';

// =============================================================================
// Converters (for advanced usage)
// =============================================================================

// HTML Converter
export {
  HTMLConverter,
  ConversionError,
  InvalidDocumentError,
  UnsupportedFormatError,
} from './converters/html/html-converter';
export type { ConversionConfig as HTMLConversionConfig } from './converters/html/html-converter';

// Text Converter
export { TextConverter, documentToText } from './converters/text/text-converter';
export type { TextConverterConfig } from './converters/text/text-converter';

// =============================================================================
// Models (for advanced usage)
// =============================================================================

// Document models
export type { Document, Body, BodyContentItem } from './models/document/document';
export type { Paragraph, ParagraphProperties } from './models/document/paragraph';
export type { Run, RunProperties, RunFonts } from './models/document/run';
export type { RunContentItem, Text, Break, TabChar } from './models/document/run-content';
export type { Table, TableProperties, TableRow, TableCell } from './models/document/table';
export type { Hyperlink } from './models/document/hyperlink';
export type { Drawing, Picture, Blip } from './models/document/drawing';
export type { SectionProperties, PageSize, PageMargins } from './models/document/section';

// Style models
export type { Styles } from './models/styles/styles';
export type { Style } from './models/styles/style';
export type { DocumentDefaults } from './models/styles/document-defaults';

// Numbering models
export type { Numbering } from './models/numbering/numbering';
export type { NumberingInstance } from './models/numbering/numbering-instance';
export type { AbstractNumbering } from './models/numbering/abstract-numbering';
export type { Level } from './models/numbering/level';

// Common models
export type { Border, ParagraphBorders, TableBorders } from './models/common/border';
export type { Color } from './models/common/color';
export type { Shading } from './models/common/shading';
export type { Spacing } from './models/common/spacing';
export type { Indentation } from './models/common/indentation';
export type { Width } from './models/common/width';

// =============================================================================
// Parsers (for advanced usage)
// =============================================================================

export { parseDocument } from './parsers/document/document-parser';
export { parseParagraph } from './parsers/document/paragraph-parser';
export { parseRun } from './parsers/document/run-parser';
export { parseTable } from './parsers/document/table-parser';
export { parseStyles } from './parsers/styles/styles-parser';
export { parseNumbering } from './parsers/numbering/numbering-parser';
