/**
 * CSS generator for converting DOCX properties to CSS.
 *
 * Provides functions for converting DOCX formatting properties to CSS styles.
 *
 * Matches Python: converters/html/css_generator.py
 */

import type { Border, ParagraphBorders, TableBorders } from '../../models/common/border';
import type { Color } from '../../models/common/color';
import type { Shading } from '../../models/common/shading';
import type { Width } from '../../models/common/width';
import type { ParagraphProperties } from '../../models/document/paragraph';
import type { RunFonts, RunProperties } from '../../models/document/run';
import type { TableCellMargins, TableCellProperties } from '../../models/document/table';

// =============================================================================
// Unit Conversion Constants
// =============================================================================

// 1 inch = 72 points = 1440 twips
const TWIPS_PER_POINT = 20;
const TWIPS_PER_INCH = 1440;

// Half-points (used for font size)
const HALF_POINTS_PER_POINT = 2;

// Eighths of a point (used for border width)
const EIGHTHS_PER_POINT = 8;

// EMUs (English Metric Units) - used for images
const EMUS_PER_PIXEL = 9525; // Approximate at 96 DPI

// =============================================================================
// Highlight Color Mapping
// =============================================================================

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: '#FFFF00',
  green: '#00FF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  blue: '#0000FF',
  red: '#FF0000',
  darkBlue: '#00008B',
  darkCyan: '#008B8B',
  darkGreen: '#006400',
  darkMagenta: '#8B008B',
  darkRed: '#8B0000',
  darkYellow: '#808000',
  darkGray: '#A9A9A9',
  lightGray: '#D3D3D3',
  black: '#000000',
  white: '#FFFFFF',
};

// =============================================================================
// Border Style Mapping
// =============================================================================

const BORDER_STYLES: Record<string, string> = {
  single: 'solid',
  double: 'double',
  dashed: 'dashed',
  dotted: 'dotted',
  dashDotStroked: 'dashed',
  dashSmallGap: 'dashed',
  dotDash: 'dashed',
  dotDotDash: 'dotted',
  triple: 'double',
  thick: 'solid',
  thickThinSmallGap: 'double',
  thinThickSmallGap: 'double',
  thickThinMediumGap: 'double',
  thinThickMediumGap: 'double',
  thickThinLargeGap: 'double',
  thinThickLargeGap: 'double',
  wave: 'solid',
  doubleWave: 'double',
  inset: 'inset',
  outset: 'outset',
  nil: 'none',
  none: 'none',
};

// =============================================================================
// Underline Style Mapping
// =============================================================================

// Maps DOCX underline styles to [text-decoration-style, thickness, is_approximate]
const UNDERLINE_STYLE_MAP: Record<string, [string, string | null, boolean]> = {
  // Standard styles - direct CSS equivalents
  single: ['solid', null, false],
  double: ['double', null, false],
  dotted: ['dotted', null, false],
  dash: ['dashed', null, false],
  wave: ['wavy', null, false],
  // Thick variants - use text-decoration-thickness
  thick: ['solid', '2.5px', true],
  dottedHeavy: ['dotted', '2.5px', true],
  dashedHeavy: ['dashed', '2.5px', true],
  dashLongHeavy: ['dashed', '2.5px', true],
  dashDotHeavy: ['dashed', '2.5px', true],
  dashDotDotHeavy: ['dashed', '2.5px', true],
  wavyHeavy: ['wavy', '2.5px', true],
  // Special patterns - approximated with closest CSS
  words: ['solid', null, true],
  dashLong: ['dashed', null, true],
  dotDash: ['dashed', null, true],
  dotDotDash: ['dashed', null, true],
  wavyDouble: ['wavy', null, true],
};

// =============================================================================
// Unit Conversion Functions
// =============================================================================

/**
 * Convert twips to points.
 */
export function twipsToPt(twips: number | null | undefined): number | null {
  if (twips === null || twips === undefined) {
    return null;
  }
  return twips / TWIPS_PER_POINT;
}

/**
 * Convert twips to pixels.
 */
export function twipsToPx(twips: number | null | undefined, dpi: number = 96): number | null {
  if (twips === null || twips === undefined) {
    return null;
  }
  const inches = twips / TWIPS_PER_INCH;
  return inches * dpi;
}

