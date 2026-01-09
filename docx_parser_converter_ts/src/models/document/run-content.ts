/**
 * Run content model definitions.
 *
 * Represents the various content items that can appear inside a run.
 */

import type { BreakType, BreakClearType, FieldCharType } from '../types';

/**
 * Text content inside a run.
 */
export interface Text {
  type: 'text';
  /** The text value */
  value: string;
  /** Whitespace handling ("preserve" to preserve spaces) */
  space?: string | null;
}

/**
 * Break element (page break, column break, text wrapping break).
 */
export interface Break {
  type: 'break';
  /** Break type */
  breakType?: BreakType | null;
  /** Clear location for text wrapping breaks */
  clear?: BreakClearType | null;
}

/**
 * Tab character.
 */
export interface TabChar {
  type: 'tab';
}

/**
 * Carriage return (hard line break).
 */
export interface CarriageReturn {
  type: 'cr';
}

/**
 * Soft hyphen (optional hyphen).
 */
export interface SoftHyphen {
  type: 'softHyphen';
}

/**
 * Non-breaking hyphen.
 */
export interface NoBreakHyphen {
  type: 'noBreakHyphen';
}

/**
 * Symbol character from a specific font.
 */
export interface Symbol {
  type: 'symbol';
  /** Font name containing the symbol */
  font?: string | null;
  /** Character code (hex) */
  char?: string | null;
}

/**
 * Field character (begin, separate, or end of a field).
 */
export interface FieldChar {
  type: 'fieldChar';
  /** Field character type */
  fldCharType?: FieldCharType | null;
  /** Whether the field result is dirty (needs recalculation) */
  dirty?: boolean | null;
}

/**
 * Field instruction text.
 */
export interface InstrText {
  type: 'instrText';
  /** The instruction text */
  value: string;
  /** Whitespace handling */
  space?: string | null;
}

/**
 * Footnote reference marker.
 */
export interface FootnoteReference {
  type: 'footnoteRef';
  /** Footnote ID */
  id?: number | null;
}

/**
 * Endnote reference marker.
 */
export interface EndnoteReference {
  type: 'endnoteRef';
  /** Endnote ID */
  id?: number | null;
}

/**
 * Drawing content (images, shapes).
 * Forward reference to Drawing type.
 */
export interface DrawingContent {
  type: 'drawing';
  /** The drawing element */
  drawing: unknown; // Will be typed as Drawing when that interface is defined
}

/**
 * Union type for all run content items.
 */
export type RunContentItem =
  | Text
  | Break
  | TabChar
  | CarriageReturn
  | SoftHyphen
  | NoBreakHyphen
  | Symbol
  | FieldChar
  | InstrText
  | FootnoteReference
  | EndnoteReference
  | DrawingContent;
