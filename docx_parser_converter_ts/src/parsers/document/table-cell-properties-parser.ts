/**
 * Table cell properties parser.
 *
 * Matches Python: parsers/document/table_cell_properties_parser.py
 */

import type { TableCellProperties, TableCellMargins } from '../../models/document/table';
import type { VMergeType, TextDirectionType, VAlignType } from '../../models/types';
import { parseTableBorders } from '../common/border-parser';
import { parseShading } from '../common/shading-parser';
import { parseWidth } from '../common/width-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  parseToggle,
} from '../utils';

/**
 * Parse table cell margins element.
 *
 * @param element - XML element (<w:tcMar>)
 * @returns TableCellMargins model or null
 */
export function parseTableCellMargins(element: Element | null): TableCellMargins | null {
  if (!element) {
    return null;
  }

  const top = parseWidth(findChild(element, 'top'));
  const left = parseWidth(findChild(element, 'left')) || parseWidth(findChild(element, 'start'));
  const bottom = parseWidth(findChild(element, 'bottom'));
  const right = parseWidth(findChild(element, 'right')) || parseWidth(findChild(element, 'end'));

  return {
    top: top ?? null,
    left: left ?? null,
    bottom: bottom ?? null,
    right: right ?? null,
  };
}

/**
 * Parse table cell properties element.
 *
 * @param element - XML element (<w:tcPr>)
 * @returns TableCellProperties model or null
 */
export function parseTableCellProperties(element: Element | null): TableCellProperties | null {
  if (!element) {
    return null;
  }

  // Conditional formatting
  const cnfStyleElem = findChild(element, 'cnfStyle');
  const cnfStyle = cnfStyleElem ? getAttribute(cnfStyleElem, 'val') : null;

  // Width
  const tcW = parseWidth(findChild(element, 'tcW'));

  // Grid span
  const gridSpanElem = findChild(element, 'gridSpan');
  const gridSpan = gridSpanElem ? getIntAttribute(gridSpanElem, 'val') : null;

  // Horizontal merge
  const hMergeElem = findChild(element, 'hMerge');
  const hMerge = hMergeElem ? getAttribute(hMergeElem, 'val') : null;

  // Vertical merge
  const vMergeElem = findChild(element, 'vMerge');
  const vMerge = vMergeElem ? (getAttribute(vMergeElem, 'val') || 'continue') : null;

  // Borders
  const tcBorders = parseTableBorders(findChild(element, 'tcBorders'));

  // Shading
  const shd = parseShading(findChild(element, 'shd'));

  // No wrap
  const noWrap = parseToggle(findChild(element, 'noWrap'));

  // Margins
  const tcMar = parseTableCellMargins(findChild(element, 'tcMar'));

  // Text direction
  const textDirectionElem = findChild(element, 'textDirection');
  const textDirection = textDirectionElem ? getAttribute(textDirectionElem, 'val') : null;

  // Fit text
  const tcFitText = parseToggle(findChild(element, 'tcFitText'));

  // Vertical alignment
  const vAlignElem = findChild(element, 'vAlign');
  const vAlign = vAlignElem ? getAttribute(vAlignElem, 'val') : null;

  // Hide mark
  const hideMark = parseToggle(findChild(element, 'hideMark'));

  // Headers
  const headers = findChild(element, 'headers') !== null;

  // Cast - some properties may not be in the interface
  return {
    cnfStyle: cnfStyle ?? null,
    tcW: tcW ?? null,
    gridSpan: gridSpan ?? null,
    hMerge: hMerge ?? null,
    vMerge: (vMerge as VMergeType) ?? null,
    tcBorders: tcBorders ?? null,
    shd: shd ?? null,
    noWrap: noWrap ?? null,
    tcMar: tcMar ?? null,
    textDirection: (textDirection as TextDirectionType) ?? null,
    tcFitText: tcFitText ?? null,
    vAlign: (vAlign as VAlignType) ?? null,
    hideMark: hideMark ?? null,
    headers: headers ? [] : null,
  } as unknown as TableCellProperties;
}
