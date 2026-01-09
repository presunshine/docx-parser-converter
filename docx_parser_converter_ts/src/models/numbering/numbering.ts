/**
 * Numbering root model definitions.
 *
 * The Numbering model is the root container for all numbering definitions.
 */

import type { AbstractNumbering } from './abstract-numbering';
import type { NumberingInstance } from './numbering-instance';

/**
 * Root container for all numbering definitions.
 *
 * XML Element: <w:numbering>
 */
export interface Numbering {
  /** Abstract numbering definitions */
  abstractNum?: AbstractNumbering[] | null;
  /** Numbering instances */
  num?: NumberingInstance[] | null;
}
