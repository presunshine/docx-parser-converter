/**
 * Section properties model definitions.
 *
 * Represents page layout and section settings.
 */

import type { Border } from '../common/border';
import type { SectionType, OrientType, VAlignType, NumFmtType } from '../types';

/**
 * Page size specification.
 */
export interface PageSize {
  /** Page width in twips (12240 = 8.5") */
  w?: number | null;
  /** Page height in twips (15840 = 11") */
  h?: number | null;
  /** Page orientation */
  orient?: OrientType | null;
}

/**
 * Page margins specification.
 */
export interface PageMargins {
  /** Top margin in twips (1440 = 1") */
  top?: number | null;
  /** Right margin in twips */
  right?: number | null;
  /** Bottom margin in twips */
  bottom?: number | null;
  /** Left margin in twips */
  left?: number | null;
  /** Header distance from top edge in twips */
  header?: number | null;
  /** Footer distance from bottom edge in twips */
  footer?: number | null;
  /** Gutter (binding) margin in twips */
  gutter?: number | null;
}

/**
 * Page borders specification.
 */
export interface PageBorders {
  /** Top border */
  top?: Border | null;
  /** Left border */
  left?: Border | null;
  /** Bottom border */
  bottom?: Border | null;
  /** Right border */
  right?: Border | null;
  /** Offset from (page or text) */
  offsetFrom?: string | null;
  /** Z-order (front or back) */
  zOrder?: string | null;
  /** Display mode */
  display?: string | null;
}

/**
 * Column definition for multi-column layout.
 */
export interface Column {
  /** Column width in twips */
  w?: number | null;
  /** Space after this column in twips */
  space?: number | null;
}

/**
 * Column layout specification.
 */
export interface Columns {
  /** Number of columns */
  num?: number | null;
  /** Space between columns in twips */
  space?: number | null;
  /** Equal width columns */
  equalWidth?: boolean | null;
  /** Separator line between columns */
  sep?: boolean | null;
  /** Individual column definitions (if not equal width) */
  col?: Column[] | null;
}

/**
 * Document grid settings.
 */
export interface DocumentGrid {
  /** Grid type */
  type?: string | null;
  /** Line pitch in twips */
  linePitch?: number | null;
  /** Character spacing */
  charSpace?: number | null;
}

/**
 * Header/footer reference.
 */
export interface HeaderFooterReference {
  /** Reference type (default, first, even) */
  type?: string | null;
  /** Relationship ID */
  rId?: string | null;
}

/**
 * Page numbering settings.
 */
export interface PageNumberType {
  /** Number format */
  fmt?: NumFmtType | null;
  /** Starting number */
  start?: number | null;
  /** Chapter style */
  chapterStyle?: string | null;
  /** Chapter separator */
  chapterSep?: string | null;
}

/**
 * Line numbering settings.
 */
export interface LineNumberType {
  /** Count by (e.g., 5 = every 5th line) */
  countBy?: number | null;
  /** Starting number */
  start?: number | null;
  /** Restart mode (newPage, newSection, continuous) */
  restart?: string | null;
  /** Distance from text in twips */
  distance?: number | null;
}

/**
 * Section properties.
 *
 * Defines page layout, margins, columns, and other section-level settings.
 */
export interface SectionProperties {
  /** Page size */
  pgSz?: PageSize | null;
  /** Page margins */
  pgMar?: PageMargins | null;
  /** Column layout */
  cols?: Columns | null;
  /** Document grid */
  docGrid?: DocumentGrid | null;
  /** Header references */
  headerRefs?: HeaderFooterReference[] | null;
  /** Footer references */
  footerRefs?: HeaderFooterReference[] | null;
  /** Page borders */
  pgBorders?: PageBorders | null;
  /** Page numbering */
  pgNumType?: PageNumberType | null;
  /** Section break type */
  type?: SectionType | null;
  /** Different first page header/footer */
  titlePg?: boolean | null;
  /** Line numbering */
  lnNumType?: LineNumberType | null;
  /** Right-to-left section */
  bidi?: boolean | null;
  /** Right-to-left gutter */
  rtlGutter?: boolean | null;
  /** Form protection */
  formProt?: boolean | null;
  /** Vertical alignment */
  vAlign?: VAlignType | null;
}
