/**
 * Parser for table row elements.
 *
 * Matches Python: parsers/document/table_row_parser.py
 */

import type { TableRow } from '../../models/document/table';
import { findChild, findAllChildren } from '../utils';
import { parseTableCell } from './table-cell-parser';
import { parseTableRowProperties } from './table-row-properties-parser';

/**
 * Parse <w:tr> element.
 *
 * @param element - The <w:tr> element or null
 * @returns TableRow model or null
 */
export function parseTableRow(element: Element | null): TableRow | null {
  if (element === null) {
    return null;
  }

  // Parse row properties
  const trPr = parseTableRowProperties(findChild(element, 'trPr'));

  // Parse cells
  const cells = [];
  for (const cellElem of findAllChildren(element, 'tc')) {
    const cell = parseTableCell(cellElem);
    if (cell !== null) {
      cells.push(cell);
    }
  }

  return {
    trPr: trPr ?? null,
    tc: cells,
  };
}
