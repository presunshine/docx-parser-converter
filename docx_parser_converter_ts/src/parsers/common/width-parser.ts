/**
 * Width parser.
 *
 * Matches Python: parsers/common/width_parser.py
 */

import type { Width } from '../../models/common/width';
import type { WidthType } from '../../models/types';
import { getAttribute, getIntAttribute } from '../utils';

/**
 * Parse a width element.
 *
 * @param element - XML element (<w:tcW>, <w:tblW>, etc.)
 * @returns Width model or null
 */
export function parseWidth(element: Element | null): Width | null {
  if (!element) {
    return null;
  }

  const w = getIntAttribute(element, 'w');
  const type = getAttribute(element, 'type');

  return {
    w: w ?? null,
    type: (type ?? null) as WidthType | null,
  };
}
