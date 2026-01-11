/**
 * Public API for DOCX to HTML/Text conversion.
 *
 * This module provides the main entry points for converting DOCX files:
 * - docxToHtml: Convert DOCX to HTML
 * - docxToText: Convert DOCX to plain text
 *
 * Matches Python: api.py
 */

import type { Document } from './models/document/document';
import type { Styles } from './models/styles/styles';
import type { Numbering } from './models/numbering/numbering';
import type { ConversionConfig } from './config';
import { toHtmlConfig, toTextConfig } from './config';
import { openDocx, validateDocx, type DocxSource } from './core/docx-reader';
import {
  DocxNotFoundError,
  DocxReadError,
  DocxValidationError,
} from './core/exceptions';
import {
  extractDocumentXml,
  extractStylesXml,
  extractNumberingXml,
  extractExternalHyperlinks,
  extractImageRelationships,
  readMediaFile,
  getMediaContentType,
} from './core/xml-extractor';
import { parseDocument } from './parsers/document/document-parser';
import { parseStyles } from './parsers/styles/styles-parser';
import { parseNumbering } from './parsers/numbering/numbering-parser';
import { HTMLConverter } from './converters/html/html-converter';
import { TextConverter } from './converters/text/text-converter';
import type { ImageData } from './converters/html/image-to-html';

// =============================================================================
// Types
// =============================================================================

/** Input source types for DOCX conversion */
export type DocxInput = DocxSource | Document | null | undefined;

/** Metadata extracted from DOCX parsing */
export interface DocxMetadata {
  styles: Styles | null;
  numbering: Numbering | null;
  relationships: Record<string, string>;
  imageRelationships: Record<string, string>;
  imageData: ImageData;
}

/** Additional options for conversion (separate from config) */
export interface ConversionOptions {
  /** Path to write output file (Node.js only) */
  outputPath?: string;
}

// =============================================================================
// DOCX Parsing
// =============================================================================

/**
 * Parse DOCX file and extract all necessary components.
 *
 * @param source - Input DOCX file (path, ArrayBuffer, Uint8Array, or Blob)
 * @returns Tuple of [Document, metadata] with styles, numbering, relationships
 * @throws DocxNotFoundError if file doesn't exist
 * @throws DocxReadError if file cannot be read
 * @throws DocxValidationError if file is not a valid DOCX
 */
export async function parseDocx(
  source: DocxSource
): Promise<[Document | null, DocxMetadata]> {
  try {
    // Open and validate DOCX
    const zip = await openDocx(source);
    await validateDocx(zip);

    // Extract XML parts
    const docXml = await extractDocumentXml(zip);
    const stylesXml = await extractStylesXml(zip);
    const numberingXml = await extractNumberingXml(zip);
    const relationships = await extractExternalHyperlinks(zip);

    // Extract image relationships and pre-load image data
    const imageRelationships = await extractImageRelationships(zip);
    const imageData: ImageData = new Map();

    for (const [relId, mediaPath] of Object.entries(imageRelationships)) {
      const data = await readMediaFile(zip, mediaPath);
      if (data) {
        const contentType = getMediaContentType(mediaPath);
        imageData.set(relId, { bytes: data, contentType });
      }
    }

    // Parse to models
    const document = parseDocument(docXml);
    const styles = stylesXml ? parseStyles(stylesXml) : null;
    const numbering = numberingXml ? parseNumbering(numberingXml) : null;

    return [
      document,
      {
        styles,
        numbering,
        relationships,
        imageRelationships,
        imageData,
      },
    ];
  } catch (e) {
    // Re-raise our custom exceptions as-is
    if (
      e instanceof DocxNotFoundError ||
      e instanceof DocxReadError ||
      e instanceof DocxValidationError
    ) {
      throw e;
    }
    // Wrap unknown exceptions
    const message = e instanceof Error ? e.message : String(e);
    throw new DocxValidationError('Invalid DOCX content', message);
  }
}

// =============================================================================
// HTML Conversion
// =============================================================================

/**
 * Convert DOCX document to HTML.
 *
 * This is the main entry point for converting DOCX documents to HTML.
 * Accepts various input types and produces HTML output.
 *
 * @param source - Input document. Can be:
 *   - File path as string
 *   - ArrayBuffer content of DOCX file
 *   - Uint8Array content of DOCX file
 *   - Blob
 *   - Document model instance
 *   - null/undefined (returns empty HTML document)
 * @param config - Conversion configuration options
 * @param options - Additional conversion options (e.g., outputPath for file writing)
 * @returns Promise resolving to HTML string
 * @throws DocxNotFoundError if file path doesn't exist
 * @throws DocxReadError if file cannot be read
 * @throws DocxValidationError if file is not a valid DOCX
 *
 * @example
 * ```typescript
 * // From file path (Node.js)
 * const html = await docxToHtml('/path/to/document.docx');
 *
 * // From ArrayBuffer (browser)
 * const buffer = await file.arrayBuffer();
 * const html = await docxToHtml(buffer);
 *
 * // With configuration
 * const html = await docxToHtml(buffer, {
 *   title: 'My Document',
 *   styleMode: 'class',
 *   fragmentOnly: true,
 * });
 *
 * // With output file (Node.js only)
 * const html = await docxToHtml('/path/to/doc.docx', {}, { outputPath: '/path/to/output.html' });
 * ```
 */