/**
 * Convert half-points to points.
 */
export function halfPointsToPt(halfPoints: number | null | undefined): number | null {
  if (halfPoints === null || halfPoints === undefined) {
    return null;
  }
  return halfPoints / HALF_POINTS_PER_POINT;
}

/**
 * Convert eighths of a point to points.
 */
export function eighthsToPt(eighths: number | null | undefined): number | null {
  if (eighths === null || eighths === undefined) {
    return null;
  }
  return eighths / EIGHTHS_PER_POINT;
}

/**
 * Convert EMUs to pixels.
 */
export function emuToPx(emu: number | null | undefined): number | null {
  if (emu === null || emu === undefined) {
    return null;
  }
  return emu / EMUS_PER_PIXEL;
}

// =============================================================================
// Color Conversion Functions
// =============================================================================

/**
 * Convert Color model to CSS color value.
 */
export function colorToCss(color: Color | null | undefined): string | null {
  if (color === null || color === undefined) {
    return null;
  }

  // Check for "auto" color (system default)
  if (color.val && color.val.toLowerCase() === 'auto') {
    return null; // Let browser use default
  }

  // Direct hex color value
  if (color.val) {
    const hexVal = color.val.toUpperCase();
    // Ensure it's a valid 6-character hex
    if (hexVal.length === 6 && /^[0-9A-F]+$/.test(hexVal)) {
      return `#${hexVal}`;
    }
    return `#${hexVal}`;
  }

  // Theme color (would need theme resolution - return null for now)
  if (color.themeColor) {
    return null;
  }

  return null;
}

/**
 * Convert highlight color name to CSS color.
 */
export function highlightToCss(highlight: string | null | undefined): string | null {
  if (highlight === null || highlight === undefined) {
    return null;
  }

  // Handle "none" explicitly
  if (highlight.toLowerCase() === 'none') {
    return null;
  }

  return HIGHLIGHT_COLORS[highlight] || null;
}

// =============================================================================
// Font Conversion Functions
// =============================================================================

/**
 * Convert RunFonts to CSS font-family.
 */
export function fontFamilyToCss(fonts: RunFonts | null | undefined): string | null {
  if (fonts === null || fonts === undefined) {
    return null;
  }

  // Priority: ascii, hAnsi, cs, eastAsia
  const fontName = fonts.ascii || fonts.hAnsi || fonts.cs || fonts.eastAsia;

  if (fontName === null || fontName === undefined) {
    return null;
  }

  // Quote font names with spaces (use single quotes for HTML attribute compatibility)
  if (fontName.includes(' ')) {
    return `'${fontName}'`;
  }

  return fontName;
}

/**
 * Convert font size (half-points) to CSS.
 */
export function fontSizeToCss(sz: number | null | undefined): string | null {
  if (sz === null || sz === undefined) {
    return null;
  }

  const points = halfPointsToPt(sz);
  if (points === null) {
    return null;
  }

  // Format nicely - use integer if whole number
  if (points === Math.floor(points)) {
    return `${Math.floor(points)}pt`;
  }
  return `${points}pt`;
}

// =============================================================================
// Border Conversion Functions
// =============================================================================

/**
 * Convert Border model to CSS border value.
 */
export function borderToCss(border: Border | null | undefined): string | null {
  if (border === null || border === undefined) {
    return null;
  }

  // Check for nil/none border
  if (border.val && ['nil', 'none'].includes(border.val.toLowerCase())) {
    return 'none';
  }

  // Get border style
  const style = BORDER_STYLES[border.val || 'single'] || 'solid';

  // Get border width (sz is in eighths of a point)
  let widthPt = border.sz !== null && border.sz !== undefined ? eighthsToPt(border.sz) : 1;
  if (widthPt === null) {
    widthPt = 1;
  }

  // Get border color
  let color: string;
  if (border.color && border.color.toLowerCase() !== 'auto') {
    color = `#${border.color.toUpperCase()}`;
  } else {
    color = '#000000'; // Default to black
  }

  return `${widthPt}pt ${style} ${color}`;
}

