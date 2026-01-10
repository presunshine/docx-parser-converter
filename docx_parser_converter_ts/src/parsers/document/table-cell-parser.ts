/**
 * Parser for table cell elements.
 *
 * Matches Python: parsers/document/table_cell_parser.py
 */

import type { TableCell, Table } from '../../models/document/table';
import type { Paragraph } from '../../models/document/paragraph';
import { findChild, getLocalName, iterChildren } from '../utils';
import { parseParagraph } from './paragraph-parser';
import { parseTableCellProperties } from './table-cell-properties-parser';
// Import for nested table support - TypeScript handles circular deps at module level
import { parseTable } from './table-parser';

/** Union type for table cell content items */
type TableCellContentItem = Paragraph | Table;

/**
 * Parse <w:tc> element.
 *
 * @param element - The <w:tc> element or null
 * @returns TableCell model or null
 */
export function parseTableCell(element: Element | null): TableCell | null {
  if (element === null) {
    return null;
  }

  // Parse cell properties
  const tcPr = parseTableCellProperties(findChild(element, 'tcPr'));

  // Parse content (paragraphs and nested tables)
  const content: TableCellContentItem[] = [];

  for (const child of iterChildren(element)) {
    const localName = getLocalName(child);

    if (localName === 'tcPr') {
      continue; // Skip properties element
    } else if (localName === 'p') {
      const paragraph = parseParagraph(child);
      if (paragraph !== null) {
        content.push(paragraph);
      }
    } else if (localName === 'tbl') {
      // Nested table
      const table = parseTable(child);
      if (table !== null) {
        content.push(table);
      }
    }
    // Skip unrecognized elements
  }

  return {
    tcPr: tcPr ?? null,
    content,
  };
}
