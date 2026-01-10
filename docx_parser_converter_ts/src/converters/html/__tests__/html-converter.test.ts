/**
 * Unit tests for main HTML converter entry point.
 *
 * Tests the docxToHtml() function and HTMLConverter class.
 * Matches Python: tests/unit/converters/html/test_html_converter.py
 */

import { describe, it, expect } from 'vitest';
import {
  HTMLConverter,
  docxToHtml,
  docxToHtmlStream,
} from '../html-converter';
import type { ConversionConfig } from '../html-converter';
import type { Document } from '../../../models/document/document';
import type { Paragraph, ParagraphProperties } from '../../../models/document/paragraph';
import type { Run, RunProperties } from '../../../models/document/run';
import type { Table, TableCell } from '../../../models/document/table';
import type { Text } from '../../../models/document/run-content';
import type { Numbering, AbstractNumbering, NumberingInstance } from '../../../models/numbering';
import type { Level } from '../../../models/numbering/level';

// =============================================================================
// Helper Functions
// =============================================================================

function makeText(value: string): Text {
  return { type: 'text', value };
}

function makeRun(text: string, rPr?: RunProperties): Run {
  return {
    content: [makeText(text)],
    rPr,
  };
}

function makeParagraph(text: string, pPr?: ParagraphProperties): Paragraph {
  return {
    content: [makeRun(text)],
    pPr,
  };
}

function makeCell(text: string): TableCell {
  return {
    content: [makeParagraph(text)],
  };
}

function makeTable(cells: string[][]): Table {
  return {
    tr: cells.map(row => ({
      tc: row.map(text => makeCell(text)),
    })),
  };
}

function makeDocument(content: (Paragraph | Table)[]): Document {
  return {
    body: {
      content,
    },
  };
}

// =============================================================================
// Basic Conversion Tests
// =============================================================================

