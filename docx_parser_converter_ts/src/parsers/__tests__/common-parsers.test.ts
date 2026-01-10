/**
 * Unit tests for common parsers (color, border, shading, width, spacing, indentation).
 *
 * Matches Python: tests/unit/parsers/test_common_parsers.py
 */

import { describe, it, expect } from 'vitest';

import { makeElement } from '../../__tests__/helpers/test-utils';
import {
  parseBorder,
  parseParagraphBorders,
  parseTableBorders,
} from '../common/border-parser';
import { parseColor } from '../common/color-parser';
import { parseIndentation } from '../common/indentation-parser';
import { parseShading } from '../common/shading-parser';
import { parseSpacing } from '../common/spacing-parser';
import { parseWidth } from '../common/width-parser';

// =============================================================================
// Color Parser Tests (<w:color>)
// =============================================================================

describe('Color Parser', () => {
  it('returns null for null input', () => {
    const result = parseColor(null);
    expect(result).toBeNull();
  });

  it('parses color with val only (hex color)', () => {
    const elem = makeElement('<w:color w:val="FF0000"/>');
    const result = parseColor(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('FF0000');
    expect(result!.themeColor).toBeNull();
  });

  it('parses color with val=auto', () => {
    const elem = makeElement('<w:color w:val="auto"/>');
    const result = parseColor(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('auto');
  });

  it('parses color with theme color reference', () => {
    const elem = makeElement('<w:color w:themeColor="accent1"/>');
    const result = parseColor(elem);
    expect(result).not.toBeNull();
    expect(result!.themeColor).toBe('accent1');
  });

  it('parses color with theme color and tint', () => {
    const elem = makeElement(
      '<w:color w:val="5B9BD5" w:themeColor="accent1" w:themeTint="80"/>'
    );
    const result = parseColor(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('5B9BD5');
    expect(result!.themeColor).toBe('accent1');
    expect(result!.themeTint).toBe('80');
    expect(result!.themeShade).toBeNull();
  });

  it('parses color with theme color and shade', () => {
    const elem = makeElement(
      '<w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/>'
    );
    const result = parseColor(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('2F5496');
    expect(result!.themeColor).toBe('accent1');
    expect(result!.themeShade).toBe('BF');
  });

  it('parses all theme colors', () => {
    const themeColors = [
      'dark1',
      'light1',
      'dark2',
      'light2',
      'accent1',
      'accent2',
      'accent3',
      'accent4',
      'accent5',
      'accent6',
      'hyperlink',
      'followedHyperlink',
    ];
    for (const tc of themeColors) {
      const elem = makeElement(`<w:color w:themeColor="${tc}"/>`);
      const result = parseColor(elem);
      expect(result).not.toBeNull();
      expect(result!.themeColor).toBe(tc);
    }
  });
});

// =============================================================================
// Border Parser Tests (<w:top>, <w:left>, <w:bottom>, <w:right>, etc.)
// =============================================================================

describe('Border Parser', () => {
  it('returns null for null input', () => {
    const result = parseBorder(null);
    expect(result).toBeNull();
  });

  it('parses border with minimal attributes', () => {
    const elem = makeElement('<w:top w:val="single"/>');
    const result = parseBorder(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('single');
  });

  it('parses border with all attributes', () => {
    const elem = makeElement(
      '<w:top w:val="single" w:sz="12" w:space="4" w:color="FF0000" ' +
        'w:themeColor="accent1" w:themeTint="80" w:themeShade="BF" ' +
        'w:frame="1" w:shadow="1"/>'
    );
    const result = parseBorder(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('single');
    expect(result!.sz).toBe(12);
    expect(result!.space).toBe(4);
    expect(result!.color).toBe('FF0000');
    expect(result!.themeColor).toBe('accent1');
    expect(result!.themeTint).toBe('80');
    expect(result!.themeShade).toBe('BF');
    expect(result!.frame).toBe(true);
    expect(result!.shadow).toBe(true);
  });

  it('parses various border styles', () => {
    const borderStyles = [
      'nil',
      'none',
      'single',
      'thick',
      'double',
      'dotted',
      'dashed',
      'dotDash',
      'dotDotDash',
      'triple',
      'wave',
      'doubleWave',
    ];
    for (const style of borderStyles) {
      const elem = makeElement(`<w:top w:val="${style}"/>`);
      const result = parseBorder(elem);
      expect(result).not.toBeNull();
      expect(result!.val).toBe(style);
    }
  });

  it('parses border with frame explicitly false', () => {
    const elem = makeElement('<w:top w:val="single" w:frame="0"/>');
    const result = parseBorder(elem);
    expect(result).not.toBeNull();
    expect(result!.frame).toBe(false);
  });

  it('parses border with shadow explicitly false', () => {
    const elem = makeElement('<w:top w:val="single" w:shadow="false"/>');
    const result = parseBorder(elem);
    expect(result).not.toBeNull();
    expect(result!.shadow).toBe(false);
  });
});

// =============================================================================
// Paragraph Borders Parser Tests (<w:pBdr>)
// =============================================================================

describe('Paragraph Borders Parser', () => {
  it('returns null for null input', () => {
    const result = parseParagraphBorders(null);
    expect(result).toBeNull();
  });

  it('parses empty pBdr element', () => {
    const elem = makeElement('<w:pBdr/>');
    const result = parseParagraphBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.top).toBeNull();
    expect(result!.left).toBeNull();
    expect(result!.bottom).toBeNull();
    expect(result!.right).toBeNull();
  });

  it('parses pBdr with all four sides', () => {
    const elem = makeElement(`
      <w:pBdr>
        <w:top w:val="single" w:sz="4" w:space="1" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="4" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="4" w:color="000000"/>
      </w:pBdr>
    `);
    const result = parseParagraphBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.top).not.toBeNull();
    expect(result!.top!.val).toBe('single');
    expect(result!.left).not.toBeNull();
    expect(result!.bottom).not.toBeNull();
    expect(result!.right).not.toBeNull();
  });

  it('parses pBdr with between border', () => {
    const elem = makeElement(`
      <w:pBdr>
        <w:between w:val="single" w:sz="4" w:space="1" w:color="000000"/>
      </w:pBdr>
    `);
    const result = parseParagraphBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.between).not.toBeNull();
    expect(result!.between!.val).toBe('single');
  });

  it('parses pBdr with bar border', () => {
    const elem = makeElement(`
      <w:pBdr>
        <w:bar w:val="single" w:sz="4" w:color="FF0000"/>
      </w:pBdr>
    `);
    const result = parseParagraphBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.bar).not.toBeNull();
    expect(result!.bar!.val).toBe('single');
  });
});

// =============================================================================
// Table Borders Parser Tests (<w:tblBorders>, <w:tcBorders>)
// =============================================================================

describe('Table Borders Parser', () => {
  it('returns null for null input', () => {
    const result = parseTableBorders(null);
    expect(result).toBeNull();
  });

  it('parses empty tblBorders element', () => {
    const elem = makeElement('<w:tblBorders/>');
    const result = parseTableBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.top).toBeNull();
    expect(result!.insideH).toBeNull();
  });

  it('parses tblBorders with all sides including inside borders', () => {
    const elem = makeElement(`
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
    `);
    const result = parseTableBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.top).not.toBeNull();
    expect(result!.left).not.toBeNull();
    expect(result!.bottom).not.toBeNull();
    expect(result!.right).not.toBeNull();
    expect(result!.insideH).not.toBeNull();
    expect(result!.insideH!.val).toBe('single');
    expect(result!.insideV).not.toBeNull();
  });

  it('parses table borders with diagonal borders', () => {
    const elem = makeElement(`
      <w:tcBorders>
        <w:tl2br w:val="single" w:sz="4" w:color="FF0000"/>
        <w:tr2bl w:val="single" w:sz="4" w:color="0000FF"/>
      </w:tcBorders>
    `);
    const result = parseTableBorders(elem);
    expect(result).not.toBeNull();
    expect(result!.tl2br).not.toBeNull();
    expect(result!.tl2br!.color).toBe('FF0000');
    expect(result!.tr2bl).not.toBeNull();
    expect(result!.tr2bl!.color).toBe('0000FF');
  });
});

