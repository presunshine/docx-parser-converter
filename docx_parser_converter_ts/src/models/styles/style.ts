/**
 * Style model definitions.
 *
 * Styles define reusable formatting for paragraphs, characters, tables, and numbering.
 */

import type { StyleType } from '../types';
import type { ParagraphProperties } from '../document/paragraph';
import type { RunProperties } from '../document/run';
import type { TableProperties, TableRowProperties, TableCellProperties } from '../document/table';
import type { TableStyleProperties } from './table-style';

/**
 * A style definition.
 *
 * XML Element: <w:style>
 */
export interface Style {
  /** Style type (paragraph, character, table, numbering) */
  type: StyleType;
  /** Unique style identifier */
  styleId: string;
  /** Is default style for this type */
  default?: boolean | null;
  /** Is custom (not built-in) */
  customStyle?: boolean | null;
  /** Display name */
  name?: string | null;
  /** Alternative names */
  aliases?: string | null;
  /** Parent style ID */
  basedOn?: string | null;
  /** Next paragraph style ID */
  next?: string | null;
  /** Linked style ID (paragraph-character link) */
  link?: string | null;
  /** Auto-redefine on format change */
  autoRedefine?: boolean | null;
  /** Hidden from UI */
  hidden?: boolean | null;
  /** UI sort priority */
  uiPriority?: number | null;
  /** Semi-hidden (shown in some UI) */
  semiHidden?: boolean | null;
  /** Show when used */
  unhideWhenUsed?: boolean | null;
  /** Show in Quick Styles gallery */
  qFormat?: boolean | null;
  /** Cannot be modified */
  locked?: boolean | null;
  /** Personal style */
  personal?: boolean | null;
  /** Personal compose style */
  personalCompose?: boolean | null;
  /** Personal reply style */
  personalReply?: boolean | null;
  /** Revision save ID */
  rsid?: string | null;
  /** Paragraph properties */
  pPr?: ParagraphProperties | null;
  /** Run properties */
  rPr?: RunProperties | null;
  /** Table properties (for table styles) */
  tblPr?: TableProperties | null;
  /** Table row properties */
  trPr?: TableRowProperties | null;
  /** Table cell properties */
  tcPr?: TableCellProperties | null;
  /** Table style conditional formatting */
  tblStylePr?: TableStyleProperties[] | null;
}