export async function docxToHtml(
  source: DocxInput,
  config?: ConversionConfig,
  options?: ConversionOptions
): Promise<string> {
  const htmlConfig = toHtmlConfig(config);

  let result: string;

  // Handle null/undefined input
  if (source === null || source === undefined) {
    const converter = new HTMLConverter(htmlConfig);
    result = converter.convert(null);
  } else if (isDocumentModel(source)) {
    // Handle Document model input directly
    const converter = new HTMLConverter(htmlConfig);
    result = converter.convert(source);
  } else {
    // Parse DOCX file
    const [document, metadata] = await parseDocx(source as DocxSource);

    // Convert to HTML
    const converter = new HTMLConverter(htmlConfig, {
      styles: metadata.styles ?? undefined,
      numbering: metadata.numbering ?? undefined,
      relationships: metadata.relationships,
      imageData: metadata.imageData,
    });

    result = converter.convert(document);
  }

  // Write to file if outputPath is specified
  if (options?.outputPath) {
    await writeOutput(result, options.outputPath);
  }

  return result;
}

// =============================================================================
// Text Conversion
// =============================================================================

/**
 * Convert DOCX document to plain text.
 *
 * This is the main entry point for converting DOCX documents to plain text.
 * Accepts various input types and produces text output.
 *
 * @param source - Input document. Can be:
 *   - File path as string
 *   - ArrayBuffer content of DOCX file
 *   - Uint8Array content of DOCX file
 *   - Blob
 *   - Document model instance
 *   - null/undefined (returns empty string)
 * @param config - Conversion configuration options
 * @param options - Additional conversion options (e.g., outputPath for file writing)
 * @returns Promise resolving to plain text string
 * @throws DocxNotFoundError if file path doesn't exist
 * @throws DocxReadError if file cannot be read
 * @throws DocxValidationError if file is not a valid DOCX
 *
 * @example
 * ```typescript
 * // From file path (Node.js)
 * const text = await docxToText('/path/to/document.docx');
 *
 * // From ArrayBuffer (browser)
 * const buffer = await file.arrayBuffer();
 * const text = await docxToText(buffer);
 *
 * // With markdown formatting
 * const markdown = await docxToText(buffer, {
 *   textFormatting: 'markdown',
 * });
 *
 * // With ASCII table rendering
 * const text = await docxToText(buffer, {
 *   tableMode: 'ascii',
 * });
 *
 * // With output file (Node.js only)
 * const text = await docxToText('/path/to/doc.docx', {}, { outputPath: '/path/to/output.txt' });
 * ```
 */
export async function docxToText(
  source: DocxInput,
  config?: ConversionConfig,
  options?: ConversionOptions
): Promise<string> {
  const textConfig = toTextConfig(config);

  let result: string;

  // Handle null/undefined input
  if (source === null || source === undefined) {
    result = '';
  } else if (isDocumentModel(source)) {
    // Handle Document model input directly
    const converter = new TextConverter({ config: textConfig });
    result = converter.convert(source);
  } else {
    // Parse DOCX file
    const [document, metadata] = await parseDocx(source as DocxSource);

    // Convert to text
    const converter = new TextConverter({
      config: textConfig,
      styles: metadata.styles ?? undefined,
      numbering: metadata.numbering ?? undefined,
      hyperlinkUrls: metadata.relationships,
    });

    result = converter.convert(document);
  }

  // Write to file if outputPath is specified
  if (options?.outputPath) {
    await writeOutput(result, options.outputPath);
  }

  return result;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if running in Node.js environment.
 */
function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Write content to a file (Node.js only).
 *
 * @param content - Content to write
 * @param outputPath - Path to write to
 * @throws Error if running in browser environment
 */
async function writeOutput(content: string, outputPath: string): Promise<void> {
  if (!isNodeEnvironment()) {
    throw new Error(
      'File writing is only supported in Node.js environment. In the browser, use the returned string directly.'
    );
  }

  // Dynamic import of Node.js fs module for platform compatibility
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file: ${(error as Error).message}`);
  }
}

/**
 * Check if a value is a Document model.
 *
 * @param value - Value to check
 * @returns True if value is a Document model
 */
function isDocumentModel(value: unknown): value is Document {
  if (!value || typeof value !== 'object') {
    return false;
  }
  // Document has an optional body property
  // Check for characteristic structure that distinguishes it from raw data
  const obj = value as Record<string, unknown>;
  // Document doesn't have byteLength (ArrayBuffer) or length (Uint8Array)
  // and isn't a Blob
  if ('byteLength' in obj || 'length' in obj || value instanceof Blob) {
    return false;
  }
  // A Document should have a body (or be an empty document)
  return 'body' in obj || Object.keys(obj).length === 0;
}