// =============================================================================
// Shading Parser Tests (<w:shd>)
// =============================================================================

describe('Shading Parser', () => {
  it('returns null for null input', () => {
    const result = parseShading(null);
    expect(result).toBeNull();
  });

  it('parses shading with clear pattern and fill color', () => {
    const elem = makeElement('<w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>');
    const result = parseShading(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('clear');
    expect(result!.color).toBe('auto');
    expect(result!.fill).toBe('FFFF00');
  });

  it('parses solid shading', () => {
    const elem = makeElement('<w:shd w:val="solid" w:color="FF0000"/>');
    const result = parseShading(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('solid');
    expect(result!.color).toBe('FF0000');
  });

  it('parses various shading patterns', () => {
    const patterns = [
      'clear',
      'solid',
      'horzStripe',
      'vertStripe',
      'reverseDiagStripe',
      'diagStripe',
      'horzCross',
      'diagCross',
      'pct10',
      'pct25',
      'pct50',
    ];
    for (const pattern of patterns) {
      const elem = makeElement(`<w:shd w:val="${pattern}" w:fill="FFFFFF"/>`);
      const result = parseShading(elem);
      expect(result).not.toBeNull();
      expect(result!.val).toBe(pattern);
    }
  });

  it('parses shading with theme fill', () => {
    const elem = makeElement(
      '<w:shd w:val="clear" w:color="auto" w:fill="5B9BD5" ' +
        'w:themeFill="accent1" w:themeFillTint="80"/>'
    );
    const result = parseShading(elem);
    expect(result).not.toBeNull();
    expect(result!.themeFill).toBe('accent1');
    expect(result!.themeFillTint).toBe('80');
  });

  it('parses shading with all attributes', () => {
    const elem = makeElement(
      '<w:shd w:val="pct25" w:color="FF0000" w:fill="0000FF" ' +
        'w:themeColor="accent1" w:themeFill="accent2" ' +
        'w:themeTint="80" w:themeShade="BF" ' +
        'w:themeFillTint="60" w:themeFillShade="A0"/>'
    );
    const result = parseShading(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('pct25');
    expect(result!.color).toBe('FF0000');
    expect(result!.fill).toBe('0000FF');
    expect(result!.themeColor).toBe('accent1');
    expect(result!.themeFill).toBe('accent2');
    expect(result!.themeTint).toBe('80');
    expect(result!.themeShade).toBe('BF');
    expect(result!.themeFillTint).toBe('60');
    expect(result!.themeFillShade).toBe('A0');
  });
});

// =============================================================================
// Width Parser Tests (<w:tcW>, <w:tblW>, <w:tblInd>)
// =============================================================================

describe('Width Parser', () => {
  it('returns null for null input', () => {
    const result = parseWidth(null);
    expect(result).toBeNull();
  });

  it('parses width in twips (dxa)', () => {
    const elem = makeElement('<w:tcW w:w="2880" w:type="dxa"/>');
    const result = parseWidth(elem);
    expect(result).not.toBeNull();
    expect(result!.w).toBe(2880);
    expect(result!.type).toBe('dxa');
  });

  it('parses width as percentage', () => {
    const elem = makeElement('<w:tblW w:w="5000" w:type="pct"/>');
    const result = parseWidth(elem);
    expect(result).not.toBeNull();
    expect(result!.w).toBe(5000);
    expect(result!.type).toBe('pct');
  });

  it('parses auto width', () => {
    const elem = makeElement('<w:tcW w:w="0" w:type="auto"/>');
    const result = parseWidth(elem);
    expect(result).not.toBeNull();
    expect(result!.w).toBe(0);
    expect(result!.type).toBe('auto');
  });

  it('parses nil width', () => {
    const elem = makeElement('<w:tcW w:w="0" w:type="nil"/>');
    const result = parseWidth(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('nil');
  });

  it('parses all width types', () => {
    const widthTypes = ['dxa', 'pct', 'auto', 'nil'];
    for (const wtype of widthTypes) {
      const elem = makeElement(`<w:tcW w:w="100" w:type="${wtype}"/>`);
      const result = parseWidth(elem);
      expect(result).not.toBeNull();
      expect(result!.type).toBe(wtype);
    }
  });
});

// =============================================================================
// Spacing Parser Tests (<w:spacing>)
// =============================================================================

describe('Spacing Parser', () => {
  it('returns null for null input', () => {
    const result = parseSpacing(null);
    expect(result).toBeNull();
  });

  it('parses spacing with before and after values', () => {
    const elem = makeElement('<w:spacing w:before="240" w:after="120"/>');
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.before).toBe(240);
    expect(result!.after).toBe(120);
  });

  it('parses spacing with auto line spacing', () => {
    const elem = makeElement('<w:spacing w:line="276" w:lineRule="auto"/>');
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.line).toBe(276);
    expect(result!.lineRule).toBe('auto');
  });

  it('parses spacing with exact line spacing', () => {
    const elem = makeElement('<w:spacing w:line="240" w:lineRule="exact"/>');
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.line).toBe(240);
    expect(result!.lineRule).toBe('exact');
  });

  it('parses spacing with atLeast line spacing', () => {
    const elem = makeElement('<w:spacing w:line="360" w:lineRule="atLeast"/>');
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.lineRule).toBe('atLeast');
  });

  it('parses spacing with beforeLines and afterLines', () => {
    const elem = makeElement('<w:spacing w:beforeLines="100" w:afterLines="100"/>');
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.beforeLines).toBe(100);
    expect(result!.afterLines).toBe(100);
  });

  it('parses spacing with autospacing enabled', () => {
    const elem = makeElement(
      '<w:spacing w:beforeAutospacing="1" w:afterAutospacing="1"/>'
    );
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.beforeAutospacing).toBe(true);
    expect(result!.afterAutospacing).toBe(true);
  });

  it('parses spacing with autospacing disabled', () => {
    const elem = makeElement(
      '<w:spacing w:beforeAutospacing="0" w:afterAutospacing="0"/>'
    );
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.beforeAutospacing).toBe(false);
    expect(result!.afterAutospacing).toBe(false);
  });

  it('parses spacing with all attributes', () => {
    const elem = makeElement(
      '<w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto" ' +
        'w:beforeLines="100" w:afterLines="50" ' +
        'w:beforeAutospacing="0" w:afterAutospacing="0"/>'
    );
    const result = parseSpacing(elem);
    expect(result).not.toBeNull();
    expect(result!.before).toBe(240);
    expect(result!.after).toBe(120);
    expect(result!.line).toBe(276);
    expect(result!.lineRule).toBe('auto');
    expect(result!.beforeLines).toBe(100);
    expect(result!.afterLines).toBe(50);
    expect(result!.beforeAutospacing).toBe(false);
    expect(result!.afterAutospacing).toBe(false);
  });
});

