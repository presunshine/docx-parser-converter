/**
 * Parser for document body elements.
 *
 * Matches Python: parsers/document/body_parser.py
 */

import type { Body, BodyContentItem } from '../../models/document/document';
import { findChild, getLocalName } from '../utils';
import { parseParagraph } from './paragraph-parser';
import { parseSectionProperties } from './section-parser';
import { parseTable } from './table-parser';

/**
 * Parse <w:body> element.
 *
 * XML Example:
 *   <w:body>
 *     <w:p>...</w:p>
 *     <w:tbl>...</w:tbl>
 *     <w:p>...</w:p>
 *     <w:sectPr>...</w:sectPr>
 *   </w:body>
 *
 * @param element - The <w:body> element or null
 * @returns Body model or null if element is null
 */
export function parseBody(element: Element | null): Body | null {
  if (!element) {
    return null;
  }

  // Parse content (paragraphs, tables, etc.)
  const content: BodyContentItem[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType !== 1) {
      // Skip non-element nodes
      continue;
    }

    const childElement = child as Element;
    const localName = getLocalName(childElement);

    let item: BodyContentItem | null = null;

    if (localName === 'p') {
      item = parseParagraph(childElement);
    } else if (localName === 'tbl') {
      item = parseTable(childElement);
    } else if (localName === 'sectPr') {
      // Section properties are handled separately
      continue;
    } else {
      // Skip unrecognized elements (sdt, customXml, etc.)
      continue;
    }

    if (item !== null) {
      content.push(item);
    }
  }

  // Parse final section properties
  const sectPr = parseSectionProperties(findChild(element, 'sectPr'));

  return {
    content,
    sectPr: sectPr ?? null,
  };
}