describe('Basic Conversion', () => {
  it('should convert simple document with one paragraph', () => {
    const doc = makeDocument([makeParagraph('Hello World')]);
    const result = docxToHtml(doc);
    expect(result).toContain('Hello World');
  });

  it('should convert empty document', () => {
    const doc = makeDocument([]);
    const result = docxToHtml(doc);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
  });

  it('should handle null document', () => {
    const result = docxToHtml(null);
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should handle undefined document', () => {
    const result = docxToHtml(undefined);
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should convert multiple paragraphs', () => {
    const doc = makeDocument([
      makeParagraph('Paragraph 1'),
      makeParagraph('Paragraph 2'),
      makeParagraph('Paragraph 3'),
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('Paragraph 1');
    expect(result).toContain('Paragraph 2');
    expect(result).toContain('Paragraph 3');
  });
});

// =============================================================================
// Conversion Config Tests
// =============================================================================

describe('ConversionConfig', () => {
  it('should use default config values', () => {
    const config: ConversionConfig = {};
    expect(config.styleMode ?? 'inline').toBe('inline');
    expect(config.useSemanticTags ?? false).toBe(false);
    expect(config.preserveWhitespace ?? false).toBe(false);
    expect(config.includeDefaultStyles ?? true).toBe(true);
  });

  it('should apply inline styles mode', () => {
    const config: ConversionConfig = { styleMode: 'inline' };
    const doc = makeDocument([
      {
        pPr: { jc: 'center' },
        content: [makeRun('Centered')],
      },
    ]);
    const converter = new HTMLConverter(config);
    const result = converter.convert(doc);
    expect(result).toContain('style=');
  });

  it('should set document title', () => {
    const config: ConversionConfig = { title: 'My Document' };
    const doc = makeDocument([]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('<title>My Document</title>');
  });

  it('should set language attribute', () => {
    const config: ConversionConfig = { language: 'fr' };
    const doc = makeDocument([]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('lang="fr"');
  });

  it('should apply semantic tags when enabled', () => {
    const config: ConversionConfig = { useSemanticTags: true };
    const doc = makeDocument([
      {
        content: [{ rPr: { b: true }, content: [makeText('Bold')] }],
      },
    ]);
    const converter = new HTMLConverter(config);
    const result = converter.convert(doc);
    expect(result).toContain('<strong>');
  });

  it('should preserve whitespace config', () => {
    const config: ConversionConfig = { preserveWhitespace: true };
    expect(config.preserveWhitespace).toBe(true);
  });

  it('should include default styles config', () => {
    const config: ConversionConfig = { includeDefaultStyles: true };
    expect(config.includeDefaultStyles).toBe(true);
  });
});

// =============================================================================
// Style Resolution Tests
// =============================================================================

describe('Style Resolution', () => {
  it('should accept null styles', () => {
    const converter = new HTMLConverter({}, { styles: undefined });
    expect(converter.styles).toBeUndefined();
  });

  it('should apply paragraph alignment style', () => {
    const doc = makeDocument([
      {
        pPr: { jc: 'right' },
        content: [makeRun('Right aligned')],
      },
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('text-align');
  });

  it('should apply direct formatting', () => {
    const doc = makeDocument([
      {
        content: [
          {
            rPr: { b: true, i: true },
            content: [makeText('Bold and Italic')],
          },
        ],
      },
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('Bold and Italic');
  });

  it('should handle document defaults', () => {
    const converter = new HTMLConverter();
    expect(converter.config).toBeDefined();
  });
});

// =============================================================================
// Numbering Tests
// =============================================================================

describe('Numbering Conversion', () => {
  it('should accept null numbering', () => {
    const converter = new HTMLConverter({}, { numbering: undefined });
    expect(converter.numbering).toBeUndefined();
  });

  it('should have numbering tracker', () => {
    const converter = new HTMLConverter();
    expect(converter['_numberingTracker']).toBeDefined();
  });

  it('should convert numbered list with prefix', () => {
    const level: Level = { ilvl: 0, numFmt: 'decimal', lvlText: '%1.' };
    const abstract: AbstractNumbering = { abstractNumId: 1, lvl: [level] };
    const instance: NumberingInstance = { numId: 1, abstractNumId: 1 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      {
        pPr: { numPr: { numId: 1, ilvl: 0 } },
        content: [makeRun('First item')],
      },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('First item');
    expect(result).toContain('1.');
  });

  it('should convert bulleted list with prefix', () => {
    const level: Level = { ilvl: 0, numFmt: 'bullet', lvlText: '•' };
    const abstract: AbstractNumbering = { abstractNumId: 2, lvl: [level] };
    const instance: NumberingInstance = { numId: 2, abstractNumId: 2 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      {
        pPr: { numPr: { numId: 2, ilvl: 0 } },
        content: [makeRun('Bullet item')],
      },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('Bullet item');
    expect(result).toContain('•');
  });

  it('should increment numbered items sequentially', () => {
    const level: Level = { ilvl: 0, numFmt: 'decimal', lvlText: '%1.' };
    const abstract: AbstractNumbering = { abstractNumId: 4, lvl: [level] };
    const instance: NumberingInstance = { numId: 4, abstractNumId: 4 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 4, ilvl: 0 } }, content: [makeRun('Item one')] },
      { pPr: { numPr: { numId: 4, ilvl: 0 } }, content: [makeRun('Item two')] },
      { pPr: { numPr: { numId: 4, ilvl: 0 } }, content: [makeRun('Item three')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('Item one');
    expect(result).toContain('Item two');
    expect(result).toContain('Item three');
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
  });

  it('should use roman numerals for lowerRoman format', () => {
    const level: Level = { ilvl: 0, numFmt: 'lowerRoman', lvlText: '%1.' };
    const abstract: AbstractNumbering = { abstractNumId: 5, lvl: [level] };
    const instance: NumberingInstance = { numId: 5, abstractNumId: 5 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 5, ilvl: 0 } }, content: [makeRun('Roman item')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('Roman item');
    expect(result).toContain('i.');
  });

  it('should have no prefix for paragraph without numbering', () => {
    const doc = makeDocument([makeParagraph('No list')]);
    const converter = new HTMLConverter({}, { numbering: undefined });
    const result = converter.convert(doc);

    expect(result).toContain('No list');
    expect(result).not.toContain('list-marker');
    expect(result).not.toContain('•');
  });
});

// =============================================================================
// Table Conversion Tests
// =============================================================================

describe('Table Conversion', () => {
  it('should convert simple table', () => {
    const doc = makeDocument([
      makeTable([['Cell 1', 'Cell 2']]),
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('<table');
    expect(result).toContain('Cell 1');
    expect(result).toContain('Cell 2');
  });

  it('should convert table with merged cells', () => {
    const doc = makeDocument([
      makeTable([['Merged']]),
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('<table');
  });

  it('should convert table with styles', () => {
    const table: Table = {
      tblPr: { jc: 'center' },
      tr: [{ tc: [makeCell('Styled')] }],
    };
    const doc = makeDocument([table]);
    const result = docxToHtml(doc);
    expect(result).toContain('<table');
  });
});

// =============================================================================
// Hyperlink Tests
// =============================================================================

describe('Hyperlink Conversion', () => {
  it('should accept relationships map', () => {
    const converter = new HTMLConverter({}, {
      relationships: { rId1: 'https://example.com' },
    });
    expect(converter.relationships['rId1']).toBe('https://example.com');
  });

  it('should default to empty relationships', () => {
    const converter = new HTMLConverter();
    expect(converter.relationships).toEqual({});
  });
});

// =============================================================================
// Fragment Mode Tests
// =============================================================================

describe('Fragment Mode', () => {
  it('should output fragment without wrapper', () => {
    const config: ConversionConfig = { fragmentOnly: true };
    const doc = makeDocument([makeParagraph('Test')]);
    const result = docxToHtml(doc, { config });
    expect(result).not.toContain('<!DOCTYPE');
    expect(result).not.toContain('<html');
  });

  it('should output just content in fragment mode', () => {
    const config: ConversionConfig = { fragmentOnly: true };
    const doc = makeDocument([makeParagraph('Just content')]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('Just content');
    expect(result).not.toContain('<body');
  });
});

// =============================================================================
// Custom CSS Tests
// =============================================================================

describe('Custom CSS', () => {
  it('should add custom CSS string', () => {
    const config: ConversionConfig = { customCss: 'p { color: red; }' };
    const doc = makeDocument([]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('color: red');
  });

  it('should reference external CSS file', () => {
    const config: ConversionConfig = { cssFiles: ['custom.css'] };
    const doc = makeDocument([]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('href="custom.css"');
  });
});

// =============================================================================
// Unicode Tests
// =============================================================================

describe('Unicode Handling', () => {
  it('should handle CJK content', () => {
    const doc = makeDocument([makeParagraph('你好世界')]);
    const result = docxToHtml(doc);
    expect(result).toContain('你好世界');
  });

  it('should handle Arabic content', () => {
    const doc = makeDocument([makeParagraph('مرحبا')]);
    const result = docxToHtml(doc);
    expect(result).toContain('مرحبا');
  });

  it('should handle emoji content', () => {
    const doc = makeDocument([makeParagraph('Hello 🌍')]);
    const result = docxToHtml(doc);
    expect(result).toContain('🌍');
  });

  it('should handle mixed scripts', () => {
    const doc = makeDocument([makeParagraph('Hello 世界 مرحبا')]);
    const result = docxToHtml(doc);
    expect(result).toContain('Hello');
    expect(result).toContain('世界');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty paragraphs', () => {
    const doc = makeDocument([
      { content: [] },
      makeParagraph('Not empty'),
      { content: [] },
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('Not empty');
  });

  it('should handle empty runs', () => {
    const doc = makeDocument([
      {
        content: [
          { content: [] },
          makeRun('Content'),
          { content: [] },
        ],
      },
    ]);
    const result = docxToHtml(doc);
    expect(result).toContain('Content');
  });

  it('should handle very long paragraphs', () => {
    const longText = 'A'.repeat(10000);
    const doc = makeDocument([makeParagraph(longText)]);
    const result = docxToHtml(doc);
    expect(result).toContain(longText);
  });
});

// =============================================================================
// HTMLConverter Class Tests
// =============================================================================

describe('HTMLConverter Class', () => {
  it('should initialize with config', () => {
    const config: ConversionConfig = { title: 'Test' };
    const converter = new HTMLConverter(config);
    expect(converter.config).toEqual(expect.objectContaining({ title: 'Test' }));
  });

  it('should initialize with styles and numbering', () => {
    const converter = new HTMLConverter({}, { styles: undefined, numbering: undefined });
    expect(converter.styles).toBeUndefined();
    expect(converter.numbering).toBeUndefined();
  });

  it('should convert document', () => {
    const converter = new HTMLConverter();
    const doc = makeDocument([makeParagraph('Test')]);
    const result = converter.convert(doc);
    expect(result).toContain('Test');
  });

  it('should convert paragraph', () => {
    const converter = new HTMLConverter();
    const para = makeParagraph('Test');
    const result = converter.convertParagraph(para);
    expect(result).toContain('Test');
  });

  it('should convert table', () => {
    const converter = new HTMLConverter();
    const table = makeTable([['Cell']]);
    const result = converter.convertTable(table);
    expect(result).toContain('<table');
    expect(result).toContain('Cell');
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance', () => {
  it('should convert large document', () => {
    const paragraphs = Array.from({ length: 100 }, (_, i) =>
      makeParagraph(`Paragraph ${i}`)
    );
    const doc = makeDocument(paragraphs);
    const result = docxToHtml(doc);
    expect(result).toContain('Paragraph 0');
    expect(result).toContain('Paragraph 99');
  });

  it('should convert document with many tables', () => {
    const tables = Array.from({ length: 10 }, (_, i) =>
      makeTable([[`Table ${i}`]])
    );
    const doc = makeDocument(tables);
    const result = docxToHtml(doc);
    expect(result).toContain('Table 0');
  });
});

// =============================================================================
// Streaming Output Tests
// =============================================================================

describe('Streaming Output', () => {
  it('should stream output', () => {
    const doc = makeDocument([makeParagraph('Test')]);
    const chunks = docxToHtmlStream(doc);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toContain('Test');
  });
});

// =============================================================================
// Numbering Indentation Tests
// =============================================================================

describe('Numbering Indentation', () => {
  it('should extract indentation from level p_pr', () => {
    const level: Level = {
      ilvl: 0,
      numFmt: 'decimal',
      lvlText: '%1.',
      pPr: { ind: { left: 720, hanging: 360 } },
    };
    const abstract: AbstractNumbering = { abstractNumId: 10, lvl: [level] };
    const instance: NumberingInstance = { numId: 10, abstractNumId: 10 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 10, ilvl: 0 } }, content: [makeRun('Indented item')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    // 720 twips / 20 = 36pt
    expect(result).toContain('36');
    expect(result).toContain('Indented item');
  });

  it('should handle different indentation for multi-level', () => {
    const levels: Level[] = [
      { ilvl: 0, numFmt: 'decimal', lvlText: '%1.', pPr: { ind: { left: 720 } } },
      { ilvl: 1, numFmt: 'decimal', lvlText: '%1.%2.', pPr: { ind: { left: 1440 } } },
    ];
    const abstract: AbstractNumbering = { abstractNumId: 11, lvl: levels };
    const instance: NumberingInstance = { numId: 11, abstractNumId: 11 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 11, ilvl: 0 } }, content: [makeRun('Level 0')] },
      { pPr: { numPr: { numId: 11, ilvl: 1 } }, content: [makeRun('Level 1')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('36');  // Level 0: 720/20 = 36pt
    expect(result).toContain('72');  // Level 1: 1440/20 = 72pt
  });

  it('should handle no indentation when p_pr missing', () => {
    const level: Level = { ilvl: 0, numFmt: 'decimal', lvlText: '%1.' };
    const abstract: AbstractNumbering = { abstractNumId: 12, lvl: [level] };
    const instance: NumberingInstance = { numId: 12, abstractNumId: 12 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 12, ilvl: 0 } }, content: [makeRun('No indent')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('No indent');
  });
});

// =============================================================================
// Numbering Styles Tests
// =============================================================================

describe('Numbering Styles', () => {
  it('should apply bold marker style from level r_pr', () => {
    const level: Level = {
      ilvl: 0,
      numFmt: 'decimal',
      lvlText: '%1.',
      rPr: { b: true },
      pPr: { ind: { left: 720 } },
    };
    const abstract: AbstractNumbering = { abstractNumId: 20, lvl: [level] };
    const instance: NumberingInstance = { numId: 20, abstractNumId: 20 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 20, ilvl: 0 } }, content: [makeRun('Bold marker item')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('list-marker');
    expect(result).toContain('font-weight');
  });

  it('should apply italic marker style from level r_pr', () => {
    const level: Level = {
      ilvl: 0,
      numFmt: 'decimal',
      lvlText: '%1.',
      rPr: { i: true },
      pPr: { ind: { left: 720 } },
    };
    const abstract: AbstractNumbering = { abstractNumId: 21, lvl: [level] };
    const instance: NumberingInstance = { numId: 21, abstractNumId: 21 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 21, ilvl: 0 } }, content: [makeRun('Italic marker item')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('list-marker');
    expect(result).toContain('font-style');
  });

  it('should have no marker style when r_pr missing', () => {
    const level: Level = {
      ilvl: 0,
      numFmt: 'decimal',
      lvlText: '%1.',
      pPr: { ind: { left: 720 } },
    };
    const abstract: AbstractNumbering = { abstractNumId: 26, lvl: [level] };
    const instance: NumberingInstance = { numId: 26, abstractNumId: 26 };
    const numbering: Numbering = { abstractNum: [abstract], num: [instance] };

    const doc = makeDocument([
      { pPr: { numPr: { numId: 26, ilvl: 0 } }, content: [makeRun('Plain marker')] },
    ]);

    const converter = new HTMLConverter({}, { numbering });
    const result = converter.convert(doc);

    expect(result).toContain('Plain marker');
    expect(result).toContain('list-marker');
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Accessibility', () => {
  it('should set language attribute', () => {
    const config: ConversionConfig = { language: 'fr' };
    const doc = makeDocument([]);
    const result = docxToHtml(doc, { config });
    expect(result).toContain('lang="fr"');
  });
});

// =============================================================================
// CSS Variables Tests
// =============================================================================

describe('CSS Variables', () => {
  it('should support use_css_variables config', () => {
    const config: ConversionConfig = { useCssVariables: true };
    expect(config.useCssVariables).toBe(true);
  });
});

// =============================================================================
// Image Tests
// =============================================================================

describe('Image Conversion', () => {
  function makeImageData(relId: string = 'rId1'): Map<string, { bytes: Uint8Array; contentType: string }> {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const bytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
    return new Map([[relId, { bytes, contentType: 'image/png' }]]);
  }

  it('should accept image data', () => {
    const imageData = makeImageData();
    const converter = new HTMLConverter({}, { imageData });
    expect(converter.imageData).toBeDefined();
  });

  it('should convert inline image in paragraph', () => {
    const imageData = makeImageData();
    const doc: Document = {
      body: {
        content: [
          {
            content: [
              {
                content: [
                  {
                    type: 'drawing',
                    drawing: {
                      inline: {
                        extent: { cx: 952500, cy: 952500 },
                        docPr: { id: 1, descr: 'Alt text' },
                        graphic: {
                          graphicData: {
                            pic: {
                              blipFill: {
                                blip: { embed: 'rId1' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const converter = new HTMLConverter({}, { imageData });
    const result = converter.convert(doc);

    expect(result).toContain('<img ');
    expect(result).toContain('src="data:image/png;base64,');
    expect(result).toContain('alt="Alt text"');
  });

  it('should skip image without matching data', () => {
    const doc: Document = {
      body: {
        content: [
          {
            content: [
              {
                content: [
                  {
                    type: 'drawing',
                    drawing: {
                      inline: {
                        extent: { cx: 952500, cy: 952500 },
                        docPr: { id: 1 },
                        graphic: {
                          graphicData: {
                            pic: {
                              blipFill: {
                                blip: { embed: 'rId999' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const converter = new HTMLConverter({}, { imageData: new Map() });
    const result = converter.convert(doc);

    expect(result).not.toContain('<img ');
  });
});
