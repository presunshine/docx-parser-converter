/**
 * Document defaults model definitions.
 *
 * Document defaults define base formatting applied to all content.
 */

import type { ParagraphProperties } from '../document/paragraph';
import type { RunProperties } from '../document/run';

/**
 * Default run properties wrapper.
 *
 * XML Element: <w:rPrDefault>
 */
export interface RunPropertiesDefault {
  /** Default run properties */
  rPr?: RunProperties | null;
}

/**
 * Default paragraph properties wrapper.
 *
 * XML Element: <w:pPrDefault>
 */
export interface ParagraphPropertiesDefault {
  /** Default paragraph properties */
  pPr?: ParagraphProperties | null;
}

/**
 * Document defaults for base formatting.
 *
 * XML Element: <w:docDefaults>
 *
 * Contains default run and paragraph properties applied to all content
 * before any styles are applied.
 */
export interface DocumentDefaults {
  /** Default run properties wrapper */
  rPrDefault?: RunPropertiesDefault | null;
  /** Default paragraph properties wrapper */
  pPrDefault?: ParagraphPropertiesDefault | null;
}