/**
 * Convert ParagraphBorders to CSS properties.
 */
export function paragraphBordersToCss(borders: ParagraphBorders | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (borders === null || borders === undefined) {
    return result;
  }

  if (borders.top) {
    const css = borderToCss(borders.top);
    if (css) {
      result['border-top'] = css;
    }
  }

  if (borders.bottom) {
    const css = borderToCss(borders.bottom);
    if (css) {
      result['border-bottom'] = css;
    }
  }

  if (borders.left) {
    const css = borderToCss(borders.left);
    if (css) {
      result['border-left'] = css;
    }
  }

  if (borders.right) {
    const css = borderToCss(borders.right);
    if (css) {
      result['border-right'] = css;
    }
  }

  return result;
}

/**
 * Convert TableBorders to CSS properties.
 */
export function tableBordersToCss(borders: TableBorders | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (borders === null || borders === undefined) {
    return result;
  }

  if (borders.top) {
    const css = borderToCss(borders.top);
    if (css) {
      result['border-top'] = css;
    }
  }

  if (borders.bottom) {
    const css = borderToCss(borders.bottom);
    if (css) {
      result['border-bottom'] = css;
    }
  }

  if (borders.left) {
    const css = borderToCss(borders.left);
    if (css) {
      result['border-left'] = css;
    }
  }

  if (borders.right) {
    const css = borderToCss(borders.right);
    if (css) {
      result['border-right'] = css;
    }
  }

  return result;
}

// =============================================================================
// Shading Conversion Functions
// =============================================================================

/**
 * Convert Shading model to CSS background-color.
 */
export function shadingToCss(shading: Shading | null | undefined): string | null {
  if (shading === null || shading === undefined) {
    return null;
  }

  // Check for clear/nil shading
  if (shading.val && ['clear', 'nil'].includes(shading.val.toLowerCase())) {
    // For clear, use the fill color if present
    if (shading.fill && !['auto', ''].includes(shading.fill.toLowerCase())) {
      return `#${shading.fill.toUpperCase()}`;
    }
    return null;
  }

  // Use fill color if present
  if (shading.fill && !['auto', ''].includes(shading.fill.toLowerCase())) {
    return `#${shading.fill.toUpperCase()}`;
  }

  return null;
}

// =============================================================================
// Width Conversion Functions
// =============================================================================

/**
 * Convert Width model to CSS width value.
 */
export function widthToCss(width: Width | null | undefined): string | null {
  if (width === null || width === undefined) {
    return null;
  }

  const widthType = width.type || 'dxa';

  if (widthType === 'auto') {
    return 'auto';
  }

  if (widthType === 'pct') {
    // Percentage is in fiftieths of a percent
    if (width.w !== null && width.w !== undefined) {
      const pct = width.w / 50;
      if (pct === Math.floor(pct)) {
        return `${Math.floor(pct)}%`;
      }
      return `${pct}%`;
    }
    return null;
  }

  if (widthType === 'dxa') {
    // DXA is twips
    if (width.w !== null && width.w !== undefined) {
      const pt = twipsToPt(width.w);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          return `${Math.floor(pt)}pt`;
        }
        return `${pt.toFixed(2)}pt`;
      }
    }
    return null;
  }

  if (widthType === 'nil') {
    return '0';
  }

  return null;
}

// =============================================================================
// Run Properties Conversion
// =============================================================================

/**
 * Convert RunProperties to CSS properties.
 */
