/**
 * Level override model definitions.
 *
 * Level overrides allow a numbering instance to modify specific levels.
 */

import type { Level } from './level';

/**
 * Override for a specific level within a numbering instance.
 *
 * XML Element: <w:lvlOverride>
 */
export interface LevelOverride {
  /** Level to override (0-8, required) */
  ilvl: number;
  /** Override the start number */
  startOverride?: number | null;
  /** Complete level replacement */
  lvl?: Level | null;
}
