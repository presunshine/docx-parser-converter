/**
 * Table style properties model definitions.
 *
 * Table style properties define conditional formatting for different parts of a table.
 */

import type { TableStyleConditionType } from '../types';
import type { ParagraphProperties } from '../document/paragraph';
import type { RunProperties } from '../document/run';
import type { TableProperties, TableRowProperties, TableCellProperties } from '../document/table';

/**
 * Conditional formatting for a part of a table.
 *
 * XML Element: <w:tblStylePr>
 */
export interface TableStyleProperties {
  /** Condition type (firstRow, lastRow, firstCol, etc.) */
  type: TableStyleConditionType;
  /** Paragraph properties for this condition */
  pPr?: ParagraphProperties | null;
  /** Run properties for this condition */
  rPr?: RunProperties | null;
  /** Table properties for this condition */
  tblPr?: TableProperties | null;
  /** Table row properties for this condition */
  trPr?: TableRowProperties | null;
  /** Table cell properties for this condition */
  tcPr?: TableCellProperties | null;
}
