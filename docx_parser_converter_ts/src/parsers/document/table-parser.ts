/**
 * Parser for table elements.
 *
 * Matches Python: parsers/document/table_parser.py
 */

import type { Table } from '../../models/document/table';
import { findChild, findAllChildren } from '../utils';
import { parseTableGrid } from './table-grid-parser';
import { parseTableProperties } from './table-properties-parser';
import { parseTableRow } from './table-row-parser';

/**
 * Parse <w:tbl> element.
 *
 * @param element - The <w:tbl> element or null
 * @returns Table model or null
 */
export function parseTable(element: Element | null): Table | null {
  if (element === null) {
    return null;
  }

  // Parse table properties
  const tblPr = parseTableProperties(findChild(element, 'tblPr'));

  // Parse table grid
  const tblGrid = parseTableGrid(findChild(element, 'tblGrid'));

  // Parse table rows
  const rows = [];
  for (const rowElem of findAllChildren(element, 'tr')) {
    const row = parseTableRow(rowElem);
    if (row !== null) {
      rows.push(row);
    }
  }

  return {
    tblPr: tblPr ?? null,
    tblGrid: tblGrid ?? null,
    tr: rows,
  };
}
