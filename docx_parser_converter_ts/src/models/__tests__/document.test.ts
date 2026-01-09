/**
 * Tests for document model interfaces.
 */
import { describe, it, expect } from 'vitest';
import type {
  Document,
  Body,
  BodyContentItem,
  Paragraph,
  ParagraphProperties,
  NumberingProperties,
  TabStop,
  Run,
  RunProperties,
  RunFonts,
  Underline,
  Text,
  Break,
  TabChar,
  Symbol,
  FieldChar,
  DrawingContent,
  FootnoteReference,
  EndnoteReference,
  Hyperlink,
  Table,
  TableProperties,
  TableGrid,
  TableRow,
  TableCell,
  TableCellProperties,
  Drawing,
  InlineDrawing,
  AnchorDrawing,
  DrawingExtent,
  Picture,
  Blip,
  SectionProperties,
  PageSize,
  PageMargins,
  Columns,
} from '../document';

describe('Document Models', () => {
  describe('Document', () => {
    it('should define Document interface with body', () => {
      const doc: Document = {
        body: {
          content: [],
        },
      };
      expect(doc.body).toBeDefined();
      expect(doc.body.content).toEqual([]);
    });
  });

  describe('Body', () => {
    it('should contain content array', () => {
      const body: Body = {
        content: [],
        sectPr: null,
      };
      expect(Array.isArray(body.content)).toBe(true);
    });
  });

  describe('Paragraph', () => {
    it('should define Paragraph with content', () => {
      const para: Paragraph = {
        content: [],
      };
      expect(para.content).toBeDefined();
    });

    it('should support paragraph properties', () => {
      const para: Paragraph = {
        pPr: {
          jc: 'center',
          outlineLvl: 0,
        },
        content: [],
      };
      expect(para.pPr?.jc).toBe('center');
    });
  });

  describe('ParagraphProperties', () => {
    it('should define all paragraph property fields', () => {
      const pPr: ParagraphProperties = {
        pStyle: 'Heading1',
        jc: 'center',
        outlineLvl: 0,
        keepNext: true,
        keepLines: true,
        pageBreakBefore: false,
        widowControl: true,
        suppressAutoHyphens: false,
        bidi: false,
        adjustRightInd: true,
        snapToGrid: true,
        contextualSpacing: false,
        mirrorIndents: false,
        suppressOverlap: false,
        wordWrap: true,
        autoSpaceDE: true,
        autoSpaceDN: true,
        textAlignment: 'auto',
      };
      expect(pPr.pStyle).toBe('Heading1');
      expect(pPr.keepNext).toBe(true);
    });

    it('should support numbering properties', () => {
      const pPr: ParagraphProperties = {
        numPr: {
          numId: 1,
          ilvl: 0,
        },
      };
      expect(pPr.numPr?.numId).toBe(1);
    });

    it('should support indentation and spacing', () => {
      const pPr: ParagraphProperties = {
        ind: { left: 720, hanging: 360 },
        spacing: { before: 240, after: 120 },
      };
      expect(pPr.ind?.left).toBe(720);
      expect(pPr.spacing?.before).toBe(240);
    });
  });

  describe('NumberingProperties', () => {
    it('should define numbering reference', () => {
      const numPr: NumberingProperties = {
        numId: 1,
        ilvl: 0,
      };
      expect(numPr.numId).toBe(1);
      expect(numPr.ilvl).toBe(0);
    });
  });

  describe('TabStop', () => {
    it('should define tab stop', () => {
      const tab: TabStop = {
        val: 'left',
        pos: 720,
        leader: 'dot',
      };
      expect(tab.val).toBe('left');
      expect(tab.pos).toBe(720);
    });
  });

  describe('Run', () => {
    it('should define Run with content', () => {
      const run: Run = {
        content: [{ type: 'text', text: 'Hello' }],
      };
      expect(run.content).toHaveLength(1);
    });

    it('should support run properties', () => {
      const run: Run = {
        rPr: {
          b: true,
          i: true,
          sz: 24,
        },
        content: [],
      };
      expect(run.rPr?.b).toBe(true);
      expect(run.rPr?.sz).toBe(24);
    });
  });

  describe('RunProperties', () => {
    it('should define all formatting properties', () => {
      const rPr: RunProperties = {
        b: true,
        bCs: true,
        i: true,
        iCs: true,
        u: { val: 'single' },
        strike: false,
        dstrike: false,
        vanish: false,
        webHidden: false,
        smallCaps: true,
        caps: false,
        emboss: false,
        imprint: false,
        outline: false,
        shadow: false,
        noProof: false,
        snapToGrid: true,
        specVanish: false,
        oMath: false,
        rtl: false,
        cs: false,
        sz: 24,
        szCs: 24,
        color: { val: 'FF0000' },
        highlight: 'yellow',
        vertAlign: 'superscript',
        position: 6,
        kern: 16,
        spacing: 20,
        w: 100,
      };
      expect(rPr.b).toBe(true);
      expect(rPr.sz).toBe(24);
    });

    it('should support underline with color', () => {
      const underline: Underline = {
        val: 'double',
        color: 'FF0000',
        themeColor: 'accent1',
      };
      expect(underline.val).toBe('double');
      expect(underline.color).toBe('FF0000');
    });
  });

  describe('RunFonts', () => {
    it('should define font families', () => {
      const fonts: RunFonts = {
        ascii: 'Arial',
        hAnsi: 'Arial',
        eastAsia: 'MS Mincho',
        cs: 'Arial',
        hint: 'default',
      };
      expect(fonts.ascii).toBe('Arial');
    });

    it('should support theme fonts', () => {
      const fonts: RunFonts = {
        asciiTheme: 'majorHAnsi',
        hAnsiTheme: 'majorHAnsi',
      };
      expect(fonts.asciiTheme).toBe('majorHAnsi');
    });
  });

  describe('Run Content Items', () => {
    it('should define Text content', () => {
      const text: Text = { type: 'text', text: 'Hello World' };
      expect(text.type).toBe('text');
      expect(text.text).toBe('Hello World');
    });

    it('should define Break content', () => {
      const br: Break = { type: 'break', breakType: 'page' };
      expect(br.type).toBe('break');
      expect(br.breakType).toBe('page');
    });

    it('should define Break with clear', () => {
      const br: Break = { type: 'break', breakType: 'textWrapping', clear: 'all' };
      expect(br.clear).toBe('all');
    });

    it('should define TabChar content', () => {
      const tab: TabChar = { type: 'tab' };
      expect(tab.type).toBe('tab');
    });

    it('should define Symbol content', () => {
      const sym: Symbol = { type: 'sym', font: 'Wingdings', char: 'F0FC' };
      expect(sym.type).toBe('sym');
      expect(sym.font).toBe('Wingdings');
    });

    it('should define FieldChar content', () => {
      const fc: FieldChar = { type: 'fldChar', fldCharType: 'begin' };
      expect(fc.fldCharType).toBe('begin');
    });

    it('should define DrawingContent', () => {
      const drawing: DrawingContent = {
        type: 'drawing',
        drawing: { inline: { extent: { cx: 914400, cy: 914400 } } },
      };
      expect(drawing.type).toBe('drawing');
    });

    it('should define FootnoteReference', () => {
      const fn: FootnoteReference = { type: 'footnoteReference', id: 1 };
      expect(fn.type).toBe('footnoteReference');
      expect(fn.id).toBe(1);
    });

    it('should define EndnoteReference', () => {
      const en: EndnoteReference = { type: 'endnoteReference', id: 1 };
      expect(en.type).toBe('endnoteReference');
      expect(en.id).toBe(1);
    });
  });

  describe('Hyperlink', () => {
    it('should define Hyperlink with content', () => {
      const link: Hyperlink = {
        content: [],
      };
      expect(link.content).toBeDefined();
    });

    it('should support external reference', () => {
      const link: Hyperlink = {
        rId: 'rId1',
        content: [],
      };
      expect(link.rId).toBe('rId1');
    });

    it('should support internal anchor', () => {
      const link: Hyperlink = {
        anchor: 'bookmark1',
        content: [],
      };
      expect(link.anchor).toBe('bookmark1');
    });
  });

  describe('Table', () => {
    it('should define Table with rows', () => {
      const table: Table = {
        tr: [],
      };
      expect(table.tr).toBeDefined();
    });

    it('should support table properties', () => {
      const table: Table = {
        tblPr: {
          tblStyle: 'TableGrid',
          jc: 'center',
        },
        tblGrid: {
          gridCol: [{ w: 2000 }, { w: 2000 }],
        },
        tr: [],
      };
      expect(table.tblPr?.tblStyle).toBe('TableGrid');
    });
  });

  describe('TableProperties', () => {
    it('should define table layout properties', () => {
      const tblPr: TableProperties = {
        tblStyle: 'TableGrid',
        tblW: { w: 5000, type: 'dxa' },
        jc: 'center',
        tblLayout: 'fixed',
      };
      expect(tblPr.tblLayout).toBe('fixed');
    });
  });

  describe('TableGrid', () => {
    it('should define column widths', () => {
      const grid: TableGrid = {
        gridCol: [{ w: 2000 }, { w: 3000 }],
      };
      expect(grid.gridCol).toHaveLength(2);
    });
  });

  describe('TableRow', () => {
    it('should define row with cells', () => {
      const row: TableRow = {
        tc: [],
      };
      expect(row.tc).toBeDefined();
    });

    it('should support row properties', () => {
      const row: TableRow = {
        trPr: {
          tblHeader: true,
          cantSplit: true,
        },
        tc: [],
      };
      expect(row.trPr?.tblHeader).toBe(true);
    });
  });

  describe('TableCell', () => {
    it('should define cell with content', () => {
      const cell: TableCell = {
        content: [],
      };
      expect(cell.content).toBeDefined();
    });

    it('should support cell properties', () => {
      const tcPr: TableCellProperties = {
        tcW: { w: 2000, type: 'dxa' },
        gridSpan: 2,
        vMerge: 'restart',
        vAlign: 'center',
      };
      expect(tcPr.gridSpan).toBe(2);
      expect(tcPr.vMerge).toBe('restart');
    });
  });

  describe('Drawing', () => {
    it('should define inline drawing', () => {
      const drawing: Drawing = {
        inline: {
          extent: { cx: 914400, cy: 914400 },
        },
      };
      expect(drawing.inline).toBeDefined();
    });

    it('should define anchor drawing', () => {
      const drawing: Drawing = {
        anchor: {
          extent: { cx: 914400, cy: 914400 },
          behindDoc: false,
          wrapType: 'square',
        },
      };
      expect(drawing.anchor).toBeDefined();
      expect(drawing.anchor?.wrapType).toBe('square');
    });
  });

  describe('DrawingExtent', () => {
    it('should define dimensions in EMUs', () => {
      const extent: DrawingExtent = {
        cx: 914400,
        cy: 1828800,
      };
      expect(extent.cx).toBe(914400);
      expect(extent.cy).toBe(1828800);
    });
  });

  describe('InlineDrawing', () => {
    it('should define inline drawing with graphic', () => {
      const inline: InlineDrawing = {
        extent: { cx: 914400, cy: 914400 },
        docPr: { id: 1, name: 'Picture 1', descr: 'Alt text' },
        graphic: {
          graphicData: {
            uri: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
            pic: {
              blipFill: {
                blip: { embed: 'rId1' },
              },
            },
          },
        },
      };
      expect(inline.docPr?.descr).toBe('Alt text');
    });
  });

  describe('AnchorDrawing', () => {
    it('should define anchor with positioning', () => {
      const anchor: AnchorDrawing = {
        extent: { cx: 914400, cy: 914400 },
        behindDoc: false,
        hAlign: 'left',
        vAlign: 'top',
        wrapType: 'square',
        distT: 0,
        distB: 0,
        distL: 114300,
        distR: 114300,
      };
      expect(anchor.wrapType).toBe('square');
      expect(anchor.distL).toBe(114300);
    });
  });

  describe('Picture', () => {
    it('should define picture with blip', () => {
      const pic: Picture = {
        blipFill: {
          blip: { embed: 'rId1', link: null },
        },
        spPr: {
          extent: { cx: 914400, cy: 914400 },
        },
      };
      expect(pic.blipFill?.blip?.embed).toBe('rId1');
    });
  });

  describe('Blip', () => {
    it('should define image reference', () => {
      const blip: Blip = {
        embed: 'rId1',
      };
      expect(blip.embed).toBe('rId1');
    });

    it('should support external link', () => {
      const blip: Blip = {
        link: 'rId2',
      };
      expect(blip.link).toBe('rId2');
    });
  });

  describe('SectionProperties', () => {
    it('should define page layout', () => {
      const sectPr: SectionProperties = {
        pgSz: { w: 12240, h: 15840, orient: 'portrait' },
        pgMar: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      };
      expect(sectPr.pgSz?.w).toBe(12240);
      expect(sectPr.pgMar?.top).toBe(1440);
    });

    it('should support columns', () => {
      const cols: Columns = {
        num: 2,
        space: 720,
        equalWidth: true,
        sep: true,
      };
      expect(cols.num).toBe(2);
    });

    it('should support section type', () => {
      const sectPr: SectionProperties = {
        type: 'nextPage',
        titlePg: true,
        bidi: false,
      };
      expect(sectPr.type).toBe('nextPage');
      expect(sectPr.titlePg).toBe(true);
    });
  });

  describe('PageSize', () => {
    it('should define page dimensions', () => {
      const pgSz: PageSize = {
        w: 12240,
        h: 15840,
        orient: 'landscape',
      };
      expect(pgSz.orient).toBe('landscape');
    });
  });

  describe('PageMargins', () => {
    it('should define all margins', () => {
      const pgMar: PageMargins = {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
        header: 720,
        footer: 720,
        gutter: 0,
      };
      expect(pgMar.header).toBe(720);
      expect(pgMar.gutter).toBe(0);
    });
  });
});
