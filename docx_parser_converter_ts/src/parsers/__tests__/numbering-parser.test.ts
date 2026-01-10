/**
 * Unit tests for numbering parsers.
 *
 * Matches Python: tests/unit/parsers/test_numbering_parser.py
 */

import { describe, it, expect } from 'vitest';

import { makeElement } from '../../__tests__/helpers/test-utils';
import { parseLevel } from '../numbering/level-parser';
import { parseAbstractNumbering } from '../numbering/abstract-numbering-parser';
import { parseLevelOverride, parseNumberingInstance } from '../numbering/numbering-instance-parser';
import { parseNumbering } from '../numbering/numbering-parser';

// =============================================================================
// Level Parser Tests (<w:lvl>)
// =============================================================================

describe('Level Parser', () => {
  it('returns null for null input', () => {
    const result = parseLevel(null);
    expect(result).toBeNull();
  });

  it('returns null for missing ilvl', () => {
    const elem = makeElement('<w:lvl><w:start w:val="1"/></w:lvl>');
    const result = parseLevel(elem);
    expect(result).toBeNull();
  });

  it('parses minimal level with only ilvl', () => {
    const elem = makeElement('<w:lvl w:ilvl="0"/>');
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
  });

  it('parses decimal numbered level', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:start w:val="1"/>
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1."/>
        <w:lvlJc w:val="left"/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
    expect(result!.start).toBe(1);
    expect(result!.numFmt).toBe('decimal');
    expect(result!.lvlText).toBe('%1.');
    expect(result!.lvlJc).toBe('left');
  });

  it('parses bullet level', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:numFmt w:val="bullet"/>
        <w:lvlText w:val=""/>
        <w:lvlJc w:val="left"/>
        <w:rPr>
          <w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>
        </w:rPr>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.numFmt).toBe('bullet');
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.rFonts?.ascii).toBe('Symbol');
  });

  it('parses various number format values', () => {
    const numFmts = [
      'decimal',
      'upperRoman',
      'lowerRoman',
      'upperLetter',
      'lowerLetter',
      'bullet',
      'none',
      'ordinal',
      'cardinalText',
    ];
    for (const numFmt of numFmts) {
      const elem = makeElement(`
        <w:lvl w:ilvl="0">
          <w:numFmt w:val="${numFmt}"/>
        </w:lvl>
      `);
      const result = parseLevel(elem);
      expect(result).not.toBeNull();
      expect(result!.numFmt).toBe(numFmt);
    }
  });

  it('parses level with indentation', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:numFmt w:val="decimal"/>
        <w:pPr>
          <w:ind w:left="720" w:hanging="360"/>
        </w:pPr>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.ind).not.toBeNull();
    expect(result!.pPr!.ind!.left).toBe(720);
    expect(result!.pPr!.ind!.hanging).toBe(360);
  });

  it('parses level suffix', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:suff w:val="tab"/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.suff).toBe('tab');
  });

  it('parses all suffix values', () => {
    const suffixes = ['tab', 'space', 'nothing'];
    for (const suff of suffixes) {
      const elem = makeElement(`
        <w:lvl w:ilvl="0">
          <w:suff w:val="${suff}"/>
        </w:lvl>
      `);
      const result = parseLevel(elem);
      expect(result).not.toBeNull();
      expect(result!.suff).toBe(suff);
    }
  });

  it('parses level justification values', () => {
    const justifications = ['left', 'center', 'right'];
    for (const jc of justifications) {
      const elem = makeElement(`
        <w:lvl w:ilvl="0">
          <w:lvlJc w:val="${jc}"/>
        </w:lvl>
      `);
      const result = parseLevel(elem);
      expect(result).not.toBeNull();
      expect(result!.lvlJc).toBe(jc);
    }
  });

  it('parses level restart setting', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="1">
        <w:lvlRestart w:val="0"/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.lvlRestart).toBe(0);
  });

  it('parses level with associated paragraph style', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:pStyle w:val="Heading1"/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.pStyle).toBe('Heading1');
  });

  it('parses legal numbering style', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0">
        <w:isLgl/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.isLgl).toBe(true);
  });

  it('parses level template code', () => {
    const elem = makeElement('<w:lvl w:ilvl="0" w:tplc="04090001"/>');
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.tplc).toBe('04090001');
  });

  it('parses multilevel numbering text', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="2">
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1.%2.%3"/>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.lvlText).toBe('%1.%2.%3');
  });

  it('parses comprehensive level definition', () => {
    const elem = makeElement(`
      <w:lvl w:ilvl="0" w:tplc="04090001">
        <w:start w:val="1"/>
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1."/>
        <w:lvlJc w:val="left"/>
        <w:suff w:val="tab"/>
        <w:pPr>
          <w:ind w:left="720" w:hanging="360"/>
        </w:pPr>
        <w:rPr>
          <w:b/>
        </w:rPr>
      </w:lvl>
    `);
    const result = parseLevel(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
    expect(result!.tplc).toBe('04090001');
    expect(result!.start).toBe(1);
    expect(result!.numFmt).toBe('decimal');
    expect(result!.lvlText).toBe('%1.');
    expect(result!.lvlJc).toBe('left');
    expect(result!.suff).toBe('tab');
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.ind).not.toBeNull();
    expect(result!.pPr!.ind!.left).toBe(720);
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.b).toBe(true);
  });
});

