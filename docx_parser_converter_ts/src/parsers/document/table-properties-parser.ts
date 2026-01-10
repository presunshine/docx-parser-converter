/**
 * Table properties parser.
 *
 * Matches Python: parsers/document/table_properties_parser.py
 */

import type { TableProperties, TableLook, TableCellMargins } from '../../models/document/table';
import type { JustificationType, TableLayoutType } from '../../models/types';
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
 * Parse a boolean attribute value ("0" or "1").
 *
 * @param value - Attribute value string or null
 * @returns boolean or null
 */
function parseBoolAttribute(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }
  return value === '1';
}

/**
 * Parse table look element.
 *
 * @param element - XML element (<w:tblLook>)
 * @returns TableLook model or null
 */
export function parseTableLook(element: Element | null): TableLook | null {
  if (!element) {
    return null;
  }

  // val attribute exists in XML but not in our model - parsed but not included
  const _val = getAttribute(element, 'val');
  const firstRow = parseBoolAttribute(getAttribute(element, 'firstRow'));
  const lastRow = parseBoolAttribute(getAttribute(element, 'lastRow'));
  const firstColumn = parseBoolAttribute(getAttribute(element, 'firstColumn'));
  const lastColumn = parseBoolAttribute(getAttribute(element, 'lastColumn'));
  const noHBand = parseBoolAttribute(getAttribute(element, 'noHBand'));
  const noVBand = parseBoolAttribute(getAttribute(element, 'noVBand'));

  // Suppress unused variable warning
  void _val;

  return {
    firstRow: firstRow,
    lastRow: lastRow,
    firstColumn: firstColumn,
    lastColumn: lastColumn,
    noHBand: noHBand,
    noVBand: noVBand,
  };
}

/**
 * Parse table cell margins element.
 *
 * @param element - XML element (<w:tblCellMar>)
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
 * Parse table properties element.
 *
 * @param element - XML element (<w:tblPr>)
 * @returns TableProperties model or null
 */
export function parseTableProperties(element: Element | null): TableProperties | null {
  if (!element) {
    return null;
  }

  // Style reference
  const tblStyleElem = findChild(element, 'tblStyle');
  const tblStyle = tblStyleElem ? getAttribute(tblStyleElem, 'val') : null;

  // Position
  const tblpPrElem = findChild(element, 'tblpPr');
  const tblpPr = tblpPrElem ? {
    leftFromText: getIntAttribute(tblpPrElem, 'leftFromText'),
    rightFromText: getIntAttribute(tblpPrElem, 'rightFromText'),
    topFromText: getIntAttribute(tblpPrElem, 'topFromText'),
    bottomFromText: getIntAttribute(tblpPrElem, 'bottomFromText'),
    vertAnchor: getAttribute(tblpPrElem, 'vertAnchor'),
    horzAnchor: getAttribute(tblpPrElem, 'horzAnchor'),
    tblpXSpec: getAttribute(tblpPrElem, 'tblpXSpec'),
    tblpYSpec: getAttribute(tblpPrElem, 'tblpYSpec'),
    tblpX: getIntAttribute(tblpPrElem, 'tblpX'),
    tblpY: getIntAttribute(tblpPrElem, 'tblpY'),
  } : null;

  // Overlap
  const tblOverlapElem = findChild(element, 'tblOverlap');
  const tblOverlap = tblOverlapElem ? getAttribute(tblOverlapElem, 'val') : null;

  // BiDi
  const bidiVisual = parseToggle(findChild(element, 'bidiVisual'));

  // Width
  const tblW = parseWidth(findChild(element, 'tblW'));

  // Alignment
  const jcElem = findChild(element, 'jc');
  const jc = jcElem ? getAttribute(jcElem, 'val') : null;

  // Cell spacing
  const tblCellSpacing = parseWidth(findChild(element, 'tblCellSpacing'));

  // Indent
  const tblInd = parseWidth(findChild(element, 'tblInd'));

  // Borders
  const tblBorders = parseTableBorders(findChild(element, 'tblBorders'));

  // Shading
  const shd = parseShading(findChild(element, 'shd'));

  // Layout
  const tblLayoutElem = findChild(element, 'tblLayout');
  const tblLayout = tblLayoutElem ? getAttribute(tblLayoutElem, 'type') : null;

  // Cell margins
  const tblCellMar = parseTableCellMargins(findChild(element, 'tblCellMar'));

  // Look
  const tblLook = parseTableLook(findChild(element, 'tblLook'));

  // Caption
  const tblCaptionElem = findChild(element, 'tblCaption');
  const tblCaption = tblCaptionElem ? getAttribute(tblCaptionElem, 'val') : null;

  // Description
  const tblDescriptionElem = findChild(element, 'tblDescription');
  const tblDescription = tblDescriptionElem ? getAttribute(tblDescriptionElem, 'val') : null;

  // Cast - some properties may not be in the interface
  return {
    tblStyle: tblStyle ?? null,
    tblpPr: tblpPr ?? null,
    tblOverlap: tblOverlap ?? null,
    bidiVisual: bidiVisual ?? null,
    tblW: tblW ?? null,
    jc: (jc as JustificationType) ?? null,
    tblCellSpacing: tblCellSpacing ?? null,
    tblInd: tblInd ?? null,
    tblBorders: tblBorders ?? null,
    shd: shd ?? null,
    tblLayout: (tblLayout as TableLayoutType) ?? null,
    tblCellMar: tblCellMar ?? null,
    tblLook: tblLook ?? null,
    tblCaption: tblCaption ?? null,
    tblDescription: tblDescription ?? null,
  } as unknown as TableProperties;
}
