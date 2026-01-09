/**
 * Tests for type definitions.
 */
import { describe, it, expect } from 'vitest';
import {
  // Type arrays for validation
  JustificationTypes,
  BorderStyleTypes,
  NumFmtTypes,
  UnderlineTypes,
  // Types
  type JustificationType,
  type VAlignType,
  type VertAlignType,
  type BorderStyleType,
  type ShadingPatternType,
  type ThemeColorType,
  type HighlightType,
  type UnderlineType,
  type NumFmtType,
  type TabType,
  type TabLeaderType,
  type BreakType,
  type BreakClearType,
  type TableLayoutType,
  type VMergeType,
  type SectionType,
  type OrientType,
  type FieldCharType,
  type StyleType,
  type TableStyleConditionType,
  type MultiLevelType,
  type LevelSuffixType,
  type HeightRuleType,
  type LineRuleType,
  type WidthType,
  type TextDirectionType,
} from '../types';

describe('Type Definitions', () => {
  describe('JustificationType', () => {
    it('should define all 7 justification values', () => {
      expect(JustificationTypes).toHaveLength(7);
      expect(JustificationTypes).toContain('left');
      expect(JustificationTypes).toContain('center');
      expect(JustificationTypes).toContain('right');
      expect(JustificationTypes).toContain('both');
      expect(JustificationTypes).toContain('distribute');
      expect(JustificationTypes).toContain('start');
      expect(JustificationTypes).toContain('end');
    });

    it('should be usable as a type', () => {
      const value: JustificationType = 'center';
      expect(value).toBe('center');
    });
  });

  describe('VAlignType', () => {
    it('should be usable as a type', () => {
      const value: VAlignType = 'center';
      expect(['top', 'center', 'bottom']).toContain(value);
    });
  });

  describe('VertAlignType', () => {
    it('should be usable as a type', () => {
      const value: VertAlignType = 'superscript';
      expect(['baseline', 'superscript', 'subscript']).toContain(value);
    });
  });

  describe('BorderStyleType', () => {
    it('should define all 27 border style values', () => {
      expect(BorderStyleTypes).toHaveLength(27);
      expect(BorderStyleTypes).toContain('nil');
      expect(BorderStyleTypes).toContain('none');
      expect(BorderStyleTypes).toContain('single');
      expect(BorderStyleTypes).toContain('thick');
      expect(BorderStyleTypes).toContain('double');
      expect(BorderStyleTypes).toContain('dotted');
      expect(BorderStyleTypes).toContain('dashed');
      expect(BorderStyleTypes).toContain('wave');
      expect(BorderStyleTypes).toContain('inset');
      expect(BorderStyleTypes).toContain('outset');
    });

    it('should be usable as a type', () => {
      const value: BorderStyleType = 'single';
      expect(value).toBe('single');
    });
  });

  describe('ShadingPatternType', () => {
    it('should be usable as a type', () => {
      const value: ShadingPatternType = 'clear';
      expect(['clear', 'solid', 'nil']).toContain(value);
    });
  });

  describe('ThemeColorType', () => {
    it('should be usable as a type', () => {
      const value: ThemeColorType = 'accent1';
      expect(['dark1', 'light1', 'accent1', 'hyperlink']).toContain(value);
    });
  });

  describe('HighlightType', () => {
    it('should be usable as a type', () => {
      const value: HighlightType = 'yellow';
      expect(['yellow', 'green', 'cyan', 'magenta', 'none']).toContain(value);
    });
  });

  describe('UnderlineType', () => {
    it('should define all 18 underline values', () => {
      expect(UnderlineTypes).toHaveLength(18);
      expect(UnderlineTypes).toContain('none');
      expect(UnderlineTypes).toContain('single');
      expect(UnderlineTypes).toContain('double');
      expect(UnderlineTypes).toContain('thick');
      expect(UnderlineTypes).toContain('dotted');
      expect(UnderlineTypes).toContain('wave');
      expect(UnderlineTypes).toContain('wavyDouble');
    });

    it('should be usable as a type', () => {
      const value: UnderlineType = 'single';
      expect(value).toBe('single');
    });
  });

  describe('NumFmtType', () => {
    it('should define all 62 numbering format values', () => {
      expect(NumFmtTypes).toHaveLength(62);
      // Basic formats
      expect(NumFmtTypes).toContain('decimal');
      expect(NumFmtTypes).toContain('upperRoman');
      expect(NumFmtTypes).toContain('lowerRoman');
      expect(NumFmtTypes).toContain('upperLetter');
      expect(NumFmtTypes).toContain('lowerLetter');
      expect(NumFmtTypes).toContain('bullet');
      expect(NumFmtTypes).toContain('none');
      // Japanese
      expect(NumFmtTypes).toContain('aiueo');
      expect(NumFmtTypes).toContain('iroha');
      expect(NumFmtTypes).toContain('japaneseCounting');
      // Chinese
      expect(NumFmtTypes).toContain('chineseCounting');
      expect(NumFmtTypes).toContain('taiwaneseCounting');
      // Korean
      expect(NumFmtTypes).toContain('koreanDigital');
      expect(NumFmtTypes).toContain('koreanCounting');
      // Hebrew
      expect(NumFmtTypes).toContain('hebrew1');
      expect(NumFmtTypes).toContain('hebrew2');
      // Arabic
      expect(NumFmtTypes).toContain('arabicAlpha');
      expect(NumFmtTypes).toContain('arabicAbjad');
      // Hindi
      expect(NumFmtTypes).toContain('hindiNumbers');
      expect(NumFmtTypes).toContain('hindiCounting');
      // Thai
      expect(NumFmtTypes).toContain('thaiNumbers');
      expect(NumFmtTypes).toContain('thaiCounting');
      // Russian
      expect(NumFmtTypes).toContain('russianLower');
      expect(NumFmtTypes).toContain('russianUpper');
    });

    it('should be usable as a type', () => {
      const value: NumFmtType = 'decimal';
      expect(value).toBe('decimal');
    });
  });

  describe('TabType', () => {
    it('should be usable as a type', () => {
      const value: TabType = 'left';
      expect(['left', 'center', 'right', 'decimal', 'bar', 'clear', 'num']).toContain(value);
    });
  });

  describe('TabLeaderType', () => {
    it('should be usable as a type', () => {
      const value: TabLeaderType = 'dot';
      expect(['none', 'dot', 'hyphen', 'underscore', 'heavy', 'middleDot']).toContain(value);
    });
  });

  describe('BreakType', () => {
    it('should be usable as a type', () => {
      const value: BreakType = 'page';
      expect(['page', 'column', 'textWrapping']).toContain(value);
    });
  });

  describe('BreakClearType', () => {
    it('should be usable as a type', () => {
      const value: BreakClearType = 'all';
      expect(['none', 'left', 'right', 'all']).toContain(value);
    });
  });

  describe('TableLayoutType', () => {
    it('should be usable as a type', () => {
      const value: TableLayoutType = 'fixed';
      expect(['fixed', 'autofit']).toContain(value);
    });
  });

  describe('VMergeType', () => {
    it('should be usable as a type', () => {
      const value: VMergeType = 'restart';
      expect(['restart', 'continue']).toContain(value);
    });
  });

  describe('SectionType', () => {
    it('should be usable as a type', () => {
      const value: SectionType = 'nextPage';
      expect(['nextPage', 'continuous', 'evenPage', 'oddPage', 'nextColumn']).toContain(value);
    });
  });

  describe('OrientType', () => {
    it('should be usable as a type', () => {
      const value: OrientType = 'portrait';
      expect(['portrait', 'landscape']).toContain(value);
    });
  });

  describe('FieldCharType', () => {
    it('should be usable as a type', () => {
      const value: FieldCharType = 'begin';
      expect(['begin', 'separate', 'end']).toContain(value);
    });
  });

  describe('StyleType', () => {
    it('should be usable as a type', () => {
      const value: StyleType = 'paragraph';
      expect(['paragraph', 'character', 'table', 'numbering']).toContain(value);
    });
  });

  describe('TableStyleConditionType', () => {
    it('should be usable as a type', () => {
      const value: TableStyleConditionType = 'firstRow';
      expect(['wholeTable', 'firstRow', 'lastRow', 'firstCol', 'lastCol']).toContain(value);
    });
  });

  describe('MultiLevelType', () => {
    it('should be usable as a type', () => {
      const value: MultiLevelType = 'multilevel';
      expect(['singleLevel', 'multilevel', 'hybridMultilevel']).toContain(value);
    });
  });

  describe('LevelSuffixType', () => {
    it('should be usable as a type', () => {
      const value: LevelSuffixType = 'tab';
      expect(['tab', 'space', 'nothing']).toContain(value);
    });
  });

  describe('HeightRuleType', () => {
    it('should be usable as a type', () => {
      const value: HeightRuleType = 'exact';
      expect(['auto', 'exact', 'atLeast']).toContain(value);
    });
  });

  describe('LineRuleType', () => {
    it('should be usable as a type', () => {
      const value: LineRuleType = 'auto';
      expect(['auto', 'exact', 'atLeast']).toContain(value);
    });
  });

  describe('WidthType', () => {
    it('should be usable as a type', () => {
      const value: WidthType = 'dxa';
      expect(['dxa', 'pct', 'auto', 'nil']).toContain(value);
    });
  });

  describe('TextDirectionType', () => {
    it('should be usable as a type', () => {
      const value: TextDirectionType = 'lrTb';
      expect(['lrTb', 'tbRl', 'btLr']).toContain(value);
    });
  });
});
