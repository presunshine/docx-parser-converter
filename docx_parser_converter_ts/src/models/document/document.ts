/**
 * Document and Body model definitions.
 *
 * Represents the root document structure.
 */

import type { Paragraph } from './paragraph';
import type { Table } from './table';
import type { SectionProperties } from './section';

/**
 * Document body content item.
 *
 * The body can contain paragraphs and tables.
 */
export type BodyContentItem = Paragraph | Table;

/**
 * Document body.
 *
 * Contains the main content of the document.
 */
export interface Body {
  /** Body content (paragraphs and tables) */
  content: BodyContentItem[];
  /** Section properties (page layout, margins, etc.) */
  sectPr?: SectionProperties | null;
}

/**
 * The root document element.
 */
export interface Document {
  /** Document body */
  body: Body;
}
