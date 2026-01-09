/**
 * Numbering instance model definitions.
 *
 * A numbering instance links a numId to an abstract numbering definition.
 */

import type { LevelOverride } from './level-override';

/**
 * A numbering instance.
 *
 * XML Element: <w:num>
 *
 * Links a numId (referenced by paragraphs) to an abstract numbering,
 * optionally with level overrides.
 */
export interface NumberingInstance {
  /** Instance ID (required, referenced by paragraphs) */
  numId: number;
  /** Reference to abstract numbering */
  abstractNumId?: number | null;
  /** Level overrides */
  lvlOverride?: LevelOverride[] | null;
}
