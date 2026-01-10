/**
 * Unit tests for CSS generator.
 *
 * Tests conversion of DOCX properties to CSS styles.
 * Matches Python: tests/unit/converters/html/test_css_generator.py
 */

import { describe, it, expect } from 'vitest';
import {
  CSSGenerator,
  borderToCss,
  cellMarginsToCss,
  cellVerticalAlignToCss,
  colorToCss,
  eighthsToPt,
  emuToPx,
  fontFamilyToCss,
  fontSizeToCss,
  halfPointsToPt,
  highlightToCss,
  paragraphBordersToCss,
  paragraphPropertiesToCss,
  runPropertiesToCss,
  shadingToCss,
  twipsToPt,
  twipsToPx,
  widthToCss,
} from '../css-generator';
import type { Color } from '../../../models/common/color';
import type { Border, ParagraphBorders } from '../../../models/common/border';
import type { Shading } from '../../../models/common/shading';
import type { Spacing } from '../../../models/common/spacing';
import type { Indentation } from '../../../models/common/indentation';
import type { Width } from '../../../models/common/width';
import type { RunFonts, RunProperties } from '../../../models/document/run';
import type { ParagraphProperties } from '../../../models/document/paragraph';
import type { TableCellMargins } from '../../../models/document/table';

// =============================================================================
// Color to CSS Tests
// =============================================================================

