/**
 * Border parser.
 *
 * Matches Python: parsers/common/border_parser.py
 */

import type { Border, ParagraphBorders, TableBorders } from '../../models/common/border';
import type { BorderStyleType, ThemeColorType } from '../../models/types';
import { getAttribute, getIntAttribute, getBoolAttribute, findChild } from '../utils';

/**
 * Parse a single border element.
 *
 * @param element - XML element (<w:top>, <w:left>, etc.)
 * @returns Border model or null
 */
export function parseBorder(element: Element | null): Border | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const sz = getIntAttribute(element, 'sz');
  const space = getIntAttribute(element, 'space');
  const color = getAttribute(element, 'color');
  const themeColor = getAttribute(element, 'themeColor');
  const themeTint = getAttribute(element, 'themeTint');
  const themeShade = getAttribute(element, 'themeShade');
  const frame = getBoolAttribute(element, 'frame');
  const shadow = getBoolAttribute(element, 'shadow');

  return {
    val: (val ?? null) as BorderStyleType | null,
    sz: sz ?? null,
    space: space ?? null,
    color: color ?? null,
    themeColor: (themeColor ?? null) as ThemeColorType | null,
    themeTint: themeTint ?? null,
    themeShade: themeShade ?? null,
    frame: frame ?? null,
    shadow: shadow ?? null,
  };
}

/**
 * Parse paragraph borders element.
 *
 * @param element - XML element (<w:pBdr>)
 * @returns ParagraphBorders model or null
 */
export function parseParagraphBorders(element: Element | null): ParagraphBorders | null {
  if (!element) {
    return null;
  }

  return {
    top: parseBorder(findChild(element, 'top')),
    left: parseBorder(findChild(element, 'left')),
    bottom: parseBorder(findChild(element, 'bottom')),
    right: parseBorder(findChild(element, 'right')),
    between: parseBorder(findChild(element, 'between')),
    bar: parseBorder(findChild(element, 'bar')),
  };
}

/**
 * Parse table borders element.
 *
 * @param element - XML element (<w:tblBorders> or <w:tcBorders>)
 * @returns TableBorders model or null
 */
export function parseTableBorders(element: Element | null): TableBorders | null {
  if (!element) {
    return null;
  }

  return {
    top: parseBorder(findChild(element, 'top')),
    left: parseBorder(findChild(element, 'left')),
    bottom: parseBorder(findChild(element, 'bottom')),
    right: parseBorder(findChild(element, 'right')),
    insideH: parseBorder(findChild(element, 'insideH')),
    insideV: parseBorder(findChild(element, 'insideV')),
    tl2br: parseBorder(findChild(element, 'tl2br')),
    tr2bl: parseBorder(findChild(element, 'tr2bl')),
  };
}
