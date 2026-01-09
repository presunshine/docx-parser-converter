/**
 * Indentation model definition.
 *
 * Represents paragraph indentation specifications in DOCX documents.
 */

/**
 * Paragraph indentation specification.
 *
 * Defines left, right, first line, and hanging indentation.
 * Values are in twips (twentieths of a point) unless otherwise noted.
 */
export interface Indentation {
  /** Left indentation in twips */
  left?: number | null;
  /** Right indentation in twips */
  right?: number | null;
  /** Start indentation (left in LTR, right in RTL) in twips */
  start?: number | null;
  /** End indentation (right in LTR, left in RTL) in twips */
  end?: number | null;
  /** First line additional indent in twips (positive value for indent) */
  firstLine?: number | null;
  /** First line hanging indent in twips (positive value creates outdent) */
  hanging?: number | null;
  /** Start indent in character units (1/100th of character width) */
  startChars?: number | null;
  /** End indent in character units */
  endChars?: number | null;
  /** First line indent in character units */
  firstLineChars?: number | null;
  /** Hanging indent in character units */
  hangingChars?: number | null;
}
