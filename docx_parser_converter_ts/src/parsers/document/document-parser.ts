/**
 * Parser for document elements.
 *
 * Matches Python: parsers/document/document_parser.py
 */

import type { Document, Body } from '../../models/document/document';
import { findChild } from '../utils';
import { parseBody } from './body-parser';

/**
 * Parse <w:document> element.
 *
 * XML Example:
 *   <w:document xmlns:w="...">
 *     <w:body>
 *       <w:p>...</w:p>
 *       <w:tbl>...</w:tbl>
 *       <w:sectPr>...</w:sectPr>
 *     </w:body>
 *   </w:document>
 *
 * @param element - The <w:document> element or null
 * @returns Document model or null if element is null
 */
export function parseDocument(element: Element | null): Document | null {
  if (!element) {
    return null;
  }

  // Parse body
  const bodyElem = findChild(element, 'body');
  let body = parseBody(bodyElem);

  if (body === null) {
    // Document must have a body
    body = {
      content: [],
      sectPr: null,
    } as Body;
  }

  return {
    body,
  };
}
