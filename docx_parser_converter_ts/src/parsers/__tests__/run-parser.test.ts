/**
 * Unit tests for run parsers.
 *
 * Matches Python: tests/unit/parsers/test_run_parser.py
 */

import { describe, it, expect } from 'vitest';

import { makeElement } from '../../__tests__/helpers/test-utils';
import {
  parseText,
  parseBreak,
  parseTabChar,
  parseCarriageReturn,
  parseSoftHyphen,
  parseNoBreakHyphen,
  parseSymbol,
  parseFieldChar,
  parseInstrText,
  parseRunContentItem,
} from '../document/run-content-parser';
import { parseRun } from '../document/run-parser';
import {
  parseRunFonts,
  parseLanguage,
  parseUnderline,
  parseRunProperties,
} from '../document/run-properties-parser';

// =============================================================================
// Text Parser Tests (<w:t>)
// =============================================================================

describe('Text Parser', () => {
  it('returns null for null input', () => {
    const result = parseText(null);
    expect(result).toBeNull();
  });

  it('parses simple text content', () => {
    const elem = makeElement('<w:t>Hello World</w:t>');
    const result = parseText(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('text');
    expect((result as any).value).toBe('Hello World');
    expect((result as any).space).toBeNull();
  });

  it('parses empty text element', () => {
    const elem = makeElement('<w:t></w:t>');
    const result = parseText(elem);
    expect(result).not.toBeNull();
    expect((result as any).value).toBe('');
  });

  it('parses text with xml:space="preserve"', () => {
    const elem = makeElement('<w:t xml:space="preserve">  spaces  </w:t>');
    const result = parseText(elem);
    expect(result).not.toBeNull();
    expect((result as any).value).toBe('  spaces  ');
    expect((result as any).space).toBe('preserve');
  });
});

// =============================================================================
// Break Parser Tests (<w:br>)
// =============================================================================

describe('Break Parser', () => {
  it('returns null for null input', () => {
    const result = parseBreak(null);
    expect(result).toBeNull();
  });

  it('parses line break', () => {
    const elem = makeElement('<w:br/>');
    const result = parseBreak(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('break');
    expect((result as any).breakType).toBeNull();
  });

  it('parses page break', () => {
    const elem = makeElement('<w:br w:type="page"/>');
    const result = parseBreak(elem);
    expect(result).not.toBeNull();
    expect((result as any).breakType).toBe('page');
  });

  it('parses column break', () => {
    const elem = makeElement('<w:br w:type="column"/>');
    const result = parseBreak(elem);
    expect(result).not.toBeNull();
    expect((result as any).breakType).toBe('column');
  });

  it('parses text wrapping break', () => {
    const elem = makeElement('<w:br w:type="textWrapping"/>');
    const result = parseBreak(elem);
    expect(result).not.toBeNull();
    expect((result as any).breakType).toBe('textWrapping');
  });

  it('parses break with clear attribute', () => {
    const elem = makeElement('<w:br w:type="textWrapping" w:clear="all"/>');
    const result = parseBreak(elem);
    expect(result).not.toBeNull();
    expect((result as any).breakType).toBe('textWrapping');
    expect((result as any).clear).toBe('all');
  });
});

// =============================================================================
// Tab Character Parser Tests (<w:tab>)
// =============================================================================

describe('Tab Character Parser', () => {
  it('returns null for null input', () => {
    const result = parseTabChar(null);
    expect(result).toBeNull();
  });

  it('parses tab character', () => {
    const elem = makeElement('<w:tab/>');
    const result = parseTabChar(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('tab');
  });
});

// =============================================================================
// Carriage Return Parser Tests (<w:cr>)
// =============================================================================

describe('Carriage Return Parser', () => {
  it('returns null for null input', () => {
    const result = parseCarriageReturn(null);
    expect(result).toBeNull();
  });

  it('parses carriage return', () => {
    const elem = makeElement('<w:cr/>');
    const result = parseCarriageReturn(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('cr');
  });
});

// =============================================================================
// Soft Hyphen Parser Tests (<w:softHyphen>)
// =============================================================================

describe('Soft Hyphen Parser', () => {
  it('returns null for null input', () => {
    const result = parseSoftHyphen(null);
    expect(result).toBeNull();
  });

  it('parses soft hyphen', () => {
    const elem = makeElement('<w:softHyphen/>');
    const result = parseSoftHyphen(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('softHyphen');
  });
});

// =============================================================================
// No-Break Hyphen Parser Tests (<w:noBreakHyphen>)
// =============================================================================

describe('No-Break Hyphen Parser', () => {
  it('returns null for null input', () => {
    const result = parseNoBreakHyphen(null);
    expect(result).toBeNull();
  });

  it('parses no-break hyphen', () => {
    const elem = makeElement('<w:noBreakHyphen/>');
    const result = parseNoBreakHyphen(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('noBreakHyphen');
  });
});

// =============================================================================
// Symbol Parser Tests (<w:sym>)
// =============================================================================

describe('Symbol Parser', () => {
  it('returns null for null input', () => {
    const result = parseSymbol(null);
    expect(result).toBeNull();
  });

  it('parses symbol with font and char', () => {
    const elem = makeElement('<w:sym w:font="Wingdings" w:char="F0FC"/>');
    const result = parseSymbol(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('symbol');
    expect((result as any).font).toBe('Wingdings');
    expect((result as any).char).toBe('F0FC');
  });

  it('parses symbol with only font', () => {
    const elem = makeElement('<w:sym w:font="Symbol"/>');
    const result = parseSymbol(elem);
    expect(result).not.toBeNull();
    expect((result as any).font).toBe('Symbol');
    expect((result as any).char).toBeNull();
  });
});

// =============================================================================
// Field Character Parser Tests (<w:fldChar>)
// =============================================================================

describe('Field Character Parser', () => {
  it('returns null for null input', () => {
    const result = parseFieldChar(null);
    expect(result).toBeNull();
  });

  it('parses field begin', () => {
    const elem = makeElement('<w:fldChar w:fldCharType="begin"/>');
    const result = parseFieldChar(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('fieldChar');
    expect((result as any).fldCharType).toBe('begin');
  });

  it('parses field separate', () => {
    const elem = makeElement('<w:fldChar w:fldCharType="separate"/>');
    const result = parseFieldChar(elem);
    expect(result).not.toBeNull();
    expect((result as any).fldCharType).toBe('separate');
  });

  it('parses field end', () => {
    const elem = makeElement('<w:fldChar w:fldCharType="end"/>');
    const result = parseFieldChar(elem);
    expect(result).not.toBeNull();
    expect((result as any).fldCharType).toBe('end');
  });
});

// =============================================================================
// Instruction Text Parser Tests (<w:instrText>)
// =============================================================================

describe('Instruction Text Parser', () => {
  it('returns null for null input', () => {
    const result = parseInstrText(null);
    expect(result).toBeNull();
  });

  it('parses instruction text', () => {
    const elem = makeElement('<w:instrText>HYPERLINK "http://example.com"</w:instrText>');
    const result = parseInstrText(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('instrText');
    expect((result as any).value).toBe('HYPERLINK "http://example.com"');
  });

  it('parses instruction text with space preserve', () => {
    const elem = makeElement('<w:instrText xml:space="preserve"> PAGE </w:instrText>');
    const result = parseInstrText(elem);
    expect(result).not.toBeNull();
    expect((result as any).value).toBe(' PAGE ');
    expect((result as any).space).toBe('preserve');
  });
});

// =============================================================================
// Run Content Item Parser Tests
// =============================================================================

describe('Run Content Item Parser', () => {
  it('parses text element', () => {
    const elem = makeElement('<w:t>Hello</w:t>');
    const result = parseRunContentItem(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('text');
  });

  it('parses break element', () => {
    const elem = makeElement('<w:br/>');
    const result = parseRunContentItem(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('break');
  });

  it('parses tab element', () => {
    const elem = makeElement('<w:tab/>');
    const result = parseRunContentItem(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('tab');
  });

  it('returns null for unknown element', () => {
    const elem = makeElement('<w:unknown/>');
    const result = parseRunContentItem(elem);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Run Fonts Parser Tests (<w:rFonts>)
// =============================================================================

describe('Run Fonts Parser', () => {
  it('returns null for null input', () => {
    const result = parseRunFonts(null);
    expect(result).toBeNull();
  });

  it('parses ascii font', () => {
    const elem = makeElement('<w:rFonts w:ascii="Arial"/>');
    const result = parseRunFonts(elem);
    expect(result).not.toBeNull();
    expect(result!.ascii).toBe('Arial');
  });

  it('parses multiple fonts', () => {
    const elem = makeElement('<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="MS Mincho"/>');
    const result = parseRunFonts(elem);
    expect(result).not.toBeNull();
    expect(result!.ascii).toBe('Arial');
    expect(result!.hAnsi).toBe('Arial');
    expect(result!.eastAsia).toBe('MS Mincho');
  });

  it('parses font hint', () => {
    const elem = makeElement('<w:rFonts w:hint="eastAsia"/>');
    const result = parseRunFonts(elem);
    expect(result).not.toBeNull();
    expect(result!.hint).toBe('eastAsia');
  });
});

// =============================================================================
// Language Parser Tests (<w:lang>)
// =============================================================================

describe('Language Parser', () => {
  it('returns null for null input', () => {
    const result = parseLanguage(null);
    expect(result).toBeNull();
  });

  it('parses single language', () => {
    const elem = makeElement('<w:lang w:val="en-US"/>');
    const result = parseLanguage(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('en-US');
  });

  it('parses multiple languages', () => {
    const elem = makeElement('<w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/>');
    const result = parseLanguage(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('en-US');
    expect(result!.eastAsia).toBe('ja-JP');
    expect(result!.bidi).toBe('ar-SA');
  });
});

// =============================================================================
// Underline Parser Tests (<w:u>)
// =============================================================================

describe('Underline Parser', () => {
  it('returns null for null input', () => {
    const result = parseUnderline(null);
    expect(result).toBeNull();
  });

  it('parses simple underline', () => {
    const elem = makeElement('<w:u w:val="single"/>');
    const result = parseUnderline(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('single');
  });

  it('parses underline with color', () => {
    const elem = makeElement('<w:u w:val="single" w:color="FF0000"/>');
    const result = parseUnderline(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('single');
    expect(result!.color).toBe('FF0000');
  });

  it('parses various underline types', () => {
    const types = ['single', 'double', 'thick', 'dotted', 'dash', 'wave', 'none'];
    for (const utype of types) {
      const elem = makeElement(`<w:u w:val="${utype}"/>`);
      const result = parseUnderline(elem);
      expect(result).not.toBeNull();
      expect(result!.val).toBe(utype);
    }
  });
});

// =============================================================================
// Run Properties Parser Tests (<w:rPr>)
// =============================================================================

describe('Run Properties Parser', () => {
  it('returns null for null input', () => {
    const result = parseRunProperties(null);
    expect(result).toBeNull();
  });

  it('parses empty run properties', () => {
    const elem = makeElement('<w:rPr/>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.b).toBeNull();
    expect(result!.i).toBeNull();
  });

  it('parses bold', () => {
    const elem = makeElement('<w:rPr><w:b/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.b).toBe(true);
  });

  it('parses italic', () => {
    const elem = makeElement('<w:rPr><w:i/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.i).toBe(true);
  });

  it('parses underline', () => {
    const elem = makeElement('<w:rPr><w:u w:val="single"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.u).not.toBeNull();
    expect(result!.u!.val).toBe('single');
  });

  it('parses strike', () => {
    const elem = makeElement('<w:rPr><w:strike/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.strike).toBe(true);
  });

  it('parses double strike', () => {
    const elem = makeElement('<w:rPr><w:dstrike/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.dstrike).toBe(true);
  });

  it('parses caps', () => {
    const elem = makeElement('<w:rPr><w:caps/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.caps).toBe(true);
  });

  it('parses small caps', () => {
    const elem = makeElement('<w:rPr><w:smallCaps/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.smallCaps).toBe(true);
  });

  it('parses font size', () => {
    const elem = makeElement('<w:rPr><w:sz w:val="24"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.sz).toBe(24);
  });

  it('parses font size complex', () => {
    const elem = makeElement('<w:rPr><w:szCs w:val="24"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.szCs).toBe(24);
  });

  it('parses color', () => {
    const elem = makeElement('<w:rPr><w:color w:val="FF0000"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.color).not.toBeNull();
    expect(result!.color!.val).toBe('FF0000');
  });

  it('parses highlight', () => {
    const elem = makeElement('<w:rPr><w:highlight w:val="yellow"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.highlight).toBe('yellow');
  });

  it('parses fonts', () => {
    const elem = makeElement('<w:rPr><w:rFonts w:ascii="Arial"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.rFonts).not.toBeNull();
    expect(result!.rFonts!.ascii).toBe('Arial');
  });

  it('parses vertical alignment', () => {
    const elem = makeElement('<w:rPr><w:vertAlign w:val="superscript"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.vertAlign).toBe('superscript');
  });

  it('parses style reference', () => {
    const elem = makeElement('<w:rPr><w:rStyle w:val="Emphasis"/></w:rPr>');
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.rStyle).toBe('Emphasis');
  });

  it('parses comprehensive run properties', () => {
    const elem = makeElement(`
      <w:rPr>
        <w:rStyle w:val="Emphasis"/>
        <w:rFonts w:ascii="Arial"/>
        <w:b/>
        <w:i/>
        <w:u w:val="single"/>
        <w:sz w:val="28"/>
        <w:color w:val="0000FF"/>
        <w:highlight w:val="yellow"/>
      </w:rPr>
    `);
    const result = parseRunProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.rStyle).toBe('Emphasis');
    expect(result!.rFonts!.ascii).toBe('Arial');
    expect(result!.b).toBe(true);
    expect(result!.i).toBe(true);
    expect(result!.u!.val).toBe('single');
    expect(result!.sz).toBe(28);
    expect(result!.color!.val).toBe('0000FF');
    expect(result!.highlight).toBe('yellow');
  });
});

// =============================================================================
// Run Parser Tests (<w:r>)
// =============================================================================

describe('Run Parser', () => {
  it('returns null for null input', () => {
    const result = parseRun(null);
    expect(result).toBeNull();
  });

  it('parses empty run', () => {
    const elem = makeElement('<w:r/>');
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).toBeNull();
    expect(result!.content.length).toBe(0);
  });

  it('parses run with text only', () => {
    const elem = makeElement('<w:r><w:t>Hello</w:t></w:r>');
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).toBeNull();
    expect(result!.content.length).toBe(1);
    expect(result!.content[0].type).toBe('text');
    expect((result!.content[0] as any).value).toBe('Hello');
  });

  it('parses run with properties', () => {
    const elem = makeElement(`
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>Bold text</w:t>
      </w:r>
    `);
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.b).toBe(true);
    expect(result!.content.length).toBe(1);
  });

  it('parses run with multiple text segments', () => {
    const elem = makeElement(`
      <w:r>
        <w:t>First</w:t>
        <w:t> Second</w:t>
      </w:r>
    `);
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(2);
  });

  it('parses run with mixed content', () => {
    const elem = makeElement(`
      <w:r>
        <w:t>Text</w:t>
        <w:br/>
        <w:t>More text</w:t>
      </w:r>
    `);
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(3);
    expect(result!.content[0].type).toBe('text');
    expect(result!.content[1].type).toBe('break');
    expect(result!.content[2].type).toBe('text');
  });

  it('parses run with comprehensive formatting', () => {
    const elem = makeElement(`
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman"/>
          <w:b/>
          <w:i/>
          <w:u w:val="single"/>
          <w:sz w:val="24"/>
          <w:color w:val="FF0000"/>
        </w:rPr>
        <w:t>Formatted text</w:t>
      </w:r>
    `);
    const result = parseRun(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.rFonts!.ascii).toBe('Times New Roman');
    expect(result!.rPr!.b).toBe(true);
    expect(result!.rPr!.i).toBe(true);
    expect(result!.rPr!.u!.val).toBe('single');
    expect(result!.rPr!.sz).toBe(24);
    expect(result!.rPr!.color!.val).toBe('FF0000');
  });
});