export function runPropertiesToCss(rPr: RunProperties | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (rPr === null || rPr === undefined) {
    return result;
  }

  // Font family
  if (rPr.rFonts) {
    const font = fontFamilyToCss(rPr.rFonts);
    if (font) {
      result['font-family'] = font;
    }
  }

  // Font size
  if (rPr.sz !== null && rPr.sz !== undefined) {
    const size = fontSizeToCss(rPr.sz);
    if (size) {
      result['font-size'] = size;
    }
  }

  // Bold
  if (rPr.b === true) {
    result['font-weight'] = 'bold';
  } else if (rPr.b === false) {
    result['font-weight'] = 'normal';
  }

  // Italic
  if (rPr.i === true) {
    result['font-style'] = 'italic';
  } else if (rPr.i === false) {
    result['font-style'] = 'normal';
  }

  // Text decorations (underline, strikethrough)
  const decorations: string[] = [];
  let decorationStyle: string | null = null;
  let decorationThickness: string | null = null;
  let decorationColor: string | null = null;

  if (rPr.u && rPr.u.val && !['none', ''].includes(rPr.u.val.toLowerCase())) {
    decorations.push('underline');
    // Get the underline style, thickness, and whether it's approximate
    const styleInfo = UNDERLINE_STYLE_MAP[rPr.u.val];
    if (styleInfo) {
      const [cssStyle, thickness] = styleInfo;
      if (cssStyle && cssStyle !== 'solid') {
        decorationStyle = cssStyle;
      }
      if (thickness) {
        decorationThickness = thickness;
      }
    }

    // Get the underline color if specified
    if (rPr.u.color && !['auto', ''].includes(rPr.u.color.toLowerCase())) {
      const hexVal = rPr.u.color.toUpperCase();
      // Ensure proper hex format
      if (hexVal.length === 6 && /^[0-9A-F]+$/.test(hexVal)) {
        decorationColor = `#${hexVal}`;
      }
    }
  }

  if (rPr.strike === true) {
    decorations.push('line-through');
  }

  if (rPr.dstrike === true) {
    decorations.push('line-through');
    decorationStyle = 'double'; // Double strikethrough gets double style
  }

  if (decorations.length > 0) {
    // Build text-decoration value with style if not solid
    if (decorationStyle) {
      result['text-decoration'] = `${decorations.join(' ')} ${decorationStyle}`;
    } else {
      result['text-decoration'] = decorations.join(' ');
    }

    // Add thickness for heavy/thick variants
    if (decorationThickness) {
      result['text-decoration-thickness'] = decorationThickness;
    }

    // Add underline color if specified
    if (decorationColor) {
      result['text-decoration-color'] = decorationColor;
    }
  }

  // Text transform (caps)
  if (rPr.caps === true) {
    result['text-transform'] = 'uppercase';
  }

  if (rPr.smallCaps === true) {
    result['font-variant'] = 'small-caps';
  }

  // Vertical alignment (superscript/subscript)
  if (rPr.vertAlign) {
    if (rPr.vertAlign === 'superscript') {
      result['vertical-align'] = 'super';
      result['font-size'] = 'smaller';
    } else if (rPr.vertAlign === 'subscript') {
      result['vertical-align'] = 'sub';
      result['font-size'] = 'smaller';
    }
  }

  // Text color
  if (rPr.color) {
    const color = colorToCss(rPr.color);
    if (color) {
      result['color'] = color;
    }
  }

  // Highlight (background)
  if (rPr.highlight) {
    const bg = highlightToCss(rPr.highlight);
    if (bg) {
      result['background-color'] = bg;
    }
  }

  // Shading (background-color) - only applies if no highlight is set
  if (rPr.shd && !result['background-color']) {
    const bg = shadingToCss(rPr.shd);
    if (bg) {
      result['background-color'] = bg;
    }
  }

  // Character spacing
  if (rPr.spacing !== null && rPr.spacing !== undefined) {
    // Spacing is in twips
    const pt = twipsToPt(rPr.spacing);
    if (pt !== null) {
      result['letter-spacing'] = `${pt}pt`;
    }
  }

  // Hidden text
  if (rPr.vanish === true) {
    result['display'] = 'none';
  }

  return result;
}

// =============================================================================
// Paragraph Properties Conversion
// =============================================================================

/**
 * Convert ParagraphProperties to CSS properties.
 */
