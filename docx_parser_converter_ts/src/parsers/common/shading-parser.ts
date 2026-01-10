/**
 * Shading parser.
 *
 * Matches Python: parsers/common/shading_parser.py
 */

import type { Shading } from '../../models/common/shading';
import type { ShadingPatternType, ThemeColorType } from '../../models/types';
import { getAttribute } from '../utils';

/**
 * Parse a shading element.
 *
 * @param element - XML element (<w:shd>)
 * @returns Shading model or null
 */
export function parseShading(element: Element | null): Shading | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const color = getAttribute(element, 'color');
  const fill = getAttribute(element, 'fill');
  const themeColor = getAttribute(element, 'themeColor');
  const themeFill = getAttribute(element, 'themeFill');
  const themeTint = getAttribute(element, 'themeTint');
  const themeShade = getAttribute(element, 'themeShade');
  const themeFillTint = getAttribute(element, 'themeFillTint');
  const themeFillShade = getAttribute(element, 'themeFillShade');

  return {
    val: (val ?? null) as ShadingPatternType | null,
    color: color ?? null,
    fill: fill ?? null,
    themeColor: (themeColor ?? null) as ThemeColorType | null,
    themeFill: (themeFill ?? null) as ThemeColorType | null,
    themeTint: themeTint ?? null,
    themeShade: themeShade ?? null,
    themeFillTint: themeFillTint ?? null,
    themeFillShade: themeFillShade ?? null,
  };
}
