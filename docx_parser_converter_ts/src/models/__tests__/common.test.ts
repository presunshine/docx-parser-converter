/**
 * Tests for common model interfaces.
 */
import { describe, it, expect } from 'vitest';
import type {
  Border,
  ParagraphBorders,
  TableBorders,
  CellBorders,
  Color,
  Shading,
  Spacing,
  Indentation,
  Width,
} from '../common';

describe('Common Models', () => {
  describe('Border', () => {
    it('should define Border interface', () => {
      const border: Border = {
        val: 'single',
        sz: 4,
        space: 0,
        color: '000000',
      };
      expect(border.val).toBe('single');
      expect(border.sz).toBe(4);
    });

    it('should allow optional fields', () => {
      const border: Border = {};
      expect(border.val).toBeUndefined();
    });

    it('should support theme color', () => {
      const border: Border = {
        val: 'single',
        themeColor: 'accent1',
        themeTint: 'BF',
        themeShade: '40',
      };
      expect(border.themeColor).toBe('accent1');
    });
  });

  describe('ParagraphBorders', () => {
    it('should define all border positions', () => {
      const borders: ParagraphBorders = {
        top: { val: 'single', sz: 4 },
        left: { val: 'single', sz: 4 },
        bottom: { val: 'single', sz: 4 },
        right: { val: 'single', sz: 4 },
        between: { val: 'dotted', sz: 2 },
        bar: { val: 'thick', sz: 8 },
      };
      expect(borders.top?.val).toBe('single');
      expect(borders.between?.val).toBe('dotted');
      expect(borders.bar?.val).toBe('thick');
    });
  });

  describe('TableBorders', () => {
    it('should define all table border positions', () => {
      const borders: TableBorders = {
        top: { val: 'single' },
        left: { val: 'single' },
        bottom: { val: 'single' },
        right: { val: 'single' },
        insideH: { val: 'single' },
        insideV: { val: 'single' },
      };
      expect(borders.insideH?.val).toBe('single');
      expect(borders.insideV?.val).toBe('single');
    });
  });

  describe('CellBorders', () => {
    it('should define all cell border positions', () => {
      const borders: CellBorders = {
        top: { val: 'single' },
        left: { val: 'single' },
        bottom: { val: 'single' },
        right: { val: 'single' },
        tl2br: { val: 'dotted' },
        tr2bl: { val: 'dashed' },
      };
      expect(borders.tl2br?.val).toBe('dotted');
      expect(borders.tr2bl?.val).toBe('dashed');
    });
  });

  describe('Color', () => {
    it('should define Color interface', () => {
      const color: Color = {
        val: 'FF0000',
      };
      expect(color.val).toBe('FF0000');
    });

    it('should support theme color', () => {
      const color: Color = {
        val: 'auto',
        themeColor: 'accent1',
        themeTint: '80',
        themeShade: '40',
      };
      expect(color.themeColor).toBe('accent1');
    });
  });

  describe('Shading', () => {
    it('should define Shading interface', () => {
      const shading: Shading = {
        val: 'clear',
        color: 'auto',
        fill: 'FFFF00',
      };
      expect(shading.val).toBe('clear');
      expect(shading.fill).toBe('FFFF00');
    });

    it('should support theme fill', () => {
      const shading: Shading = {
        val: 'solid',
        themeFill: 'accent2',
        themeFillTint: 'BF',
      };
      expect(shading.themeFill).toBe('accent2');
    });
  });

  describe('Spacing', () => {
    it('should define Spacing interface', () => {
      const spacing: Spacing = {
        before: 240,
        after: 120,
        line: 276,
        lineRule: 'auto',
      };
      expect(spacing.before).toBe(240);
      expect(spacing.lineRule).toBe('auto');
    });

    it('should support auto spacing', () => {
      const spacing: Spacing = {
        beforeAutospacing: true,
        afterAutospacing: true,
      };
      expect(spacing.beforeAutospacing).toBe(true);
    });
  });

  describe('Indentation', () => {
    it('should define Indentation interface', () => {
      const indent: Indentation = {
        left: 720,
        right: 0,
        firstLine: 360,
      };
      expect(indent.left).toBe(720);
      expect(indent.firstLine).toBe(360);
    });

    it('should support hanging indent', () => {
      const indent: Indentation = {
        left: 720,
        hanging: 360,
      };
      expect(indent.hanging).toBe(360);
    });

    it('should support character-based indentation', () => {
      const indent: Indentation = {
        leftChars: 100,
        rightChars: 50,
        firstLineChars: 200,
      };
      expect(indent.leftChars).toBe(100);
    });
  });

  describe('Width', () => {
    it('should define Width interface', () => {
      const width: Width = {
        w: 5000,
        type: 'dxa',
      };
      expect(width.w).toBe(5000);
      expect(width.type).toBe('dxa');
    });

    it('should support percentage width', () => {
      const width: Width = {
        w: 50,
        type: 'pct',
      };
      expect(width.type).toBe('pct');
    });

    it('should support auto width', () => {
      const width: Width = {
        type: 'auto',
      };
      expect(width.type).toBe('auto');
    });
  });
});
