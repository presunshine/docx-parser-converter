/**
 * Tests for numbering model interfaces.
 */
import { describe, it, expect } from 'vitest';
import type {
  Numbering,
  AbstractNumbering,
  NumberingInstance,
  Level,
  LevelOverride,
} from '../numbering';

describe('Numbering Models', () => {
  describe('Numbering', () => {
    it('should define Numbering root container', () => {
      const numbering: Numbering = {
        abstractNum: [],
        num: [],
      };
      expect(numbering.abstractNum).toBeDefined();
      expect(numbering.num).toBeDefined();
    });

    it('should contain abstract numberings and instances', () => {
      const numbering: Numbering = {
        abstractNum: [
          { abstractNumId: 0, lvl: [] },
        ],
        num: [
          { numId: 1, abstractNumId: 0 },
        ],
      };
      expect(numbering.abstractNum).toHaveLength(1);
      expect(numbering.num).toHaveLength(1);
    });
  });

  describe('AbstractNumbering', () => {
    it('should define abstract numbering', () => {
      const abstractNum: AbstractNumbering = {
        abstractNumId: 0,
      };
      expect(abstractNum.abstractNumId).toBe(0);
    });

    it('should support all properties', () => {
      const abstractNum: AbstractNumbering = {
        abstractNumId: 0,
        nsid: '12345678',
        multiLevelType: 'multilevel',
        tmpl: 'ABCD1234',
        name: 'My List',
        styleLink: 'BulletStyle',
        numStyleLink: 'NumberedStyle',
        lvl: [],
      };
      expect(abstractNum.multiLevelType).toBe('multilevel');
      expect(abstractNum.nsid).toBe('12345678');
    });

    it('should contain level definitions', () => {
      const abstractNum: AbstractNumbering = {
        abstractNumId: 0,
        lvl: [
          { ilvl: 0, numFmt: 'decimal', lvlText: '%1.', start: 1 },
          { ilvl: 1, numFmt: 'lowerLetter', lvlText: '%2)', start: 1 },
        ],
      };
      expect(abstractNum.lvl).toHaveLength(2);
    });
  });

  describe('NumberingInstance', () => {
    it('should define numbering instance', () => {
      const num: NumberingInstance = {
        numId: 1,
        abstractNumId: 0,
      };
      expect(num.numId).toBe(1);
      expect(num.abstractNumId).toBe(0);
    });

    it('should support level overrides', () => {
      const num: NumberingInstance = {
        numId: 1,
        abstractNumId: 0,
        lvlOverride: [
          { ilvl: 0, startOverride: 5 },
        ],
      };
      expect(num.lvlOverride).toHaveLength(1);
    });
  });

  describe('Level', () => {
    it('should define level with basic properties', () => {
      const lvl: Level = {
        ilvl: 0,
        start: 1,
        numFmt: 'decimal',
        lvlText: '%1.',
        lvlJc: 'left',
      };
      expect(lvl.ilvl).toBe(0);
      expect(lvl.numFmt).toBe('decimal');
    });

    it('should support bullet format', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'bullet',
        lvlText: '\u2022',
        rPr: {
          rFonts: { ascii: 'Symbol' },
        },
      };
      expect(lvl.numFmt).toBe('bullet');
    });

    it('should support Roman numerals', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'upperRoman',
        lvlText: '%1.',
        start: 1,
      };
      expect(lvl.numFmt).toBe('upperRoman');
    });

    it('should support letters', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'lowerLetter',
        lvlText: '%1)',
        start: 1,
      };
      expect(lvl.numFmt).toBe('lowerLetter');
    });

    it('should support level suffix', () => {
      const lvl: Level = {
        ilvl: 0,
        suff: 'space',
        numFmt: 'decimal',
        lvlText: '%1.',
      };
      expect(lvl.suff).toBe('space');
    });

    it('should support level restart', () => {
      const lvl: Level = {
        ilvl: 1,
        lvlRestart: 0,
        numFmt: 'decimal',
        lvlText: '%2.',
      };
      expect(lvl.lvlRestart).toBe(0);
    });

    it('should support paragraph style link', () => {
      const lvl: Level = {
        ilvl: 0,
        pStyle: 'ListNumber',
        numFmt: 'decimal',
        lvlText: '%1.',
      };
      expect(lvl.pStyle).toBe('ListNumber');
    });

    it('should support legal numbering', () => {
      const lvl: Level = {
        ilvl: 0,
        isLgl: true,
        numFmt: 'decimal',
        lvlText: '%1.',
      };
      expect(lvl.isLgl).toBe(true);
    });

    it('should support picture bullets', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'bullet',
        lvlPicBulletId: 1,
        lvlText: '',
      };
      expect(lvl.lvlPicBulletId).toBe(1);
    });

    it('should support paragraph properties', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'decimal',
        lvlText: '%1.',
        pPr: {
          ind: { left: 720, hanging: 360 },
        },
      };
      expect(lvl.pPr?.ind?.left).toBe(720);
    });

    it('should support run properties', () => {
      const lvl: Level = {
        ilvl: 0,
        numFmt: 'bullet',
        lvlText: '\u2022',
        rPr: {
          rFonts: { ascii: 'Symbol' },
          color: { val: 'FF0000' },
        },
      };
      expect(lvl.rPr?.color?.val).toBe('FF0000');
    });

    it('should support multi-level text patterns', () => {
      const levels: Level[] = [
        { ilvl: 0, numFmt: 'decimal', lvlText: '%1.' },
        { ilvl: 1, numFmt: 'decimal', lvlText: '%1.%2.' },
        { ilvl: 2, numFmt: 'decimal', lvlText: '%1.%2.%3.' },
      ];
      expect(levels[2].lvlText).toBe('%1.%2.%3.');
    });

    it('should support all numbering formats', () => {
      const formats: Level[] = [
        { ilvl: 0, numFmt: 'decimal', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'upperRoman', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'lowerRoman', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'upperLetter', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'lowerLetter', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'bullet', lvlText: '\u2022' },
        { ilvl: 0, numFmt: 'none', lvlText: '' },
        { ilvl: 0, numFmt: 'aiueo', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'iroha', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'japaneseCounting', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'chineseCounting', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'koreanCounting', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'hebrew1', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'arabicAlpha', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'hindiNumbers', lvlText: '%1.' },
        { ilvl: 0, numFmt: 'thaiNumbers', lvlText: '%1.' },
      ];
      expect(formats).toHaveLength(16);
    });
  });

  describe('LevelOverride', () => {
    it('should define level override', () => {
      const override: LevelOverride = {
        ilvl: 0,
      };
      expect(override.ilvl).toBe(0);
    });

    it('should support start override', () => {
      const override: LevelOverride = {
        ilvl: 0,
        startOverride: 5,
      };
      expect(override.startOverride).toBe(5);
    });

    it('should support complete level replacement', () => {
      const override: LevelOverride = {
        ilvl: 0,
        lvl: {
          ilvl: 0,
          numFmt: 'upperLetter',
          lvlText: '%1)',
          start: 1,
        },
      };
      expect(override.lvl?.numFmt).toBe('upperLetter');
    });
  });
});
