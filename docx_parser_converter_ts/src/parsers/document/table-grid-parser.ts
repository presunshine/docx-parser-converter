/**
 * Parser for table grid elements.
 *
 * Matches Python: parsers/document/table_grid_parser.py
 */

import type { TableGrid, TableGridColumn } from '../../models/document/table';
import { getIntAttribute, findAllChildren } from '../utils';

/**
 * Parse <w:gridCol> element.
 *
 * @param element - The <w:gridCol> element or null
 * @returns TableGridColumn model or null
 */
export function parseTableGridColumn(element: Element | null): TableGridColumn | null {
  if (element === null) {
    return null;
  }

  return {
    w: getIntAttribute(element, 'w'),
  };
}

/**
 * Parse <w:tblGrid> element.
 *
 * @param element - The <w:tblGrid> element or null
 * @returns TableGrid model or null
 */
export function parseTableGrid(element: Element | null): TableGrid | null {
  if (element === null) {
    return null;
  }

  // Parse grid columns
  const gridCols: TableGridColumn[] = [];
  for (const colElem of findAllChildren(element, 'gridCol')) {
    const col = parseTableGridColumn(colElem);
    if (col !== null) {
      gridCols.push(col);
    }
  }

  return {
    gridCol: gridCols,
  };
}
