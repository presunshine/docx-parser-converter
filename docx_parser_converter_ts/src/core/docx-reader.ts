/**
 * DOCX file reading utilities.
 *
 * Matches Python: core/docx_reader.py
 */

import JSZip from 'jszip';

import {
  DocxNotFoundError,
  DocxReadError,
  DocxEncryptedError,
  DocxMissingPartError,
} from './exceptions';
import { DOCUMENT_XML_PATH, CONTENT_TYPES_PATH } from './constants';

/** Source types that can be opened as DOCX */
export type DocxSource = string | ArrayBuffer | Uint8Array | Blob;

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
 * Read a file from disk (Node.js only).
 * Uses dynamic import to avoid bundling fs in browser builds.
 */
async function readFileFromPath(filePath: string): Promise<Uint8Array> {
  if (!isNodeEnvironment()) {
    throw new DocxReadError(
      'File path input is only supported in Node.js. In the browser, use ArrayBuffer, Uint8Array, or Blob.'
    );
  }

  try {
    // Dynamic import to avoid bundling fs in browser
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      throw new DocxNotFoundError(filePath);
    }
    return fs.readFileSync(filePath);
  } catch (e) {
    if (e instanceof DocxNotFoundError) {
      throw e;
    }
    throw new DocxNotFoundError(filePath);
  }
}

/**
 * Open a DOCX file from various sources.
 *
 * @param source - Path string (Node.js only), ArrayBuffer, Uint8Array, or Blob
 * @returns JSZip instance
 * @throws DocxNotFoundError if file path doesn't exist or path used in browser
 * @throws DocxReadError if content is invalid
 */
export async function openDocx(source: DocxSource): Promise<JSZip> {
  let data: ArrayBuffer | Uint8Array | Blob;

  // Handle string path (Node.js only)
  if (typeof source === 'string') {
    data = await readFileFromPath(source);
  } else {
    data = source;
  }

  // Check for empty data
  if (data instanceof Uint8Array && data.length === 0) {
    throw new DocxReadError('Empty bytes provided');
  }
  if (data instanceof ArrayBuffer && data.byteLength === 0) {
    throw new DocxReadError('Empty bytes provided');
  }

  // Convert Blob to ArrayBuffer for Node.js compatibility
  let zipData: ArrayBuffer | Uint8Array;
  if (data instanceof Blob) {
    zipData = await data.arrayBuffer();
  } else {
    zipData = data;
  }

  // Try to load as ZIP
  try {
    const zip = await JSZip.loadAsync(zipData);
    return zip;
  } catch (e) {
    throw new DocxReadError('Invalid ZIP file', e instanceof Error ? e : null);
  }
}

/**
 * Validate a DOCX ZIP archive.
 *
 * @param zip - JSZip instance to validate
 * @throws DocxMissingPartError if required parts are missing
 * @throws DocxEncryptedError if DOCX is encrypted
 */
export async function validateDocx(zip: JSZip): Promise<void> {
  // Check for encryption marker
  if (zip.file('EncryptedPackage')) {
    throw new DocxEncryptedError();
  }

  // Check for required parts
  if (!zip.file(CONTENT_TYPES_PATH)) {
    throw new DocxMissingPartError(CONTENT_TYPES_PATH);
  }

  if (!zip.file(DOCUMENT_XML_PATH)) {
    throw new DocxMissingPartError(DOCUMENT_XML_PATH);
  }
}

/**
 * Check if a source is a valid DOCX file.
 *
 * @param source - Source to check
 * @returns true if valid DOCX, false otherwise
 */
export async function isValidDocx(source: DocxSource): Promise<boolean> {
  try {
    const zip = await openDocx(source);
    await validateDocx(zip);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all parts in a DOCX archive.
 *
 * @param zip - JSZip instance
 * @returns Array of part names
 */
export function listDocxParts(zip: JSZip): string[] {
  return Object.keys(zip.files);
}

/**
 * Check if a DOCX archive contains a specific part.
 *
 * @param zip - JSZip instance
 * @param partName - Name of the part to check
 * @returns true if part exists
 */
export function hasPart(zip: JSZip, partName: string): boolean {
  return zip.file(partName) !== null;
}