export function paragraphPropertiesToCss(pPr: ParagraphProperties | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (pPr === null || pPr === undefined) {
    return result;
  }

  // Text alignment
  if (pPr.jc) {
    const jc = pPr.jc.toLowerCase();
    if (jc === 'left') {
      result['text-align'] = 'left';
    } else if (jc === 'center') {
      result['text-align'] = 'center';
    } else if (jc === 'right') {
      result['text-align'] = 'right';
    } else if (jc === 'both' || jc === 'distribute') {
      result['text-align'] = 'justify';
    }
  }

  // Spacing
  if (pPr.spacing) {
    const spacing = pPr.spacing;

    // Space before (margin-top)
    if (spacing.before !== null && spacing.before !== undefined) {
      const pt = twipsToPt(spacing.before);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          result['margin-top'] = `${Math.floor(pt)}pt`;
        } else {
          result['margin-top'] = `${pt.toFixed(2)}pt`;
        }
      }
    }

    // Space after (margin-bottom)
    if (spacing.after !== null && spacing.after !== undefined) {
      const pt = twipsToPt(spacing.after);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          result['margin-bottom'] = `${Math.floor(pt)}pt`;
        } else {
          result['margin-bottom'] = `${pt.toFixed(2)}pt`;
        }
      }
    }

    // Line spacing
    if (spacing.line !== null && spacing.line !== undefined && spacing.lineRule) {
      const rule = spacing.lineRule.toLowerCase();
      if (rule === 'auto') {
        // Auto means line value is in 240ths of a line
        const lineHeight = spacing.line / 240;
        result['line-height'] = lineHeight.toFixed(2);
      } else if (rule === 'exact') {
        const pt = twipsToPt(spacing.line);
        if (pt !== null) {
          result['line-height'] = `${pt}pt`;
        }
      } else if (rule === 'atleast') {
        const pt = twipsToPt(spacing.line);
        if (pt !== null) {
          result['min-height'] = `${pt}pt`;
        }
      }
    }
  }

  // Indentation
  if (pPr.ind) {
    const ind = pPr.ind;

    if (ind.left !== null && ind.left !== undefined) {
      const pt = twipsToPt(ind.left);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          result['margin-left'] = `${Math.floor(pt)}pt`;
        } else {
          result['margin-left'] = `${pt.toFixed(2)}pt`;
        }
      }
    }

    if (ind.right !== null && ind.right !== undefined) {
      const pt = twipsToPt(ind.right);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          result['margin-right'] = `${Math.floor(pt)}pt`;
        } else {
          result['margin-right'] = `${pt.toFixed(2)}pt`;
        }
      }
    }

    if (ind.firstLine !== null && ind.firstLine !== undefined) {
      const pt = twipsToPt(ind.firstLine);
      if (pt !== null) {
        if (pt === Math.floor(pt)) {
          result['text-indent'] = `${Math.floor(pt)}pt`;
        } else {
          result['text-indent'] = `${pt.toFixed(2)}pt`;
        }
      }
    }

    if (ind.hanging !== null && ind.hanging !== undefined) {
      const pt = twipsToPt(ind.hanging);
      if (pt !== null) {
        // Hanging indent is negative text-indent
        if (pt === Math.floor(pt)) {
          result['text-indent'] = `-${Math.floor(pt)}pt`;
        } else {
          result['text-indent'] = `-${pt.toFixed(2)}pt`;
        }
      }
    }
  }

  // Borders
  if (pPr.pBdr) {
    const borderCss = paragraphBordersToCss(pPr.pBdr);
    Object.assign(result, borderCss);
  }

  // Shading/background
  if (pPr.shd) {
    const bg = shadingToCss(pPr.shd);
    if (bg) {
      result['background-color'] = bg;
    }
  }

  // Page break control
  if (pPr.pageBreakBefore === true) {
    result['page-break-before'] = 'always';
  }

  if (pPr.keepNext === true) {
    result['page-break-after'] = 'avoid';
  }

  if (pPr.keepLines === true) {
    result['page-break-inside'] = 'avoid';
  }

  // RTL direction
  if (pPr.bidi === true) {
    result['direction'] = 'rtl';
  }

  return result;
}

// =============================================================================
// Table Cell Properties Conversion
// =============================================================================

/**
 * Convert cell vertical alignment to CSS.
 */
export function cellVerticalAlignToCss(vAlign: string | null | undefined): string | null {
  if (vAlign === null || vAlign === undefined) {
    return null;
  }

  const align = vAlign.toLowerCase();
  if (align === 'top') {
    return 'top';
  } else if (align === 'center') {
    return 'middle';
  } else if (align === 'bottom') {
    return 'bottom';
  }

  return null;
}

