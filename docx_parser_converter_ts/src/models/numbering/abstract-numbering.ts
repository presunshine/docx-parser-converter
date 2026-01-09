/**
 * Abstract numbering model definitions.
 *
 * Abstract numbering defines the template for a numbering scheme.
 */

import type { MultiLevelType } from '../types';
import type { Level } from './level';

/**
 * Abstract numbering definition.
 *
 * XML Element: <w:abstractNum>
 *
 * An abstract numbering defines the format and behavior of each level (0-8).
 * Multiple numbering instances can reference the same abstract numbering.
 */
export interface AbstractNumbering {
  /** Unique identifier (required) */
  abstractNumId: number;
  /** Number scheme ID (random hex) */
  nsid?: string | null;
  /** Type of multilevel list */
  multiLevelType?: MultiLevelType | null;
  /** Template ID */
  tmpl?: string | null;
  /** Name */
  name?: string | null;
  /** Link to numbering style */
  styleLink?: string | null;
  /** Link from style */
  numStyleLink?: string | null;
  /** Level definitions (0-8) */
  lvl?: Level[] | null;
}
