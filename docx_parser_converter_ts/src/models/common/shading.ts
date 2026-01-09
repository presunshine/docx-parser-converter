/**
 * Shading model definition.
 *
 * Represents background/fill specifications in DOCX documents.
 */

import type { ShadingPatternType, ThemeColorType } from '../types';

/**
 * Shading (background) specification.
 *
 * Represents fill colors and patterns for paragraphs, cells, etc.
 */
export interface Shading {
  /** Shading pattern type (e.g., "clear" for solid, "pct25" for 25% pattern) */
  val?: ShadingPatternType | null;
  /** Foreground color for pattern (RGB hex or "auto") */
  color?: string | null;
  /** Background fill color (RGB hex or "auto") */
  fill?: string | null;
  /** Theme color for foreground */
  themeColor?: ThemeColorType | null;
  /** Theme color for background fill */
  themeFill?: ThemeColorType | null;
  /** Tint applied to themeColor (hex string, 00-FF) */
  themeTint?: string | null;
  /** Shade applied to themeColor (hex string, 00-FF) */
  themeShade?: string | null;
  /** Tint applied to themeFill (hex string, 00-FF) */
  themeFillTint?: string | null;
  /** Shade applied to themeFill (hex string, 00-FF) */
  themeFillShade?: string | null;
}