/**
 * Convert TableCellMargins to CSS padding.
 */
export function cellMarginsToCss(margins: TableCellMargins | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (margins === null || margins === undefined) {
    return result;
  }

  if (margins.top) {
    const css = widthToCss(margins.top);
    if (css) {
      result['padding-top'] = css;
    }
  }

  if (margins.bottom) {
    const css = widthToCss(margins.bottom);
    if (css) {
      result['padding-bottom'] = css;
    }
  }

  if (margins.left) {
    const css = widthToCss(margins.left);
    if (css) {
      result['padding-left'] = css;
    }
  }

  if (margins.right) {
    const css = widthToCss(margins.right);
    if (css) {
      result['padding-right'] = css;
    }
  }

  return result;
}

/**
 * Convert TableCellProperties to CSS properties.
 */
export function tableCellPropertiesToCss(tcPr: TableCellProperties | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};

  if (tcPr === null || tcPr === undefined) {
    return result;
  }

  // Cell width
  if (tcPr.tcW) {
    const width = widthToCss(tcPr.tcW);
    if (width) {
      result['width'] = width;
    }
  }

  // Vertical alignment
  if (tcPr.vAlign) {
    const valign = cellVerticalAlignToCss(tcPr.vAlign);
    if (valign) {
      result['vertical-align'] = valign;
    }
  }

  // Borders
  if (tcPr.tcBorders) {
    const borderCss = tableBordersToCss(tcPr.tcBorders);
    Object.assign(result, borderCss);
  }

  // Shading/background
  if (tcPr.shd) {
    const bg = shadingToCss(tcPr.shd);
    if (bg) {
      result['background-color'] = bg;
    }
  }

  // Cell margins (padding)
  if (tcPr.tcMar) {
    const marginCss = cellMarginsToCss(tcPr.tcMar);
    Object.assign(result, marginCss);
  }

  // No wrap
  if (tcPr.noWrap === true) {
    result['white-space'] = 'nowrap';
  }

  // Text direction
  if (tcPr.textDirection) {
    const td = tcPr.textDirection.toLowerCase();
    if (['tbrl', 'tbrlv'].includes(td)) {
      result['writing-mode'] = 'vertical-rl';
    } else if (td === 'btlr') {
      result['writing-mode'] = 'vertical-lr';
    }
  }

  return result;
}

// =============================================================================
// CSS Generator Class
// =============================================================================

/**
 * CSS generator for converting DOCX properties to CSS.
 */
export class CSSGenerator {
  usePt: boolean = true;
  usePx: boolean = false;
  dpi: number = 96;

  constructor(options?: { usePt?: boolean; usePx?: boolean; dpi?: number }) {
    if (options) {
      if (options.usePt !== undefined) this.usePt = options.usePt;
      if (options.usePx !== undefined) this.usePx = options.usePx;
      if (options.dpi !== undefined) this.dpi = options.dpi;
    }
  }

  runToCss(rPr: RunProperties | null | undefined): Record<string, string> {
    return runPropertiesToCss(rPr);
  }

  paragraphToCss(pPr: ParagraphProperties | null | undefined): Record<string, string> {
    return paragraphPropertiesToCss(pPr);
  }

  cellToCss(tcPr: TableCellProperties | null | undefined): Record<string, string> {
    return tableCellPropertiesToCss(tcPr);
  }

  /**
   * Generate inline style string from CSS properties.
   */
  generateInlineStyle(props: Record<string, string>): string {
    if (!props || Object.keys(props).length === 0) {
      return '';
    }

    return Object.entries(props)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }

  /**
   * Generate style attribute for HTML element.
   */
  generateStyleAttribute(props: Record<string, string>): string {
    if (!props || Object.keys(props).length === 0) {
      return '';
    }

    const style = this.generateInlineStyle(props);
    return `style="${style}"`;
  }

  /**
   * Merge two CSS property dictionaries.
   */
  static mergeCss(base: Record<string, string>, override: Record<string, string>): Record<string, string> {
    return { ...base, ...override };
  }
}

// Module-level instance for convenience
export const cssGenerator = new CSSGenerator();
