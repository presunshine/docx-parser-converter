/**
 * Border model definitions.
 *
 * Represents border specifications for paragraphs, tables, and cells.
 */

import type { BorderStyleType, ThemeColorType } from '../types';

/**
 * Single border specification.
 *
 * Represents the properties of a single border line.
 */
export interface Border {
  /** Border style (e.g., "single", "double", "dashed") */
  val?: BorderStyleType | null;
  /** Border width in eighths of a point */
  sz?: number | null;
  /** Spacing in points between border and content */
  space?: number | null;
  /** RGB color value (e.g., "000000") or "auto" */
  color?: string | null;
  /** Theme color identifier */
  themeColor?: ThemeColorType | null;
  /** Tint applied to theme color (hex string, 00-FF) */
  themeTint?: string | null;
  /** Shade applied to theme color (hex string, 00-FF) */
  themeShade?: string | null;
  /** Whether border has 3D frame effect */
  frame?: boolean | null;
  /** Whether border has shadow effect */
  shadow?: boolean | null;
}

/**
 * Paragraph border collection.
 *
 * Represents all borders that can be applied to a paragraph.
 */
export interface ParagraphBorders {
  /** Top border */
  top?: Border | null;
  /** Left border */
  left?: Border | null;
  /** Bottom border */
  bottom?: Border | null;
  /** Right border */
  right?: Border | null;
  /** Border between paragraphs with same properties */
  between?: Border | null;
  /** Vertical bar border */
  bar?: Border | null;
}

/**
 * Table border collection.
 *
 * Represents all borders that can be applied to a table or cell.
 */
export interface TableBorders {
  /** Top border */
  top?: Border | null;
  /** Left border */
  left?: Border | null;
  /** Bottom border */
  bottom?: Border | null;
  /** Right border */
  right?: Border | null;
  /** Inside horizontal borders (between rows) */
  insideH?: Border | null;
  /** Inside vertical borders (between columns) */
  insideV?: Border | null;
  /** Top-left to bottom-right diagonal border */
  tl2br?: Border | null;
  /** Top-right to bottom-left diagonal border */
  tr2bl?: Border | null;
}

/**
 * Cell border collection.
 *
 * Represents borders for an individual table cell.
 * Same structure as TableBorders but typically only uses outer borders.
 */
export interface CellBorders {
  /** Top border */
  top?: Border | null;
  /** Left border */
  left?: Border | null;
  /** Bottom border */
  bottom?: Border | null;
  /** Right border */
  right?: Border | null;
  /** Inside horizontal border (for merged cells) */
  insideH?: Border | null;
  /** Inside vertical border (for merged cells) */
  insideV?: Border | null;
  /** Top-left to bottom-right diagonal border */
  tl2br?: Border | null;
  /** Top-right to bottom-left diagonal border */
  tr2bl?: Border | null;
}
