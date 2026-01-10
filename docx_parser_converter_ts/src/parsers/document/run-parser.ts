/**
 * Run parser.
 *
 * Matches Python: parsers/document/run_parser.py
 */

import type { Run } from '../../models/document/run';
import type { RunContentItem } from '../../models/document/run-content';
import { parseRunProperties } from './run-properties-parser';
import { parseRunContentItem } from './run-content-parser';
import { findChild, iterChildren } from '../utils';

/**
 * Parse <w:r> element.
 *
 * @param element - The <w:r> element or null
 * @returns Run model or null if element is null
 */
export function parseRun(element: Element | null): Run | null {
  if (element === null) {
    return null;
  }

  // Parse run properties
  const rPr = parseRunProperties(findChild(element, 'rPr'));

  // Parse run content
  const content: RunContentItem[] = [];
  for (const child of iterChildren(element)) {
    const localName = child.localName || child.tagName.split(':').pop() || '';

    // Skip properties element
    if (localName === 'rPr') {
      continue;
    }

    const item = parseRunContentItem(child);
    if (item !== null) {
      content.push(item);
    }
  }

  return {
    rPr: rPr ?? null,
    content,
  };
}
