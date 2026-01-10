/**
 * XML extraction utilities for DOCX files.
 *
 * Matches Python: core/xml_extractor.py
 */

import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

import {
  DOCUMENT_XML_PATH,
  STYLES_XML_PATH,
  NUMBERING_XML_PATH,
  RELS_XML_PATH,
} from './constants';
import { XmlParseError } from './exceptions';

/**
 * Extract and parse XML from a DOCX part.
 *
 * @param zip - JSZip instance
 * @param partName - Name of the part to extract
 * @returns Parsed XML Document element
 * @throws KeyError if part doesn't exist
 * @throws XmlParseError if XML parsing fails
 */
export async function extractXml(zip: JSZip, partName: string): Promise<Element> {
  const file = zip.file(partName);
  if (!file) {
    throw new Error(`Part not found: ${partName}`);
  }

  const content = await file.async('string');

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    const element = doc.documentElement;
    if (!element) {
      throw new Error('No document element');
    }
    // Cast xmldom Element to standard Element interface
    return element as unknown as Element;
  } catch (e) {
    throw new XmlParseError(partName, e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Extract and parse XML from a DOCX part, returning null if not found.
 *
 * @param zip - JSZip instance
 * @param partName - Name of the part to extract
 * @returns Parsed XML element or null
 */
export async function extractXmlSafe(zip: JSZip, partName: string): Promise<Element | null> {
  try {
    return await extractXml(zip, partName);
  } catch {
    return null;
  }
}

/**
 * Extract the document.xml content.
 *
 * @param zip - JSZip instance
 * @returns Document element
 */
export async function extractDocumentXml(zip: JSZip): Promise<Element> {
  return extractXml(zip, DOCUMENT_XML_PATH);
}

/**
 * Extract the styles.xml content if present.
 *
 * @param zip - JSZip instance
 * @returns Styles element or null
 */
export async function extractStylesXml(zip: JSZip): Promise<Element | null> {
  return extractXmlSafe(zip, STYLES_XML_PATH);
}

/**
 * Extract the numbering.xml content if present.
 *
 * @param zip - JSZip instance
 * @returns Numbering element or null
 */
export async function extractNumberingXml(zip: JSZip): Promise<Element | null> {
  return extractXmlSafe(zip, NUMBERING_XML_PATH);
}

/** Relationship info */
export interface Relationship {
  type: string;
  target: string;
  targetMode?: string;
}

/**
 * Extract document relationships.
 *
 * @param zip - JSZip instance
 * @returns Object mapping rId to relationship info
 */
export async function extractRelationships(zip: JSZip): Promise<Record<string, Relationship>> {
  const rels: Record<string, Relationship> = {};

  const element = await extractXmlSafe(zip, RELS_XML_PATH);
  if (!element) {
    return rels;
  }

  // Find all Relationship elements
  const relationships = element.getElementsByTagName('Relationship');
  for (let i = 0; i < relationships.length; i++) {
    const rel = relationships[i];
    const id = rel.getAttribute('Id');
    const type = rel.getAttribute('Type');
    const target = rel.getAttribute('Target');
    const targetMode = rel.getAttribute('TargetMode');

    if (id && type && target) {
      rels[id] = {
        type,
        target,
        targetMode: targetMode || undefined,
      };
    }
  }

  return rels;
}

/** Hyperlink relationship type */
const HYPERLINK_REL_TYPE =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';

/**
 * Extract external hyperlinks from relationships.
 *
 * @param zip - JSZip instance
 * @returns Object mapping rId to URL
 */
export async function extractExternalHyperlinks(zip: JSZip): Promise<Record<string, string>> {
  const links: Record<string, string> = {};
  const rels = await extractRelationships(zip);

  for (const [id, rel] of Object.entries(rels)) {
    if (rel.type === HYPERLINK_REL_TYPE && rel.targetMode === 'External') {
      links[id] = rel.target;
    }
  }

  return links;
}

/**
 * Get the body element from a document element.
 *
 * @param doc - Document element
 * @returns Body element or null
 */
export function getBodyElement(doc: Element): Element | null {
  // Find w:body child
  const children = doc.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) { // Element node
      const element = child as Element;
      if (element.tagName === 'w:body' || element.localName === 'body') {
        return element;
      }
    }
  }
  return null;
}

/**
 * Iterate over paragraph elements in a body.
 *
 * @param body - Body element
 * @returns Array of paragraph elements
 */
export function iterParagraphs(body: Element): Element[] {
  const paragraphs: Element[] = [];
  const children = body.childNodes;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) { // Element node
      const element = child as Element;
      if (element.tagName === 'w:p' || element.localName === 'p') {
        paragraphs.push(element);
      }
    }
  }

  return paragraphs;
}

/**
 * Iterate over table elements in a body.
 *
 * @param body - Body element
 * @returns Array of table elements
 */
export function iterTables(body: Element): Element[] {
  const tables: Element[] = [];
  const children = body.childNodes;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) { // Element node
      const element = child as Element;
      if (element.tagName === 'w:tbl' || element.localName === 'tbl') {
        tables.push(element);
      }
    }
  }

  return tables;
}

/**
 * Read a media file from the DOCX archive.
 *
 * @param zip - JSZip instance
 * @param path - Path to media file (e.g., "word/media/image1.png")
 * @returns File contents as Uint8Array or null
 */
export async function readMediaFile(zip: JSZip, path: string): Promise<Uint8Array | null> {
  const file = zip.file(path);
  if (!file) {
    return null;
  }
  return file.async('uint8array');
}

/**
 * Get the MIME content type for a media file.
 *
 * @param filename - Filename or path
 * @returns MIME type string
 */
export function getMediaContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const contentTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    emf: 'image/x-emf',
    wmf: 'image/x-wmf',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Extract image relationships from the document relationships.
 *
 * @param zip - JSZip instance
 * @returns Object mapping rId to image path
 */
export async function extractImageRelationships(zip: JSZip): Promise<Record<string, string>> {
  const images: Record<string, string> = {};
  const rels = await extractRelationships(zip);

  const imageRelType =
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

  for (const [id, rel] of Object.entries(rels)) {
    if (rel.type === imageRelType) {
      // Target is relative to word/ directory
      const imagePath = rel.target.startsWith('/')
        ? rel.target.slice(1)
        : `word/${rel.target}`;
      images[id] = imagePath;
    }
  }

  return images;
}
