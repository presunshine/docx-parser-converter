/**
 * Color model definition.
 *
 * Represents color specifications in DOCX documents.
 */

import type { ThemeColorType } from '../types';

/**
 * Color specification.
 *
 * Colors can be specified as RGB hex values or theme color references.
 */
export interface Color {
  /** RGB color value (e.g., "FF0000") or "auto" */
  val?: string | null;
  /** Theme color identifier */
  themeColor?: ThemeColorType | null;
  /** Tint applied to theme color (hex string, 00-FF) */
  themeTint?: string | null;
  /** Shade applied to theme color (hex string, 00-FF) */
  themeShade?: string | null;
}