describe('Color to CSS', () => {
  it('should convert hex color to CSS', () => {
    const color: Color = { val: 'FF0000' };
    const result = colorToCss(color);
    expect(result).toBe('#FF0000');
  });

  it('should convert lowercase hex color to CSS', () => {
    const color: Color = { val: 'ff0000' };
    const result = colorToCss(color);
    expect(result).toBe('#FF0000');
  });

  it('should return null for auto color', () => {
    const color: Color = { val: 'auto' };
    const result = colorToCss(color);
    expect(result).toBeNull();
  });

  it('should return null for null color', () => {
    const result = colorToCss(null);
    expect(result).toBeNull();
  });

  it('should return null for theme color (needs theme resolution)', () => {
    const color: Color = { themeColor: 'accent1' };
    const result = colorToCss(color);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Font Properties to CSS Tests
// =============================================================================

describe('Font to CSS', () => {
  it('should convert ASCII font to CSS font-family', () => {
    const rFonts: RunFonts = { ascii: 'Arial' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe('Arial');
  });

  it('should quote font names with spaces using single quotes', () => {
    const rFonts: RunFonts = { ascii: 'Times New Roman' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe("'Times New Roman'");
  });

  it('should convert font size in half-points to pt', () => {
    // Half-points: 24 = 12pt, 32 = 16pt
    const result = fontSizeToCss(24);
    expect(result).toBe('12pt');
  });

  it('should handle odd half-point sizes', () => {
    const result = fontSizeToCss(25);
    expect(result).toBe('12.5pt');
  });

  it('should return null for null font size', () => {
    const result = fontSizeToCss(null);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Run Properties to CSS Tests
// =============================================================================

describe('Run Properties to CSS', () => {
  it('should convert bold to font-weight', () => {
    const rPr: RunProperties = { b: true };
    const result = runPropertiesToCss(rPr);
    expect(result['font-weight']).toBe('bold');
  });

  it('should convert explicit bold=false to normal', () => {
    const rPr: RunProperties = { b: false };
    const result = runPropertiesToCss(rPr);
    expect(result['font-weight']).toBe('normal');
  });

  it('should convert italic to font-style', () => {
    const rPr: RunProperties = { i: true };
    const result = runPropertiesToCss(rPr);
    expect(result['font-style']).toBe('italic');
  });

  it('should convert single underline to text-decoration', () => {
    const rPr: RunProperties = { u: { val: 'single' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
  });

  it('should convert double underline to text-decoration', () => {
    const rPr: RunProperties = { u: { val: 'double' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
  });

  it('should not add text-decoration for underline=none', () => {
    const rPr: RunProperties = { u: { val: 'none' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeUndefined();
  });

  it('should handle underline with color', () => {
    const rPr: RunProperties = { u: { val: 'single', color: 'FF0000' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration-color']).toBe('#FF0000');
  });

  it('should normalize underline color to uppercase hex', () => {
    const rPr: RunProperties = { u: { val: 'single', color: 'aabbcc' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration-color']).toBe('#AABBCC');
  });

  it('should not set text-decoration-color for auto underline color', () => {
    const rPr: RunProperties = { u: { val: 'single', color: 'auto' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration-color']).toBeUndefined();
  });

  it('should add thickness for thick underline', () => {
    const rPr: RunProperties = { u: { val: 'thick' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration-thickness']).toBe('2.5px');
  });

  it('should add thickness for wavyHeavy underline', () => {
    const rPr: RunProperties = { u: { val: 'wavyHeavy' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('wavy');
    expect(result['text-decoration-thickness']).toBe('2.5px');
  });

  it('should handle underline with color, style, and thickness', () => {
    const rPr: RunProperties = { u: { val: 'wavyHeavy', color: '0000FF' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('wavy');
    expect(result['text-decoration-thickness']).toBe('2.5px');
    expect(result['text-decoration-color']).toBe('#0000FF');
  });

  it('should convert strikethrough to text-decoration', () => {
    const rPr: RunProperties = { strike: true };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('line-through');
  });

  it('should convert double strikethrough', () => {
    const rPr: RunProperties = { dstrike: true };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('line-through');
  });

  it('should combine underline and strikethrough', () => {
    const rPr: RunProperties = { u: { val: 'single' }, strike: true };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('line-through');
  });

  it('should convert all caps to text-transform', () => {
    const rPr: RunProperties = { caps: true };
    const result = runPropertiesToCss(rPr);
    expect(result['text-transform']).toBe('uppercase');
  });

  it('should convert small caps to font-variant', () => {
    const rPr: RunProperties = { smallCaps: true };
    const result = runPropertiesToCss(rPr);
    expect(result['font-variant']).toBe('small-caps');
  });

  it('should convert superscript vertical alignment', () => {
    const rPr: RunProperties = { vertAlign: 'superscript' };
    const result = runPropertiesToCss(rPr);
    expect(result['vertical-align']).toBe('super');
  });

  it('should convert subscript vertical alignment', () => {
    const rPr: RunProperties = { vertAlign: 'subscript' };
    const result = runPropertiesToCss(rPr);
    expect(result['vertical-align']).toBe('sub');
  });

  it('should convert text color', () => {
    const rPr: RunProperties = { color: { val: '0000FF' } };
    const result = runPropertiesToCss(rPr);
    expect(result['color']).toBe('#0000FF');
  });

  it('should convert highlight color to background-color', () => {
    const rPr: RunProperties = { highlight: 'yellow' };
    const result = runPropertiesToCss(rPr);
    expect(result['background-color']).toBeDefined();
  });

  it('should convert character spacing', () => {
    const rPr: RunProperties = { spacing: 20 }; // 20 twips = 1pt
    const result = runPropertiesToCss(rPr);
    expect(result['letter-spacing']).toBeDefined();
    expect(result['letter-spacing']).toContain('1');
    expect(result['letter-spacing']).toContain('pt');
  });

  it('should convert hidden text (vanish)', () => {
    const rPr: RunProperties = { vanish: true };
    const result = runPropertiesToCss(rPr);
    expect(result['display']).toBe('none');
  });

  it('should return empty dict for empty properties', () => {
    const rPr: RunProperties = {};
    const result = runPropertiesToCss(rPr);
    expect(result).toEqual({});
  });

  it('should return empty dict for null properties', () => {
    const result = runPropertiesToCss(null);
    expect(result).toEqual({});
  });
});

// =============================================================================
// Paragraph Properties to CSS Tests
// =============================================================================

describe('Paragraph Properties to CSS', () => {
  it('should convert left justification', () => {
    const pPr: ParagraphProperties = { jc: 'left' };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-align']).toBe('left');
  });

  it('should convert center justification', () => {
    const pPr: ParagraphProperties = { jc: 'center' };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-align']).toBe('center');
  });

  it('should convert right justification', () => {
    const pPr: ParagraphProperties = { jc: 'right' };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-align']).toBe('right');
  });

  it('should convert both justification to justify', () => {
    const pPr: ParagraphProperties = { jc: 'both' };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-align']).toBe('justify');
  });

  it('should convert space before to margin-top', () => {
    const spacing: Spacing = { before: 240 }; // 240 twips = 12pt
    const pPr: ParagraphProperties = { spacing };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-top']).toBeDefined();
    expect(result['margin-top']).toContain('12pt');
  });

  it('should convert space after to margin-bottom', () => {
    const spacing: Spacing = { after: 240 };
    const pPr: ParagraphProperties = { spacing };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-bottom']).toBeDefined();
  });

  it('should convert auto line spacing', () => {
    const spacing: Spacing = { line: 276, lineRule: 'auto' }; // 276/240 = 1.15
    const pPr: ParagraphProperties = { spacing };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['line-height']).toBeDefined();
  });

  it('should convert exact line height', () => {
    const spacing: Spacing = { line: 360, lineRule: 'exact' }; // 18pt
    const pPr: ParagraphProperties = { spacing };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['line-height']).toBeDefined();
  });

  it('should convert left indentation', () => {
    const ind: Indentation = { left: 720 }; // 720 twips = 36pt
    const pPr: ParagraphProperties = { ind };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-left']).toBeDefined();
  });

  it('should convert right indentation', () => {
    const ind: Indentation = { right: 720 };
    const pPr: ParagraphProperties = { ind };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-right']).toBeDefined();
  });

  it('should convert first line indentation', () => {
    const ind: Indentation = { firstLine: 720 };
    const pPr: ParagraphProperties = { ind };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-indent']).toBeDefined();
  });

  it('should convert hanging indentation to negative text-indent', () => {
    const ind: Indentation = { hanging: 720 };
    const pPr: ParagraphProperties = { ind };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['text-indent']).toBeDefined();
    expect(result['text-indent'].startsWith('-')).toBe(true);
  });

  it('should convert page break before', () => {
    const pPr: ParagraphProperties = { pageBreakBefore: true };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['page-break-before']).toBe('always');
  });

  it('should convert keep with next', () => {
    const pPr: ParagraphProperties = { keepNext: true };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['page-break-after']).toBe('avoid');
  });

  it('should convert keep lines together', () => {
    const pPr: ParagraphProperties = { keepLines: true };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['page-break-inside']).toBe('avoid');
  });

  it('should convert RTL direction', () => {
    const pPr: ParagraphProperties = { bidi: true };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['direction']).toBe('rtl');
  });
});

// =============================================================================
// Border to CSS Tests
// =============================================================================

describe('Border to CSS', () => {
  it('should convert single border', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('solid');
    expect(result).toContain('#000000');
  });

  it('should convert double border', () => {
    const border: Border = { val: 'double', sz: 8, color: '000000' };
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('double');
  });

  it('should convert dashed border', () => {
    const border: Border = { val: 'dashed', sz: 8, color: '000000' };
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('dashed');
  });

  it('should convert dotted border', () => {
    const border: Border = { val: 'dotted', sz: 8, color: '000000' };
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('dotted');
  });

  it('should convert nil border to none', () => {
    const border: Border = { val: 'nil' };
    const result = borderToCss(border);
    expect(result).toBe('none');
  });

  it('should convert border size in eighths of a point', () => {
    const border: Border = { val: 'single', sz: 16, color: '000000' }; // 2pt
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('2');
    expect(result).toContain('pt');
  });

  it('should use black for auto color border', () => {
    const border: Border = { val: 'single', sz: 8, color: 'auto' };
    const result = borderToCss(border);
    expect(result).not.toBeNull();
    expect(result).toContain('#000000');
  });

  it('should convert all paragraph borders', () => {
    const pBdr: ParagraphBorders = {
      top: { val: 'single', sz: 8, color: '000000' },
      bottom: { val: 'single', sz: 8, color: '000000' },
      left: { val: 'single', sz: 8, color: '000000' },
      right: { val: 'single', sz: 8, color: '000000' },
    };
    const result = paragraphBordersToCss(pBdr);
    expect(result['border-top']).toBeDefined();
    expect(result['border-bottom']).toBeDefined();
    expect(result['border-left']).toBeDefined();
    expect(result['border-right']).toBeDefined();
  });

  it('should convert partial paragraph borders', () => {
    const pBdr: ParagraphBorders = {
      top: { val: 'single', sz: 8, color: '000000' },
      bottom: { val: 'single', sz: 8, color: '000000' },
    };
    const result = paragraphBordersToCss(pBdr);
    expect(result['border-top']).toBeDefined();
    expect(result['border-bottom']).toBeDefined();
    expect(result['border-left']).toBeUndefined();
    expect(result['border-right']).toBeUndefined();
  });
});

// =============================================================================
// Shading to CSS Tests
// =============================================================================

describe('Shading to CSS', () => {
  it('should convert solid fill shading', () => {
    const shd: Shading = { val: 'clear', fill: 'FFFF00' };
    const result = shadingToCss(shd);
    expect(result).toBe('#FFFF00');
  });

  it('should return value for pattern shading', () => {
    const shd: Shading = { val: 'pct25', fill: 'FFFFFF', color: '000000' };
    const result = shadingToCss(shd);
    expect(result).not.toBeNull();
  });

  it('should return null for no fill', () => {
    const shd: Shading = { val: 'clear' };
    const result = shadingToCss(shd);
    expect(result).toBeNull();
  });

  it('should return null for null shading', () => {
    const result = shadingToCss(null);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Unit Conversion Tests
// =============================================================================

describe('Unit Conversion', () => {
  it('should convert twips to points', () => {
    expect(twipsToPt(20)).toBe(1.0);
    expect(twipsToPt(240)).toBe(12.0);
  });

  it('should convert twips to pixels', () => {
    const result = twipsToPx(1440); // 1 inch at 96 dpi = 96 px
    expect(result).toBe(96.0);
  });

  it('should convert half-points to points', () => {
    expect(halfPointsToPt(24)).toBe(12.0);
    expect(halfPointsToPt(25)).toBe(12.5);
  });

  it('should convert eighths to points', () => {
    expect(eighthsToPt(8)).toBe(1.0);
    expect(eighthsToPt(16)).toBe(2.0);
  });

  it('should convert EMUs to pixels', () => {
    // 9525 EMUs = 1 pixel at 96 DPI
    const result = emuToPx(9525);
    expect(result).toBe(1.0);
  });
});

// =============================================================================
// CSS Generator Class Tests
// =============================================================================

describe('CSSGenerator Class', () => {
  it('should initialize with default settings', () => {
    const css = new CSSGenerator();
    expect(css).not.toBeNull();
  });

  it('should initialize with custom options', () => {
    const css = new CSSGenerator({ usePx: true, dpi: 72 });
    expect(css.usePx).toBe(true);
    expect(css.dpi).toBe(72);
  });

  it('should generate inline style string', () => {
    const css = new CSSGenerator();
    const props = { 'font-weight': 'bold', color: '#FF0000' };
    const result = css.generateInlineStyle(props);
    expect(result).toContain('font-weight: bold');
    expect(result).toContain('color: #FF0000');
  });

  it('should generate style attribute for HTML element', () => {
    const css = new CSSGenerator();
    const props = { 'font-weight': 'bold' };
    const result = css.generateStyleAttribute(props);
    expect(result).toBe('style="font-weight: bold"');
  });

  it('should return empty string for empty props', () => {
    const css = new CSSGenerator();
    const result = css.generateInlineStyle({});
    expect(result).toBe('');
  });

  it('should merge CSS properties', () => {
    const props1 = { 'font-weight': 'bold' };
    const props2 = { color: '#FF0000' };
    const result = CSSGenerator.mergeCss(props1, props2);
    expect(result['font-weight']).toBe('bold');
    expect(result['color']).toBe('#FF0000');
  });

  it('should override properties in merge', () => {
    const props1 = { 'font-weight': 'normal' };
    const props2 = { 'font-weight': 'bold' };
    const result = CSSGenerator.mergeCss(props1, props2);
    expect(result['font-weight']).toBe('bold');
  });
});

// =============================================================================
// Highlight Color Mapping Tests
// =============================================================================

describe('Highlight Color Mapping', () => {
  it('should convert yellow highlight', () => {
    const result = highlightToCss('yellow');
    expect(result).toBe('#FFFF00');
  });

  it('should convert green highlight', () => {
    const result = highlightToCss('green');
    expect(result).toBe('#00FF00');
  });

  it('should convert cyan highlight', () => {
    const result = highlightToCss('cyan');
    expect(result).toBe('#00FFFF');
  });

  it('should convert magenta highlight', () => {
    const result = highlightToCss('magenta');
    expect(result).toBe('#FF00FF');
  });

  it('should convert blue highlight', () => {
    const result = highlightToCss('blue');
    expect(result).toBe('#0000FF');
  });

  it('should convert red highlight', () => {
    const result = highlightToCss('red');
    expect(result).toBe('#FF0000');
  });

  it('should convert dark highlight colors', () => {
    for (const color of ['darkBlue', 'darkCyan', 'darkGreen', 'darkMagenta', 'darkRed', 'darkYellow']) {
      const result = highlightToCss(color);
      expect(result).not.toBeNull();
    }
  });

  it('should convert lightGray highlight', () => {
    const result = highlightToCss('lightGray');
    expect(result).toBe('#D3D3D3');
  });

  it('should convert darkGray highlight', () => {
    const result = highlightToCss('darkGray');
    expect(result).toBe('#A9A9A9');
  });

  it('should convert black highlight', () => {
    const result = highlightToCss('black');
    expect(result).toBe('#000000');
  });

  it('should convert white highlight', () => {
    const result = highlightToCss('white');
    expect(result).toBe('#FFFFFF');
  });

  it('should return null for none highlight', () => {
    const result = highlightToCss('none');
    expect(result).toBeNull();
  });

  it('should return null for unknown highlight', () => {
    const result = highlightToCss('unknown');
    expect(result).toBeNull();
  });
});

// =============================================================================
// Table CSS Tests
// =============================================================================

describe('Table CSS', () => {
  it('should convert auto table width', () => {
    const width: Width = { w: 0, type: 'auto' };
    const result = widthToCss(width);
    expect(result).toBe('auto');
  });

  it('should convert percentage table width', () => {
    const width: Width = { w: 5000, type: 'pct' }; // 100%
    const result = widthToCss(width);
    expect(result).toBe('100%');
  });

  it('should convert DXA (twips) table width', () => {
    const width: Width = { w: 2880, type: 'dxa' }; // 144pt
    const result = widthToCss(width);
    expect(result).toBe('144pt');
  });

  it('should convert cell vertical align top', () => {
    const result = cellVerticalAlignToCss('top');
    expect(result).toBe('top');
  });

  it('should convert cell vertical align center to middle', () => {
    const result = cellVerticalAlignToCss('center');
    expect(result).toBe('middle');
  });

  it('should convert cell vertical align bottom', () => {
    const result = cellVerticalAlignToCss('bottom');
    expect(result).toBe('bottom');
  });

  it('should convert table cell margins to padding', () => {
    const margins: TableCellMargins = {
      top: { w: 72, type: 'dxa' },
      left: { w: 115, type: 'dxa' },
      bottom: { w: 72, type: 'dxa' },
      right: { w: 115, type: 'dxa' },
    };
    const result = cellMarginsToCss(margins);
    expect(result['padding-top']).toBeDefined();
    expect(result['padding-left']).toBeDefined();
    expect(result['padding-bottom']).toBeDefined();
    expect(result['padding-right']).toBeDefined();
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('CSS Edge Cases', () => {
  it('should handle null values', () => {
    const result = runPropertiesToCss(null);
    expect(result).toEqual({});
  });

  it('should handle very large font sizes', () => {
    const result = halfPointsToPt(1000); // 500pt
    expect(result).toBe(500.0);
  });

  it('should handle zero spacing values', () => {
    const spacing: Spacing = { before: 0, after: 0 };
    const pPr: ParagraphProperties = { spacing };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-top']).toBeDefined();
    expect(result['margin-top']).toContain('0pt');
  });

  it('should handle negative indentation values', () => {
    const ind: Indentation = { left: -720 }; // Negative left indent
    const pPr: ParagraphProperties = { ind };
    const result = paragraphPropertiesToCss(pPr);
    expect(result['margin-left']).toBeDefined();
    expect(result['margin-left']).toContain('-36pt');
  });
});

// =============================================================================
// Font Quoting Tests
// =============================================================================

describe('Font Quoting for HTML', () => {
  it('should not quote single-word font names', () => {
    const rFonts: RunFonts = { ascii: 'Arial' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe('Arial');
    expect(result).not.toContain("'");
    expect(result).not.toContain('"');
  });

  it('should use single quotes for multi-word font names', () => {
    const rFonts: RunFonts = { ascii: 'Times New Roman' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe("'Times New Roman'");
    expect(result?.startsWith("'")).toBe(true);
    expect(result?.endsWith("'")).toBe(true);
    expect(result).not.toContain('"');
  });

  it('should quote Courier New correctly', () => {
    const rFonts: RunFonts = { ascii: 'Courier New' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe("'Courier New'");
  });

  it('should quote Comic Sans MS correctly', () => {
    const rFonts: RunFonts = { ascii: 'Comic Sans MS' };
    const result = fontFamilyToCss(rFonts);
    expect(result).toBe("'Comic Sans MS'");
  });

  it('should work in HTML style attribute', () => {
    const rFonts: RunFonts = { ascii: 'Times New Roman' };
    const fontCss = fontFamilyToCss(rFonts);
    const styleAttr = `style="font-family: ${fontCss}; font-size: 12pt"`;
    // The attribute should be valid (no broken quotes)
    expect(styleAttr.split('"').length).toBe(3); // Opening, closing, and extra part
    expect(styleAttr).toContain("'Times New Roman'");
  });

  it('should generate valid CSS for RunProperties with spaced font', () => {
    const rPr: RunProperties = { rFonts: { ascii: 'Times New Roman' } };
    const result = runPropertiesToCss(rPr);
    expect(result['font-family']).toBeDefined();
    expect(result['font-family']).toBe("'Times New Roman'");
  });
});

// =============================================================================
// Underline Style Variants Tests
// =============================================================================

describe('Underline Style Variants', () => {
  it('should not add style for single underline (uses default solid)', () => {
    const rPr: RunProperties = { u: { val: 'single' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).not.toContain('double');
    expect(result['text-decoration']).not.toContain('wavy');
  });

  it('should generate double style for double underline', () => {
    const rPr: RunProperties = { u: { val: 'double' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('double');
  });

  it('should generate wavy style for wave underline', () => {
    const rPr: RunProperties = { u: { val: 'wave' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('wavy');
  });

  it('should generate dotted style for dotted underline', () => {
    const rPr: RunProperties = { u: { val: 'dotted' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('dotted');
  });

  it('should generate dashed style for dash underline', () => {
    const rPr: RunProperties = { u: { val: 'dash' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    expect(result['text-decoration']).toContain('dashed');
  });

  it('should use wavy style for wavyHeavy underline', () => {
    const rPr: RunProperties = { u: { val: 'wavyHeavy' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('wavy');
  });

  it('should use dotted style for dottedHeavy underline', () => {
    const rPr: RunProperties = { u: { val: 'dottedHeavy' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('dotted');
  });

  it('should use dashed style for dashLong underline', () => {
    const rPr: RunProperties = { u: { val: 'dashLong' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('dashed');
  });

  it('should use solid style for thick underline (no direct CSS equivalent)', () => {
    const rPr: RunProperties = { u: { val: 'thick' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
    const textDec = result['text-decoration'];
    expect(textDec).not.toContain('double');
    expect(textDec).not.toContain('wavy');
    expect(textDec).not.toContain('dotted');
    expect(textDec).not.toContain('dashed');
  });

  it('should use solid style for words underline', () => {
    const rPr: RunProperties = { u: { val: 'words' } };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    expect(result['text-decoration']).toContain('underline');
  });

  it('should handle underline with strikethrough and style', () => {
    const rPr: RunProperties = { u: { val: 'double' }, strike: true };
    const result = runPropertiesToCss(rPr);
    expect(result['text-decoration']).toBeDefined();
    const textDec = result['text-decoration'];
    expect(textDec).toContain('underline');
    expect(textDec).toContain('line-through');
    expect(textDec).toContain('double');
  });
});
