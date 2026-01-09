/**
 * Run model definitions.
 *
 * Represents a run of text with consistent formatting.
 */

import type { Border } from '../common/border';
import type { Color } from '../common/color';
import type { Shading } from '../common/shading';
import type {
  VertAlignType,
  UnderlineType,
  HighlightType,
  ThemeColorType,
  FontHintType,
} from '../types';
import type { RunContentItem } from './run-content';

/**
 * Font specification for a run.
 *
 * Different fonts can be specified for different character types.
 */
export interface RunFonts {
  /** Font for ASCII characters (basic Latin) */
  ascii?: string | null;
  /** Font for high ANSI characters (extended Latin) */
  hAnsi?: string | null;
  /** Font for East Asian characters (CJK) */
  eastAsia?: string | null;
  /** Font for complex script characters (Arabic, Hebrew) */
  cs?: string | null;
  /** Hint for which font to use when character classification is ambiguous */
  hint?: FontHintType | null;
}

/**
 * Language specification for a run.
 */
export interface Language {
  /** Primary language (e.g., "en-US") */
  val?: string | null;
  /** East Asian language */
  eastAsia?: string | null;
  /** Bidirectional language (Arabic, Hebrew) */
  bidi?: string | null;
}

/**
 * Underline specification.
 */
export interface Underline {
  /** Underline style */
  val?: UnderlineType | null;
  /** Underline color (RGB hex or "auto") */
  color?: string | null;
  /** Theme color for underline */
  themeColor?: ThemeColorType | null;
}

/**
 * Run properties (character-level formatting).
 *
 * Contains all formatting properties for text within a run.
 */
export interface RunProperties {
  /** Character style ID */
  rStyle?: string | null;
  /** Font specification */
  rFonts?: RunFonts | null;
  /** Bold */
  b?: boolean | null;
  /** Bold for complex script */
  bCs?: boolean | null;
  /** Italic */
  i?: boolean | null;
  /** Italic for complex script */
  iCs?: boolean | null;
  /** All caps */
  caps?: boolean | null;
  /** Small caps */
  smallCaps?: boolean | null;
  /** Strikethrough */
  strike?: boolean | null;
  /** Double strikethrough */
  dstrike?: boolean | null;
  /** Outline effect */
  outline?: boolean | null;
  /** Shadow effect */
  shadow?: boolean | null;
  /** Emboss effect */
  emboss?: boolean | null;
  /** Imprint (engrave) effect */
  imprint?: boolean | null;
  /** Hidden text */
  vanish?: boolean | null;
  /** Text color */
  color?: Color | null;
  /** Character spacing in twips */
  spacing?: number | null;
  /** Character width as percentage (100 = normal) */
  w?: number | null;
  /** Kerning threshold in half-points */
  kern?: number | null;
  /** Vertical position offset in half-points */
  position?: number | null;
  /** Font size in half-points (24 = 12pt) */
  sz?: number | null;
  /** Font size for complex script in half-points */
  szCs?: number | null;
  /** Highlight color name */
  highlight?: HighlightType | null;
  /** Underline specification */
  u?: Underline | null;
  /** Text effect (deprecated) */
  effect?: string | null;
  /** Text border */
  bdr?: Border | null;
  /** Text shading/background */
  shd?: Shading | null;
  /** Vertical alignment (baseline, superscript, subscript) */
  vertAlign?: VertAlignType | null;
  /** Language specification */
  lang?: Language | null;
  /** Special vanish (suppress at end of document) */
  specVanish?: boolean | null;
}

/**
 * A run of text with consistent formatting.
 *
 * A run contains a sequence of content items (text, breaks, etc.)
 * that share the same character formatting.
 */
export interface Run {
  /** Run properties (formatting) */
  rPr?: RunProperties | null;
  /** Run content items */
  content: RunContentItem[];
}
