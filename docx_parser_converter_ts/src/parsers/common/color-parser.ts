/**
 * Color parser.
 *
 * Matches Python: parsers/common/color_parser.py
 */

import type { Color } from '../../models/common/color';
import type { ThemeColorType } from '../../models/types';
import { getAttribute } from '../utils';

/**
 * Parse a color element.
 *
 * @param element - XML element (<w:color>)
 * @returns Color model or null
 */
export function parseColor(element: Element | null): Color | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const themeColor = getAttribute(element, 'themeColor');
  const themeTint = getAttribute(element, 'themeTint');
  const themeShade = getAttribute(element, 'themeShade');

  // Return null if no attributes present
  if (!val && !themeColor) {
    return null;
  }

  return {
    val: val ?? null,
    themeColor: (themeColor ?? null) as ThemeColorType | null,
    themeTint: themeTint ?? null,
    themeShade: themeShade ?? null,
  };
}
