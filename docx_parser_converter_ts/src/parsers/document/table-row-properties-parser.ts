/**
 * Table row properties parser.
 *
 * Matches Python: parsers/document/table_row_properties_parser.py
 */

import type { TableRowProperties, TableRowHeight } from '../../models/document/table';
import type { HeightRuleType, JustificationType } from '../../models/types';
import { parseWidth } from '../common/width-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  parseToggle,
} from '../utils';

/**
 * Parse table row height element.
 *
 * @param element - XML element (<w:trHeight>)
 * @returns TableRowHeight model or null
 */
export function parseTableRowHeight(element: Element | null): TableRowHeight | null {
  if (!element) {
    return null;
  }

  const val = getIntAttribute(element, 'val');
  const hRule = getAttribute(element, 'hRule');

  return {
    val: val ?? null,
    hRule: (hRule as HeightRuleType) ?? null,
  };
}

/**
 * Parse table row properties element.
 *
 * @param element - XML element (<w:trPr>)
 * @returns TableRowProperties model or null
 */
export function parseTableRowProperties(element: Element | null): TableRowProperties | null {
  if (!element) {
    return null;
  }

  // Conditional formatting
  const cnfStyleElem = findChild(element, 'cnfStyle');
  const cnfStyle = cnfStyleElem ? getAttribute(cnfStyleElem, 'val') : null;

  // Div ID
  const divIdElem = findChild(element, 'divId');
  const divId = divIdElem ? getIntAttribute(divIdElem, 'val') : null;

  // Grid before
  const gridBeforeElem = findChild(element, 'gridBefore');
  const gridBefore = gridBeforeElem ? getIntAttribute(gridBeforeElem, 'val') : null;

  // Grid after
  const gridAfterElem = findChild(element, 'gridAfter');
  const gridAfter = gridAfterElem ? getIntAttribute(gridAfterElem, 'val') : null;

  // Width before
  const wBefore = parseWidth(findChild(element, 'wBefore'));

  // Width after
  const wAfter = parseWidth(findChild(element, 'wAfter'));

  // Can't split
  const cantSplit = parseToggle(findChild(element, 'cantSplit'));

  // Height
  const trHeight = parseTableRowHeight(findChild(element, 'trHeight'));

  // Header row
  const tblHeader = parseToggle(findChild(element, 'tblHeader'));

  // Cell spacing
  const tblCellSpacing = parseWidth(findChild(element, 'tblCellSpacing'));

  // Alignment
  const jcElem = findChild(element, 'jc');
  const jc = jcElem ? getAttribute(jcElem, 'val') : null;

  // Hidden
  const hidden = parseToggle(findChild(element, 'hidden'));

  // Cast - some properties may not be in the interface
  return {
    cnfStyle: cnfStyle ?? null,
    divId: divId ?? null,
    gridBefore: gridBefore ?? null,
    gridAfter: gridAfter ?? null,
    wBefore: wBefore ?? null,
    wAfter: wAfter ?? null,
    cantSplit: cantSplit ?? null,
    trHeight: trHeight ?? null,
    tblHeader: tblHeader ?? null,
    tblCellSpacing: tblCellSpacing ?? null,
    jc: (jc as JustificationType) ?? null,
    hidden: hidden ?? null,
  } as unknown as TableRowProperties;
}
