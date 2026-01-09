/**
 * Test utilities for the DOCX parser/converter library.
 *
 * Provides helper functions for creating XML elements, comparing outputs,
 * and other common testing operations.
 */

import { DOMParser } from '@xmldom/xmldom';

// XML Namespaces used in DOCX files
export const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
export const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
export const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
export const PIC_NS = 'http://schemas.openxmlformats.org/drawingml/2006/picture';

/**
 * Standard namespace declarations for DOCX XML snippets.
 */
export const NSMAP = `
  xmlns:w="${WORD_NS}"
  xmlns:r="${REL_NS}"
  xmlns:a="${DRAWING_NS}"
  xmlns:wp="${WP_NS}"
  xmlns:pic="${PIC_NS}"
`.trim();

/**
 * Create an XML element from a string snippet.
 * Automatically wraps the snippet with namespace declarations.
 *
 * @param xml - XML snippet string (e.g., '<w:p><w:r><w:t>Hello</w:t></w:r></w:p>')
 * @returns Parsed DOM Element
 */
export function makeElement(xml: string): Element {
  // Wrap with a root element that has all namespaces
  const wrappedXml = `<root ${NSMAP}>${xml}</root>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(wrappedXml, 'text/xml');

  // Get the first child element (skip whitespace text nodes)
  const root = doc.documentElement;
  for (let i = 0; i < root.childNodes.length; i++) {
    const node = root.childNodes[i];
    if (node.nodeType === 1) {
      // Element node
      return node as Element;
    }
  }

  throw new Error('No element found in XML snippet');
}

/**
 * Create a full XML document from a string.
 *
 * @param xml - Full XML document string
 * @returns Parsed DOM Document
 */
export function parseXml(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

/**
 * Normalize whitespace in a string for comparison.
 * - Trims leading/trailing whitespace
 * - Normalizes line endings to \n
 * - Removes trailing whitespace from lines
 *
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeWhitespace(str: string): string {
  return str
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing whitespace from each line
    .join('\n')
    .trim(); // Trim overall
}

/**
 * Normalize HTML for comparison.
 * - Normalizes whitespace
 * - Removes extra blank lines
 *
 * @param html - HTML string to normalize
 * @returns Normalized HTML string
 */
export function normalizeHtml(html: string): string {
  return normalizeWhitespace(html).replace(/\n{3,}/g, '\n\n'); // Collapse multiple blank lines
}

/**
 * Normalize text output for comparison.
 *
 * @param text - Text string to normalize
 * @returns Normalized text string
 */
export function normalizeText(text: string): string {
  return normalizeWhitespace(text);
}

/**
 * Get attribute value from an element, with namespace support.
 *
 * @param element - DOM Element
 * @param name - Attribute name (can be prefixed like 'w:val')
 * @returns Attribute value or null
 */
export function getAttr(element: Element, name: string): string | null {
  // Try direct attribute first
  if (element.hasAttribute(name)) {
    return element.getAttribute(name);
  }

  // Try with namespace prefix resolution
  const [prefix, localName] = name.includes(':') ? name.split(':') : [null, name];

  if (prefix === 'w') {
    return element.getAttributeNS(WORD_NS, localName);
  }
  if (prefix === 'r') {
    return element.getAttributeNS(REL_NS, localName);
  }

  return null;
}

/**
 * Find child element by tag name with namespace support.
 *
 * @param parent - Parent element
 * @param tagName - Tag name (can be prefixed like 'w:pPr')
 * @returns Child element or null
 */
export function findChild(parent: Element, tagName: string): Element | null {
  const [prefix, localName] = tagName.includes(':') ? tagName.split(':') : [null, tagName];

  let ns: string | null = null;
  if (prefix === 'w') ns = WORD_NS;
  else if (prefix === 'r') ns = REL_NS;
  else if (prefix === 'a') ns = DRAWING_NS;
  else if (prefix === 'wp') ns = WP_NS;
  else if (prefix === 'pic') ns = PIC_NS;

  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      const el = node as Element;
      if (ns) {
        if (el.localName === localName && el.namespaceURI === ns) {
          return el;
        }
      } else if (el.localName === localName || el.tagName === tagName) {
        return el;
      }
    }
  }

  return null;
}

/**
 * Find all child elements by tag name with namespace support.
 *
 * @param parent - Parent element
 * @param tagName - Tag name (can be prefixed like 'w:r')
 * @returns Array of matching child elements
 */
export function findChildren(parent: Element, tagName: string): Element[] {
  const [prefix, localName] = tagName.includes(':') ? tagName.split(':') : [null, tagName];

  let ns: string | null = null;
  if (prefix === 'w') ns = WORD_NS;
  else if (prefix === 'r') ns = REL_NS;
  else if (prefix === 'a') ns = DRAWING_NS;
  else if (prefix === 'wp') ns = WP_NS;
  else if (prefix === 'pic') ns = PIC_NS;

  const results: Element[] = [];

  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      const el = node as Element;
      if (ns) {
        if (el.localName === localName && el.namespaceURI === ns) {
          results.push(el);
        }
      } else if (el.localName === localName || el.tagName === tagName) {
        results.push(el);
      }
    }
  }

  return results;
}

/**
 * Get text content from an element.
 *
 * @param element - DOM Element
 * @returns Text content or empty string
 */
export function getText(element: Element): string {
  return element.textContent || '';
}
