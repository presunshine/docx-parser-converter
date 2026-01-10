/**
 * Parser for hyperlink and bookmark elements.
 *
 * Matches Python: parsers/document/hyperlink_parser.py
 */

import { REL_NS_URI } from '../../core/constants';
import type { Hyperlink } from '../../models/document/hyperlink';
import type { BookmarkStart, BookmarkEnd } from '../../models/document/paragraph';
import type { Run } from '../../models/document/run';
import { getAttribute, findAllChildren } from '../utils';
import { parseRun } from './run-parser';

/**
 * Parse <w:hyperlink> element.
 *
 * XML Example:
 *   <w:hyperlink r:id="rId1" w:tooltip="Click here">
 *     <w:r>
 *       <w:t>Link text</w:t>
 *     </w:r>
 *   </w:hyperlink>
 *
 * @param element - The <w:hyperlink> element or null
 * @returns Hyperlink model or null if element is null
 */
export function parseHyperlink(element: Element | null): Hyperlink | null {
  if (!element) {
    return null;
  }

  // r:id uses the relationship namespace
  const rId = element.getAttributeNS(REL_NS_URI, 'id') || null;

  // Parse all runs within the hyperlink
  const content: Run[] = [];
  const runElements = findAllChildren(element, 'r');
  for (const runElem of runElements) {
    const run = parseRun(runElem);
    if (run !== null) {
      content.push(run);
    }
  }

  return {
    type: 'hyperlink',
    rId,
    anchor: getAttribute(element, 'anchor') ?? null,
    tooltip: getAttribute(element, 'tooltip') ?? null,
    content,
  };
}

/**
 * Parse <w:bookmarkStart> element.
 *
 * XML Example:
 *   <w:bookmarkStart w:id="0" w:name="MyBookmark"/>
 *
 * @param element - The <w:bookmarkStart> element or null
 * @returns BookmarkStart model or null if element is null
 */
export function parseBookmarkStart(element: Element | null): BookmarkStart | null {
  if (!element) {
    return null;
  }

  return {
    type: 'bookmarkStart',
    id: getAttribute(element, 'id') ?? null,
    name: getAttribute(element, 'name') ?? null,
  };
}

/**
 * Parse <w:bookmarkEnd> element.
 *
 * XML Example:
 *   <w:bookmarkEnd w:id="0"/>
 *
 * @param element - The <w:bookmarkEnd> element or null
 * @returns BookmarkEnd model or null if element is null
 */
export function parseBookmarkEnd(element: Element | null): BookmarkEnd | null {
  if (!element) {
    return null;
  }

  return {
    type: 'bookmarkEnd',
    id: getAttribute(element, 'id') ?? null,
  };
}