// =============================================================================
// Abstract Numbering Parser Tests (<w:abstractNum>)
// =============================================================================

describe('Abstract Numbering Parser', () => {
  it('returns null for null input', () => {
    const result = parseAbstractNumbering(null);
    expect(result).toBeNull();
  });

  it('returns null for missing abstractNumId', () => {
    const elem = makeElement('<w:abstractNum><w:nsid w:val="00000001"/></w:abstractNum>');
    const result = parseAbstractNumbering(elem);
    expect(result).toBeNull();
  });

  it('parses minimal abstract numbering', () => {
    const elem = makeElement('<w:abstractNum w:abstractNumId="0"/>');
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNumId).toBe(0);
    expect(result!.lvl).toBeDefined();
    expect(result!.lvl!.length).toBe(0);
  });

  it('parses abstract numbering with NSID', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:nsid w:val="12345678"/>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.nsid).toBe('12345678');
  });

  it('parses abstract numbering with multi-level type', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:multiLevelType w:val="multilevel"/>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.multiLevelType).toBe('multilevel');
  });

  it('parses all multi-level type values', () => {
    const types = ['singleLevel', 'multilevel', 'hybridMultilevel'];
    for (const mlt of types) {
      const elem = makeElement(`
        <w:abstractNum w:abstractNumId="0">
          <w:multiLevelType w:val="${mlt}"/>
        </w:abstractNum>
      `);
      const result = parseAbstractNumbering(elem);
      expect(result).not.toBeNull();
      expect(result!.multiLevelType).toBe(mlt);
    }
  });

  it('parses abstract numbering with levels', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:multiLevelType w:val="hybridMultilevel"/>
        <w:lvl w:ilvl="0">
          <w:numFmt w:val="decimal"/>
          <w:lvlText w:val="%1."/>
        </w:lvl>
        <w:lvl w:ilvl="1">
          <w:numFmt w:val="lowerLetter"/>
          <w:lvlText w:val="%2."/>
        </w:lvl>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.lvl).toBeDefined();
    expect(result!.lvl!.length).toBe(2);
    expect(result!.lvl![0].numFmt).toBe('decimal');
    expect(result!.lvl![1].numFmt).toBe('lowerLetter');
  });

  it('parses abstract numbering with style link', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:styleLink w:val="ListNumber"/>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.styleLink).toBe('ListNumber');
  });

  it('parses abstract numbering with name', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:name w:val="MyList"/>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('MyList');
  });

  it('parses comprehensive abstract numbering', () => {
    const elem = makeElement(`
      <w:abstractNum w:abstractNumId="0">
        <w:nsid w:val="ABCD1234"/>
        <w:multiLevelType w:val="multilevel"/>
        <w:tmpl w:val="12345678"/>
        <w:name w:val="Legal Outline"/>
        <w:lvl w:ilvl="0">
          <w:start w:val="1"/>
          <w:numFmt w:val="decimal"/>
          <w:lvlText w:val="%1"/>
          <w:lvlJc w:val="left"/>
        </w:lvl>
        <w:lvl w:ilvl="1">
          <w:start w:val="1"/>
          <w:numFmt w:val="decimal"/>
          <w:lvlText w:val="%1.%2"/>
          <w:lvlJc w:val="left"/>
        </w:lvl>
      </w:abstractNum>
    `);
    const result = parseAbstractNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNumId).toBe(0);
    expect(result!.nsid).toBe('ABCD1234');
    expect(result!.multiLevelType).toBe('multilevel');
    expect(result!.tmpl).toBe('12345678');
    expect(result!.name).toBe('Legal Outline');
    expect(result!.lvl).toBeDefined();
    expect(result!.lvl!.length).toBe(2);
  });
});

