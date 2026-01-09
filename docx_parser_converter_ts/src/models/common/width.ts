/**
 * Width model definition.
 *
 * Represents width specifications for tables and cells in DOCX documents.
 */

import type { WidthType } from '../types';

/**
 * Width specification for tables and cells.
 *
 * Width can be specified in different units based on the type field.
 */
export interface Width {
  /**
   * Width value. Interpretation depends on type:
   * - dxa: twentieths of a point (twips)
   * - pct: fiftieths of a percent (e.g., 5000 = 100%)
   * - auto: value is ignored, width is automatic
   * - nil: no width specified
   */
  w?: number | null;
  /** How to interpret the width value */
  type?: WidthType | null;
}
