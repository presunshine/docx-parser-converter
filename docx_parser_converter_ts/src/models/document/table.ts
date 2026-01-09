/**
 * Table model definitions.
 *
 * Represents tables with rows, cells, and their properties.
 */

import type { TableBorders } from '../common/border';
import type { Shading } from '../common/shading';
import type { Width } from '../common/width';
import type {
  JustificationType,
  TableLayoutType,
  VAlignType,
  VMergeType,
  TextDirectionType,
  HeightRuleType,
} from '../types';

// Forward declare Paragraph to avoid circular dependency
import type { Paragraph } from './paragraph';

/**
 * Table cell margins.
 */
export interface TableCellMargins {
  /** Top margin */
  top?: Width | null;
  /** Left margin */
  left?: Width | null;
  /** Bottom margin */
  bottom?: Width | null;
  /** Right margin */
  right?: Width | null;
}

/**
 * Table look (conditional formatting flags).
 */
export interface TableLook {
  /** Apply first row formatting */
  firstRow?: boolean | null;
  /** Apply last row formatting */
  lastRow?: boolean | null;
  /** Apply first column formatting */
  firstColumn?: boolean | null;
  /** Apply last column formatting */
  lastColumn?: boolean | null;
  /** Disable horizontal banding */
  noHBand?: boolean | null;
  /** Disable vertical banding */
  noVBand?: boolean | null;
}

/**
 * Table grid column width.
 */
export interface TableGridColumn {
  /** Column width in twips */
  w?: number | null;
}

/**
 * Table grid (column definitions).
 */
export interface TableGrid {
  /** Column definitions */
  gridCol: TableGridColumn[];
}

/**
 * Table properties.
 */
export interface TableProperties {
  /** Table style ID */
  tblStyle?: string | null;
  /** Table width */
  tblW?: Width | null;
  /** Table justification */
  jc?: JustificationType | null;
  /** Table indentation from left margin */
  tblInd?: Width | null;
  /** Table borders */
  tblBorders?: TableBorders | null;
  /** Table shading/background */
  shd?: Shading | null;
  /** Table layout algorithm */
  tblLayout?: TableLayoutType | null;
  /** Default cell margins */
  tblCellMar?: TableCellMargins | null;
  /** Conditional formatting flags */
  tblLook?: TableLook | null;
  /** Table caption (accessibility) */
  tblCaption?: string | null;
  /** Table description (accessibility) */
  tblDescription?: string | null;
}

/**
 * Table row height specification.
 */
export interface TableRowHeight {
  /** Height value in twips */
  val?: number | null;
  /** Height rule */
  hRule?: HeightRuleType | null;
}

/**
 * Table row properties.
 */
export interface TableRowProperties {
  /** Row height */
  trHeight?: TableRowHeight | null;
  /** Repeat row as header on each page */
  tblHeader?: boolean | null;
  /** Row justification */
  jc?: JustificationType | null;
  /** Prevent row from splitting across pages */
  cantSplit?: boolean | null;
  /** Cell spacing */
  tblCellSpacing?: Width | null;
}

/**
 * Table cell properties.
 */
export interface TableCellProperties {
  /** Cell width */
  tcW?: Width | null;
  /** Cell borders */
  tcBorders?: TableBorders | null;
  /** Cell shading/background */
  shd?: Shading | null;
  /** Cell margins */
  tcMar?: TableCellMargins | null;
  /** Text direction */
  textDirection?: TextDirectionType | null;
  /** Vertical alignment */
  vAlign?: VAlignType | null;
  /** Number of columns spanned */
  gridSpan?: number | null;
  /** Vertical merge type */
  vMerge?: VMergeType | null;
  /** Horizontal merge type (deprecated) */
  hMerge?: string | null;
  /** Prevent text wrapping */
  noWrap?: boolean | null;
  /** Fit text to cell width */
  tcFitText?: boolean | null;
  /** Hide cell markers */
  hideMark?: boolean | null;
}

/**
 * A table cell.
 *
 * Contains cell properties and content (paragraphs or nested tables).
 */
export interface TableCell {
  /** Cell properties */
  tcPr?: TableCellProperties | null;
  /** Cell content (paragraphs or nested tables) */
  content: (Paragraph | Table)[];
}

/**
 * A table row.
 */
export interface TableRow {
  /** Row properties */
  trPr?: TableRowProperties | null;
  /** Row cells */
  tc: TableCell[];
}

/**
 * A table in the document.
 */
export interface Table {
  /** Table properties */
  tblPr?: TableProperties | null;
  /** Table grid (column definitions) */
  tblGrid?: TableGrid | null;
  /** Table rows */
  tr: TableRow[];
}
