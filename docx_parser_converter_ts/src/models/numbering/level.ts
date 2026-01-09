/**
 * Level model definitions.
 *
 * A level defines formatting and behavior for a single level within a numbering.
 */

import type { NumFmtType, JustificationType, LevelSuffixType } from '../types';
import type { ParagraphProperties } from '../document/paragraph';
import type { RunProperties } from '../document/run';

/**
 * A level definition within an abstract numbering.
 *
 * XML Element: <w:lvl>
 */
export interface Level {
  /** Level index (0-8, required) */
  ilvl: number;
  /** Template code */
  tplc?: string | null;
  /** Tentative level (not yet used) */
  tentative?: boolean | null;
  /** Starting number */
  start?: number | null;
  /** Number format (decimal, bullet, upperRoman, etc.) */
  numFmt?: NumFmtType | null;
  /** Restart counter after this level */
  lvlRestart?: number | null;
  /** Associated paragraph style */
  pStyle?: string | null;
  /** Use legal numbering style */
  isLgl?: boolean | null;
  /** Suffix type (tab, space, nothing) */
  suff?: LevelSuffixType | null;
  /** Level text template (e.g., "%1.", "%1.%2") */
  lvlText?: string | null;
  /** Picture bullet ID */
  lvlPicBulletId?: number | null;
  /** Justification (left, center, right) */
  lvlJc?: JustificationType | null;
  /** Paragraph properties (indentation, tabs) */
  pPr?: ParagraphProperties | null;
  /** Run properties (font for bullet/number) */
  rPr?: RunProperties | null;
}
