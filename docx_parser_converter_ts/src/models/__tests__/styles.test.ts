/**
 * Tests for style model interfaces.
 */
import { describe, it, expect } from 'vitest';
import type {
  Styles,
  Style,
  DocumentDefaults,
  RunPropertiesDefault,
  ParagraphPropertiesDefault,
  LatentStyles,
  LatentStyleException,
  TableStyleProperties,
} from '../styles';

describe('Style Models', () => {
  describe('Styles', () => {
    it('should define Styles root container', () => {
      const styles: Styles = {
        style: [],
      };
      expect(styles.style).toBeDefined();
    });

    it('should contain document defaults', () => {
      const styles: Styles = {
        docDefaults: {
          rPrDefault: { rPr: { sz: 22 } },
          pPrDefault: { pPr: { spacing: { after: 200 } } },
        },
        style: [],
      };
      expect(styles.docDefaults).toBeDefined();
    });

    it('should contain latent styles', () => {
      const styles: Styles = {
        latentStyles: {
          defUIPriority: 99,
          defSemiHidden: true,
          lsdException: [],
        },
        style: [],
      };
      expect(styles.latentStyles?.defUIPriority).toBe(99);
    });
  });

  describe('Style', () => {
    it('should define paragraph style', () => {
      const style: Style = {
        type: 'paragraph',
        styleId: 'Heading1',
        name: 'heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        qFormat: true,
        uiPriority: 9,
      };
      expect(style.type).toBe('paragraph');
      expect(style.styleId).toBe('Heading1');
    });

    it('should define character style', () => {
      const style: Style = {
        type: 'character',
        styleId: 'Strong',
        name: 'Strong',
        rPr: { b: true },
      };
      expect(style.type).toBe('character');
      expect(style.rPr?.b).toBe(true);
    });

    it('should define table style', () => {
      const style: Style = {
        type: 'table',
        styleId: 'TableGrid',
        name: 'Table Grid',
        tblPr: { tblLayout: 'fixed' },
        tblStylePr: [
          {
            type: 'firstRow',
            rPr: { b: true },
          },
        ],
      };
      expect(style.type).toBe('table');
      expect(style.tblStylePr).toHaveLength(1);
    });

    it('should define numbering style', () => {
      const style: Style = {
        type: 'numbering',
        styleId: 'BulletList',
        name: 'Bullet List',
      };
      expect(style.type).toBe('numbering');
    });

    it('should support style inheritance', () => {
      const style: Style = {
        type: 'paragraph',
        styleId: 'Heading2',
        basedOn: 'Heading1',
        next: 'Normal',
        link: 'Heading2Char',
      };
      expect(style.basedOn).toBe('Heading1');
      expect(style.link).toBe('Heading2Char');
    });

    it('should support visibility settings', () => {
      const style: Style = {
        type: 'paragraph',
        styleId: 'Internal',
        hidden: true,
        semiHidden: true,
        unhideWhenUsed: true,
        locked: false,
      };
      expect(style.hidden).toBe(true);
      expect(style.semiHidden).toBe(true);
    });

    it('should support default style flag', () => {
      const style: Style = {
        type: 'paragraph',
        styleId: 'Normal',
        default: true,
      };
      expect(style.default).toBe(true);
    });

    it('should support custom style flag', () => {
      const style: Style = {
        type: 'paragraph',
        styleId: 'MyCustomStyle',
        customStyle: true,
      };
      expect(style.customStyle).toBe(true);
    });
  });

  describe('DocumentDefaults', () => {
    it('should define document defaults', () => {
      const defaults: DocumentDefaults = {};
      expect(defaults).toBeDefined();
    });

    it('should contain run property defaults', () => {
      const defaults: DocumentDefaults = {
        rPrDefault: {
          rPr: {
            rFonts: { ascii: 'Times New Roman' },
            sz: 24,
          },
        },
      };
      expect(defaults.rPrDefault?.rPr?.sz).toBe(24);
    });

    it('should contain paragraph property defaults', () => {
      const defaults: DocumentDefaults = {
        pPrDefault: {
          pPr: {
            spacing: { after: 160, line: 259, lineRule: 'auto' },
          },
        },
      };
      expect(defaults.pPrDefault?.pPr?.spacing?.after).toBe(160);
    });
  });

  describe('RunPropertiesDefault', () => {
    it('should wrap run properties', () => {
      const rPrDefault: RunPropertiesDefault = {
        rPr: {
          sz: 22,
          rFonts: { ascii: 'Calibri' },
        },
      };
      expect(rPrDefault.rPr?.sz).toBe(22);
    });
  });

  describe('ParagraphPropertiesDefault', () => {
    it('should wrap paragraph properties', () => {
      const pPrDefault: ParagraphPropertiesDefault = {
        pPr: {
          spacing: { after: 200, line: 276 },
        },
      };
      expect(pPrDefault.pPr?.spacing?.after).toBe(200);
    });
  });

  describe('LatentStyles', () => {
    it('should define default values', () => {
      const latent: LatentStyles = {
        defLockedState: false,
        defUIPriority: 99,
        defSemiHidden: false,
        defUnhideWhenUsed: false,
        defQFormat: false,
        count: 376,
      };
      expect(latent.defUIPriority).toBe(99);
      expect(latent.count).toBe(376);
    });

    it('should contain exceptions', () => {
      const latent: LatentStyles = {
        defUIPriority: 99,
        lsdException: [
          { name: 'Normal', uiPriority: 0, qFormat: true },
          { name: 'heading 1', uiPriority: 9, qFormat: true },
        ],
      };
      expect(latent.lsdException).toHaveLength(2);
    });
  });

  describe('LatentStyleException', () => {
    it('should define style exception', () => {
      const exception: LatentStyleException = {
        name: 'heading 1',
        locked: false,
        uiPriority: 9,
        semiHidden: false,
        unhideWhenUsed: false,
        qFormat: true,
      };
      expect(exception.name).toBe('heading 1');
      expect(exception.qFormat).toBe(true);
    });
  });

  describe('TableStyleProperties', () => {
    it('should define conditional formatting', () => {
      const tblStylePr: TableStyleProperties = {
        type: 'firstRow',
        rPr: { b: true },
        tcPr: { shd: { val: 'clear', fill: '4472C4' } },
      };
      expect(tblStylePr.type).toBe('firstRow');
      expect(tblStylePr.rPr?.b).toBe(true);
    });

    it('should support all condition types', () => {
      const conditions: TableStyleProperties[] = [
        { type: 'wholeTable' },
        { type: 'firstRow' },
        { type: 'lastRow' },
        { type: 'firstCol' },
        { type: 'lastCol' },
        { type: 'band1Vert' },
        { type: 'band2Vert' },
        { type: 'band1Horz' },
        { type: 'band2Horz' },
        { type: 'neCell' },
        { type: 'nwCell' },
        { type: 'seCell' },
        { type: 'swCell' },
      ];
      expect(conditions).toHaveLength(13);
    });
  });
});
