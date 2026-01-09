/**
 * Spacing model definition.
 *
 * Represents paragraph spacing specifications in DOCX documents.
 */

import type { LineRuleType } from '../types';

/**
 * Paragraph spacing specification.
 *
 * Defines spacing before/after paragraphs and line spacing.
 */
export interface Spacing {
  /** Space before paragraph (in twips - twentieths of a point) */
  before?: number | null;
  /** Space after paragraph (in twips) */
  after?: number | null;
  /** Line spacing value (interpretation depends on lineRule) */
  line?: number | null;
  /** How to interpret line value ("auto", "exact", "atLeast") */
  lineRule?: LineRuleType | null;
  /** Space before in hundredths of a line */
  beforeLines?: number | null;
  /** Space after in hundredths of a line */
  afterLines?: number | null;
  /** Use automatic spacing before */
  beforeAutospacing?: boolean | null;
  /** Use automatic spacing after */
  afterAutospacing?: boolean | null;
}
