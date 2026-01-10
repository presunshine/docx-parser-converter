/**
 * Unit tests for paragraph parsers.
 *
 * Matches Python: tests/unit/parsers/test_paragraph_parser.py
 */

import { describe, it, expect } from 'vitest';

import { makeElement } from '../../__tests__/helpers/test-utils';
import {
  parseTabStop,
  parseNumberingProperties,
  parseParagraphProperties,
} from '../document/paragraph-properties-parser';
import { parseParagraph } from '../document/paragraph-parser';

// =============================================================================
// Tab Stop Parser Tests (<w:tab> in <w:tabs>)
// =============================================================================

describe('Tab Stop Parser', () => {
  it('returns null for null input', () => {
    const result = parseTabStop(null);
    expect(result).toBeNull();
  });

  it('parses left-aligned tab stop', () => {
    const elem = makeElement('<w:tab w:val="left" w:pos="720"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('left');
    expect(result!.pos).toBe(720);
  });

  it('parses center-aligned tab stop', () => {
    const elem = makeElement('<w:tab w:val="center" w:pos="4680"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('center');
    expect(result!.pos).toBe(4680);
  });

  it('parses right-aligned tab stop', () => {
    const elem = makeElement('<w:tab w:val="right" w:pos="9360"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('right');
  });

  it('parses decimal tab stop', () => {
    const elem = makeElement('<w:tab w:val="decimal" w:pos="5040"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('decimal');
  });

  it('parses tab stop with leader', () => {
    const elem = makeElement('<w:tab w:val="right" w:pos="9360" w:leader="dot"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('right');
    expect(result!.leader).toBe('dot');
  });

  it('parses all leader values', () => {
    const leaders = ['none', 'dot', 'hyphen', 'underscore', 'heavy', 'middleDot'];
    for (const leader of leaders) {
      const elem = makeElement(`<w:tab w:val="right" w:pos="9360" w:leader="${leader}"/>`);
      const result = parseTabStop(elem);
      expect(result).not.toBeNull();
      expect(result!.leader).toBe(leader);
    }
  });

  it('parses all tab stop types', () => {
    const types = ['left', 'center', 'right', 'decimal', 'bar', 'clear', 'num'];
    for (const ttype of types) {
      const elem = makeElement(`<w:tab w:val="${ttype}" w:pos="720"/>`);
      const result = parseTabStop(elem);
      expect(result).not.toBeNull();
      expect(result!.val).toBe(ttype);
    }
  });

  it('parses clear tab stop', () => {
    const elem = makeElement('<w:tab w:val="clear" w:pos="720"/>');
    const result = parseTabStop(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe('clear');
  });
});

// =============================================================================
// Numbering Properties Parser Tests (<w:numPr>)
// =============================================================================

describe('Numbering Properties Parser', () => {
  it('returns null for null input', () => {
    const result = parseNumberingProperties(null);
    expect(result).toBeNull();
  });

  it('parses basic numbering properties', () => {
    const elem = makeElement(`
      <w:numPr>
        <w:ilvl w:val="0"/>
        <w:numId w:val="1"/>
      </w:numPr>
    `);
    const result = parseNumberingProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
    expect(result!.numId).toBe(1);
  });

  it('parses numbering at level 2', () => {
    const elem = makeElement(`
      <w:numPr>
        <w:ilvl w:val="2"/>
        <w:numId w:val="5"/>
      </w:numPr>
    `);
    const result = parseNumberingProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(2);
    expect(result!.numId).toBe(5);
  });

  it('parses empty numbering properties', () => {
    const elem = makeElement('<w:numPr/>');
    const result = parseNumberingProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBeNull();
    expect(result!.numId).toBeNull();
  });

  it('parses with only ilvl', () => {
    const elem = makeElement(`
      <w:numPr>
        <w:ilvl w:val="1"/>
      </w:numPr>
    `);
    const result = parseNumberingProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(1);
    expect(result!.numId).toBeNull();
  });
});

// =============================================================================
// Paragraph Properties Parser Tests (<w:pPr>)
// =============================================================================

describe('Paragraph Properties Parser', () => {
  it('returns null for null input', () => {
    const result = parseParagraphProperties(null);
    expect(result).toBeNull();
  });

  it('parses empty pPr element', () => {
    const elem = makeElement('<w:pPr/>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.pStyle).toBeNull();
    expect(result!.jc).toBeNull();
  });

  it('parses paragraph with style reference', () => {
    const elem = makeElement('<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.pStyle).toBe('Heading1');
  });

  it('parses paragraph justification', () => {
    const elem = makeElement('<w:pPr><w:jc w:val="center"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.jc).toBe('center');
  });

  it('parses all justification values', () => {
    const alignments = ['left', 'center', 'right', 'both', 'distribute', 'start', 'end'];
    for (const jc of alignments) {
      const elem = makeElement(`<w:pPr><w:jc w:val="${jc}"/></w:pPr>`);
      const result = parseParagraphProperties(elem);
      expect(result).not.toBeNull();
      expect(result!.jc).toBe(jc);
    }
  });

  it('parses keep with next paragraph', () => {
    const elem = makeElement('<w:pPr><w:keepNext/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.keepNext).toBe(true);
  });

  it('parses keep lines together', () => {
    const elem = makeElement('<w:pPr><w:keepLines/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.keepLines).toBe(true);
  });

  it('parses page break before', () => {
    const elem = makeElement('<w:pPr><w:pageBreakBefore/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.pageBreakBefore).toBe(true);
  });

  it('parses widow control', () => {
    const elem = makeElement('<w:pPr><w:widowControl/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.widowControl).toBe(true);
  });

  it('parses widow control explicitly off', () => {
    const elem = makeElement('<w:pPr><w:widowControl w:val="0"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.widowControl).toBe(false);
  });

  it('parses suppress line numbers', () => {
    const elem = makeElement('<w:pPr><w:suppressLineNumbers/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.suppressLineNumbers).toBe(true);
  });

  it('parses suppress auto hyphens', () => {
    const elem = makeElement('<w:pPr><w:suppressAutoHyphens/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.suppressAutoHyphens).toBe(true);
  });

  it('parses right-to-left paragraph', () => {
    const elem = makeElement('<w:pPr><w:bidi/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.bidi).toBe(true);
  });

  it('parses outline level for headings', () => {
    const elem = makeElement('<w:pPr><w:outlineLvl w:val="0"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.outlineLvl).toBe(0);
  });

  it('parses outline levels 0-9', () => {
    for (let level = 0; level < 10; level++) {
      const elem = makeElement(`<w:pPr><w:outlineLvl w:val="${level}"/></w:pPr>`);
      const result = parseParagraphProperties(elem);
      expect(result).not.toBeNull();
      expect(result!.outlineLvl).toBe(level);
    }
  });

  it('parses paragraph spacing', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.spacing).not.toBeNull();
    expect(result!.spacing!.before).toBe(240);
    expect(result!.spacing!.after).toBe(120);
    expect(result!.spacing!.line).toBe(276);
    expect(result!.spacing!.lineRule).toBe('auto');
  });

  it('parses paragraph indentation', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:ind w:left="720" w:right="360" w:firstLine="360"/>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ind).not.toBeNull();
    expect(result!.ind!.left).toBe(720);
    expect(result!.ind!.right).toBe(360);
    expect(result!.ind!.firstLine).toBe(360);
  });

  it('parses hanging indent', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.ind).not.toBeNull();
    expect(result!.ind!.hanging).toBe(360);
  });

  it('parses paragraph borders', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:pBdr>
          <w:top w:val="single" w:sz="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:color="000000"/>
        </w:pBdr>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.pBdr).not.toBeNull();
    expect(result!.pBdr!.top).not.toBeNull();
    expect(result!.pBdr!.bottom).not.toBeNull();
  });

  it('parses paragraph shading', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:shd w:val="clear" w:fill="FFFF00"/>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.shd).not.toBeNull();
    expect(result!.shd!.fill).toBe('FFFF00');
  });

  it('parses tab stops', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:tabs>
          <w:tab w:val="left" w:pos="720"/>
          <w:tab w:val="center" w:pos="4680"/>
          <w:tab w:val="right" w:pos="9360" w:leader="dot"/>
        </w:tabs>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tabs).not.toBeNull();
    expect(result!.tabs!.length).toBe(3);
    expect(result!.tabs![0].val).toBe('left');
    expect(result!.tabs![1].val).toBe('center');
    expect(result!.tabs![2].leader).toBe('dot');
  });

  it('parses numbering properties', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.numPr).not.toBeNull();
    expect(result!.numPr!.ilvl).toBe(0);
    expect(result!.numPr!.numId).toBe(1);
  });

  it('parses text direction', () => {
    const elem = makeElement('<w:pPr><w:textDirection w:val="tbRl"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.textDirection).toBe('tbRl');
  });

  it('parses vertical text alignment', () => {
    const elem = makeElement('<w:pPr><w:textAlignment w:val="center"/></w:pPr>');
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.textAlignment).toBe('center');
  });

  it('parses comprehensive paragraph properties', () => {
    const elem = makeElement(`
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:keepNext/>
        <w:keepLines/>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="120"/>
        <w:ind w:left="720"/>
        <w:outlineLvl w:val="0"/>
        <w:shd w:val="clear" w:fill="E0E0E0"/>
      </w:pPr>
    `);
    const result = parseParagraphProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.pStyle).toBe('Heading1');
    expect(result!.keepNext).toBe(true);
    expect(result!.keepLines).toBe(true);
    expect(result!.jc).toBe('center');
    expect(result!.spacing).not.toBeNull();
    expect(result!.spacing!.before).toBe(240);
    expect(result!.ind).not.toBeNull();
    expect(result!.ind!.left).toBe(720);
    expect(result!.outlineLvl).toBe(0);
    expect(result!.shd).not.toBeNull();
    expect(result!.shd!.fill).toBe('E0E0E0');
  });
});

// =============================================================================
// Paragraph Parser Tests (<w:p>)
// =============================================================================

describe('Paragraph Parser', () => {
  it('returns null for null input', () => {
    const result = parseParagraph(null);
    expect(result).toBeNull();
  });

  it('parses empty paragraph', () => {
    const elem = makeElement('<w:p/>');
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).toBeNull();
    expect(result!.content.length).toBe(0);
  });

  it('parses paragraph with simple text', () => {
    const elem = makeElement(`
      <w:p>
        <w:r>
          <w:t>Hello World</w:t>
        </w:r>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(1);
    // Run doesn't have a type property - check by accessing content directly
    const run = result!.content[0] as { content: Array<{ type: string; value: string }> };
    expect(run.content).toBeDefined();
    expect(run.content[0].value).toBe('Hello World');
  });

  it('parses paragraph with properties', () => {
    const elem = makeElement(`
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:t>Centered text</w:t>
        </w:r>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.jc).toBe('center');
    expect(result!.content.length).toBe(1);
  });

  it('parses paragraph with multiple runs', () => {
    const elem = makeElement(`
      <w:p>
        <w:r>
          <w:t>First </w:t>
        </w:r>
        <w:r>
          <w:rPr><w:b/></w:rPr>
          <w:t>bold</w:t>
        </w:r>
        <w:r>
          <w:t> third</w:t>
        </w:r>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(3);
  });

  it('parses paragraph with only properties', () => {
    const elem = makeElement(`
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Normal"/>
        </w:pPr>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.pStyle).toBe('Normal');
    expect(result!.content.length).toBe(0);
  });

  it('parses heading paragraph', () => {
    const elem = makeElement(`
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
          <w:outlineLvl w:val="0"/>
        </w:pPr>
        <w:r>
          <w:t>Chapter 1</w:t>
        </w:r>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.pStyle).toBe('Heading1');
    expect(result!.pPr!.outlineLvl).toBe(0);
  });

  it('parses list item paragraph', () => {
    const elem = makeElement(`
      <w:p>
        <w:pPr>
          <w:numPr>
            <w:ilvl w:val="0"/>
            <w:numId w:val="1"/>
          </w:numPr>
        </w:pPr>
        <w:r>
          <w:t>List item</w:t>
        </w:r>
      </w:p>
    `);
    const result = parseParagraph(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.numPr).not.toBeNull();
    expect(result!.pPr!.numPr!.ilvl).toBe(0);
    expect(result!.pPr!.numPr!.numId).toBe(1);
  });
});