// =============================================================================
// Level Override Parser Tests (<w:lvlOverride>)
// =============================================================================

describe('Level Override Parser', () => {
  it('returns null for null input', () => {
    const result = parseLevelOverride(null);
    expect(result).toBeNull();
  });

  it('returns null for missing ilvl', () => {
    const elem = makeElement('<w:lvlOverride><w:startOverride w:val="5"/></w:lvlOverride>');
    const result = parseLevelOverride(elem);
    expect(result).toBeNull();
  });

  it('parses level override with start override', () => {
    const elem = makeElement(`
      <w:lvlOverride w:ilvl="0">
        <w:startOverride w:val="5"/>
      </w:lvlOverride>
    `);
    const result = parseLevelOverride(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
    expect(result!.startOverride).toBe(5);
  });

  it('parses level override with full level replacement', () => {
    const elem = makeElement(`
      <w:lvlOverride w:ilvl="0">
        <w:lvl w:ilvl="0">
          <w:numFmt w:val="upperRoman"/>
          <w:lvlText w:val="%1."/>
        </w:lvl>
      </w:lvlOverride>
    `);
    const result = parseLevelOverride(elem);
    expect(result).not.toBeNull();
    expect(result!.ilvl).toBe(0);
    expect(result!.lvl).not.toBeNull();
    expect(result!.lvl!.numFmt).toBe('upperRoman');
  });
});

// =============================================================================
// Numbering Instance Parser Tests (<w:num>)
// =============================================================================

describe('Numbering Instance Parser', () => {
  it('returns null for null input', () => {
    const result = parseNumberingInstance(null);
    expect(result).toBeNull();
  });

  it('returns null for missing numId', () => {
    const elem = makeElement('<w:num><w:abstractNumId w:val="0"/></w:num>');
    const result = parseNumberingInstance(elem);
    expect(result).toBeNull();
  });

  it('parses minimal numbering instance', () => {
    const elem = makeElement(`
      <w:num w:numId="1">
        <w:abstractNumId w:val="0"/>
      </w:num>
    `);
    const result = parseNumberingInstance(elem);
    expect(result).not.toBeNull();
    expect(result!.numId).toBe(1);
    expect(result!.abstractNumId).toBe(0);
  });

  it('parses numbering instance with level override', () => {
    const elem = makeElement(`
      <w:num w:numId="1">
        <w:abstractNumId w:val="0"/>
        <w:lvlOverride w:ilvl="0">
          <w:startOverride w:val="10"/>
        </w:lvlOverride>
      </w:num>
    `);
    const result = parseNumberingInstance(elem);
    expect(result).not.toBeNull();
    expect(result!.numId).toBe(1);
    expect(result!.lvlOverride).not.toBeNull();
    expect(result!.lvlOverride!.length).toBe(1);
    expect(result!.lvlOverride![0].startOverride).toBe(10);
  });

  it('parses numbering instance with multiple level overrides', () => {
    const elem = makeElement(`
      <w:num w:numId="1">
        <w:abstractNumId w:val="0"/>
        <w:lvlOverride w:ilvl="0">
          <w:startOverride w:val="5"/>
        </w:lvlOverride>
        <w:lvlOverride w:ilvl="1">
          <w:startOverride w:val="1"/>
        </w:lvlOverride>
      </w:num>
    `);
    const result = parseNumberingInstance(elem);
    expect(result).not.toBeNull();
    expect(result!.lvlOverride).not.toBeNull();
    expect(result!.lvlOverride!.length).toBe(2);
  });
});

// =============================================================================
// Numbering Parser Tests (<w:numbering>)
// =============================================================================

describe('Numbering Parser', () => {
  it('returns null for null input', () => {
    const result = parseNumbering(null);
    expect(result).toBeNull();
  });

  it('parses empty numbering', () => {
    const elem = makeElement('<w:numbering/>');
    const result = parseNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNum).toBeDefined();
    expect(result!.abstractNum!.length).toBe(0);
    expect(result!.num).toBeDefined();
    expect(result!.num!.length).toBe(0);
  });

  it('parses numbering with abstract numbering', () => {
    const elem = makeElement(`
      <w:numbering>
        <w:abstractNum w:abstractNumId="0">
          <w:multiLevelType w:val="hybridMultilevel"/>
          <w:lvl w:ilvl="0">
            <w:numFmt w:val="bullet"/>
          </w:lvl>
        </w:abstractNum>
      </w:numbering>
    `);
    const result = parseNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNum).toBeDefined();
    expect(result!.abstractNum!.length).toBe(1);
    expect(result!.abstractNum![0].abstractNumId).toBe(0);
  });

  it('parses numbering with numbering instance', () => {
    const elem = makeElement(`
      <w:numbering>
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:numFmt w:val="decimal"/>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1">
          <w:abstractNumId w:val="0"/>
        </w:num>
      </w:numbering>
    `);
    const result = parseNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNum).toBeDefined();
    expect(result!.abstractNum!.length).toBe(1);
    expect(result!.num).toBeDefined();
    expect(result!.num!.length).toBe(1);
    expect(result!.num![0].abstractNumId).toBe(0);
  });

  it('parses comprehensive numbering with multiple definitions', () => {
    const elem = makeElement(`
      <w:numbering>
        <w:abstractNum w:abstractNumId="0">
          <w:multiLevelType w:val="hybridMultilevel"/>
          <w:lvl w:ilvl="0">
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val=""/>
          </w:lvl>
        </w:abstractNum>
        <w:abstractNum w:abstractNumId="1">
          <w:multiLevelType w:val="multilevel"/>
          <w:lvl w:ilvl="0">
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
          </w:lvl>
          <w:lvl w:ilvl="1">
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1.%2"/>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1">
          <w:abstractNumId w:val="0"/>
        </w:num>
        <w:num w:numId="2">
          <w:abstractNumId w:val="1"/>
        </w:num>
        <w:num w:numId="3">
          <w:abstractNumId w:val="1"/>
          <w:lvlOverride w:ilvl="0">
            <w:startOverride w:val="5"/>
          </w:lvlOverride>
        </w:num>
      </w:numbering>
    `);
    const result = parseNumbering(elem);
    expect(result).not.toBeNull();
    expect(result!.abstractNum).toBeDefined();
    expect(result!.abstractNum!.length).toBe(2);
    expect(result!.num).toBeDefined();
    expect(result!.num!.length).toBe(3);
    expect(result!.num![2].lvlOverride).not.toBeNull();
    expect(result!.num![2].lvlOverride![0].startOverride).toBe(5);
  });
});
