/**
 * Paragraph parser.
 *
 * Matches Python: parsers/document/paragraph_parser.py
 */

import type { Paragraph, BookmarkStart, BookmarkEnd, HyperlinkRef } from '../../models/document/paragraph';
import type { Run } from '../../models/document/run';
import { parseParagraphProperties } from './paragraph-properties-parser';
import { parseRun } from './run-parser';
import { findChild, getAttribute, iterChildren, getLocalName } from '../utils';

/** Union type for paragraph content items */
type ParagraphContentItem = Run | HyperlinkRef | BookmarkStart | BookmarkEnd;

/**
 * Parse <w:hyperlink> element.
 *
 * @param element - The <w:hyperlink> element or null
 * @returns Hyperlink content item or null
 */
export function parseHyperlink(element: Element | null): ParagraphContentItem | null {
  if (element === null) {
    return null;
  }

  const rId = getAttribute(element, 'id');
  const anchor = getAttribute(element, 'anchor');
  const tooltip = getAttribute(element, 'tooltip');

  // Parse content (runs) inside the hyperlink
  const content: ParagraphContentItem[] = [];
  for (const child of iterChildren(element)) {
    const localName = getLocalName(child);
    if (localName === 'r') {
      const run = parseRun(child);
      if (run !== null) {
        content.push(run as unknown as ParagraphContentItem);
      }
    }
  }

  // Cast to ParagraphContentItem - HyperlinkRef interface is a stub
  return {
    type: 'hyperlink',
    rId: rId ?? null,
    anchor: anchor ?? null,
    tooltip: tooltip ?? null,
    content,
  } as unknown as ParagraphContentItem;
}

/**
 * Parse <w:bookmarkStart> element.
 *
 * @param element - The <w:bookmarkStart> element or null
 * @returns Bookmark start content item or null
 */
export function parseBookmarkStart(element: Element | null): ParagraphContentItem | null {
  if (element === null) {
    return null;
  }

  const id = getAttribute(element, 'id');
  const name = getAttribute(element, 'name');

  return {
    type: 'bookmarkStart',
    id: id ?? null,
    name: name ?? null,
  };
}

/**
 * Parse <w:bookmarkEnd> element.
 *
 * @param element - The <w:bookmarkEnd> element or null
 * @returns Bookmark end content item or null
 */
export function parseBookmarkEnd(element: Element | null): ParagraphContentItem | null {
  if (element === null) {
    return null;
  }

  const id = getAttribute(element, 'id');

  return {
    type: 'bookmarkEnd',
    id: id ?? null,
  };
}

/**
 * Parse paragraph content item.
 *
 * @param element - The content element
 * @returns Paragraph content item or null
 */
function parseParagraphContentItem(element: Element): ParagraphContentItem | null {
  const localName = getLocalName(element);

  switch (localName) {
    case 'r':
      return parseRun(element) as unknown as ParagraphContentItem;
    case 'hyperlink':
      return parseHyperlink(element);
    case 'bookmarkStart':
      return parseBookmarkStart(element);
    case 'bookmarkEnd':
      return parseBookmarkEnd(element);
    default:
      return null;
  }
}

/**
 * Parse <w:p> element.
 *
 * @param element - The <w:p> element or null
 * @returns Paragraph model or null if element is null
 */
export function parseParagraph(element: Element | null): Paragraph | null {
  if (element === null) {
    return null;
  }

  // Parse paragraph properties
  const pPr = parseParagraphProperties(findChild(element, 'pPr'));

  // Parse paragraph content
  const content: ParagraphContentItem[] = [];
  for (const child of iterChildren(element)) {
    const localName = getLocalName(child);

    // Skip properties element
    if (localName === 'pPr') {
      continue;
    }

    const item = parseParagraphContentItem(child);
    if (item !== null) {
      content.push(item);
    }
  }

  return {
    pPr: pPr ?? null,
    content,
  };
}