// =============================================================================
// Indentation Parser Tests (<w:ind>)
// =============================================================================

describe('Indentation Parser', () => {
  it('returns null for null input', () => {
    const result = parseIndentation(null);
    expect(result).toBeNull();
  });

  it('parses indentation with left and right values', () => {
    const elem = makeElement('<w:ind w:left="720" w:right="360"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(720);
    expect(result!.right).toBe(360);
  });

  it('parses indentation with first line indent', () => {
    const elem = makeElement('<w:ind w:left="720" w:firstLine="360"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(720);
    expect(result!.firstLine).toBe(360);
    expect(result!.hanging).toBeNull();
  });

  it('parses indentation with hanging indent', () => {
    const elem = makeElement('<w:ind w:left="720" w:hanging="360"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(720);
    expect(result!.hanging).toBe(360);
    expect(result!.firstLine).toBeNull();
  });

  it('parses indentation with start and end (bidi support)', () => {
    const elem = makeElement('<w:ind w:start="720" w:end="360"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.start).toBe(720);
    expect(result!.end).toBe(360);
  });

  it('parses indentation with character-based values', () => {
    const elem = makeElement(
      '<w:ind w:startChars="100" w:endChars="50" ' +
        'w:firstLineChars="200" w:hangingChars="150"/>'
    );
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.startChars).toBe(100);
    expect(result!.endChars).toBe(50);
    expect(result!.firstLineChars).toBe(200);
    expect(result!.hangingChars).toBe(150);
  });

  it('parses indentation with all attributes', () => {
    const elem = makeElement(
      '<w:ind w:left="720" w:right="360" w:start="720" w:end="360" ' +
        'w:firstLine="360" w:hanging="180" ' +
        'w:startChars="100" w:endChars="50" ' +
        'w:firstLineChars="50" w:hangingChars="25"/>'
    );
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(720);
    expect(result!.right).toBe(360);
    expect(result!.start).toBe(720);
    expect(result!.end).toBe(360);
    expect(result!.firstLine).toBe(360);
    expect(result!.hanging).toBe(180);
    expect(result!.startChars).toBe(100);
    expect(result!.endChars).toBe(50);
    expect(result!.firstLineChars).toBe(50);
    expect(result!.hangingChars).toBe(25);
  });

  it('parses indentation with zero values', () => {
    const elem = makeElement('<w:ind w:left="0" w:right="0" w:firstLine="0"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(0);
    expect(result!.right).toBe(0);
    expect(result!.firstLine).toBe(0);
  });

  it('parses indentation with negative values (outdent)', () => {
    const elem = makeElement('<w:ind w:left="-720"/>');
    const result = parseIndentation(elem);
    expect(result).not.toBeNull();
    expect(result!.left).toBe(-720);
  });
});
