/**
 * Unit tests for main text converter.
 *
 * Tests the documentToText entry point and TextConverter class.
 */

import { describe, it, expect } from 'vitest';
import {
  TextConverter,
  documentToText,
} from '../text-converter';
import type { TextConverterConfig } from '../text-converter';
import type { Document } from '../../../models/document/document';
import type { Paragraph, ParagraphProperties } from '../../../models/document/paragraph';
import type { Table, TableCell, TableRow } from '../../../models/document/table';
import type { Hyperlink } from '../../../models/document/hyperlink';
import type { Run, RunProperties } from '../../../models/document/run';
import type { Text, Break } from '../../../models/document/run-content';
import type { SectionProperties } from '../../../models/document/section';
import type { Numbering } from '../../../models/numbering/numbering';
import type { Styles } from '../../../models/styles/styles';

// =============================================================================
// Helper Functions
// =============================================================================

function createText(value: string, space?: string): Text {
  return { type: 'text', value, space: space ?? null };
}

function createBreak(breakType?: string): Break {
  return { type: 'break', breakType: breakType as any };
}

function createRun(content: any[], rPr?: RunProperties): Run {
  return { content, rPr: rPr ?? null };
}

function createParagraph(content: any[], pPr?: ParagraphProperties): Paragraph {
  return { content, pPr: pPr ?? null };
}

function makeParagraph(text: string, pPr?: ParagraphProperties): Paragraph {
  return createParagraph([createRun([createText(text)])], pPr);
}

function createHyperlink(rId: string, content: Run[]): Hyperlink {
  return { type: 'hyperlink', rId, content };
}

function makeTable(rows: string[][]): Table {
  return {
    tblPr: null,
    tblGrid: null,
    tr: rows.map(row => ({
      tc: row.map(cellText => ({
        tcPr: null,
        content: [makeParagraph(cellText)],
      } as TableCell)),
      trPr: null,
    } as TableRow)),
  };
}

function makeDocument(
  paragraphs?: Paragraph[],
  tables?: Table[],
  sectPr?: SectionProperties
): Document {
  const content: (Paragraph | Table)[] = [];
  if (paragraphs) {
    content.push(...paragraphs);
  }
  if (tables) {
    content.push(...tables);
  }
  return {
    body: {
      content,
      sectPr: sectPr ?? null,
    },
  };
}

// =============================================================================
// Basic Document Conversion Tests
// =============================================================================

describe('TestBasicDocumentConversion', () => {
  it('test_simple_document', () => {
    const doc = makeDocument([makeParagraph('Hello World')]);
    const result = documentToText(doc);
    expect(result).toBe('Hello World');
  });

  it('test_empty_document', () => {
    const doc: Document = { body: { content: [] } };
    const result = documentToText(doc);
    expect(result).toBe('');
  });

  it('test_none_document', () => {
    const result = documentToText(null);
    expect(result).toBe('');
  });

  it('test_undefined_document', () => {
    const result = documentToText(undefined);
    expect(result).toBe('');
  });

  it('test_multiple_paragraphs', () => {
    const doc = makeDocument([
      makeParagraph('Paragraph 1'),
      makeParagraph('Paragraph 2'),
      makeParagraph('Paragraph 3'),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Paragraph 1');
    expect(result).toContain('Paragraph 2');
    expect(result).toContain('Paragraph 3');
    expect(result).toContain('\n');
  });

  it('test_paragraph_separation', () => {
    const doc = makeDocument([
      makeParagraph('First'),
      makeParagraph('Second'),
    ]);
    const result = documentToText(doc);
    const lines = result.trim().split('\n');
    const nonEmpty = lines.filter(line => line.trim());
    expect(nonEmpty.length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// Table Conversion Tests
// =============================================================================

describe('TestTableConversion', () => {
  it('test_document_with_table', () => {
    const table = makeTable([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
    const doc = makeDocument(undefined, [table]);
    const result = documentToText(doc);
    expect(result).toContain('A1');
    expect(result).toContain('B1');
    expect(result).toContain('A2');
    expect(result).toContain('B2');
  });

  it('test_mixed_content', () => {
    const para1 = makeParagraph('Before table');
    const table = makeTable([['Cell1', 'Cell2']]);
    const para2 = makeParagraph('After table');
    const doc: Document = {
      body: {
        content: [para1, table, para2],
      },
    };
    const result = documentToText(doc);
    expect(result).toContain('Before table');
    expect(result).toContain('Cell1');
    expect(result).toContain('After table');
    expect(result.indexOf('Before')).toBeLessThan(result.indexOf('Cell1'));
    expect(result.indexOf('Cell1')).toBeLessThan(result.indexOf('After'));
  });
});

// =============================================================================
// Formatting Mode Tests
// =============================================================================

describe('TestFormattingModes', () => {
  it('test_plain_mode', () => {
    const doc = makeDocument([
      createParagraph([
        createRun([createText('bold')], { b: true }),
      ]),
    ]);
    const config: TextConverterConfig = { formatting: 'plain' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toBe('bold');
    expect(result).not.toContain('**');
  });

  it('test_markdown_mode', () => {
    const doc = makeDocument([
      createParagraph([
        createRun([createText('bold')], { b: true }),
      ]),
    ]);
    const config: TextConverterConfig = { formatting: 'markdown' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('**bold**');
  });
});

// =============================================================================
// Table Mode Tests
// =============================================================================

describe('TestTableModes', () => {
  it('test_ascii_table_mode', () => {
    const table = makeTable([['A', 'B']]);
    const doc = makeDocument(undefined, [table]);
    const config: TextConverterConfig = { tableMode: 'ascii' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_tabs_table_mode', () => {
    const table = makeTable([['A', 'B']]);
    const doc = makeDocument(undefined, [table]);
    const config: TextConverterConfig = { tableMode: 'tabs' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_plain_table_mode', () => {
    const table = makeTable([['A', 'B']]);
    const doc = makeDocument(undefined, [table]);
    const config: TextConverterConfig = { tableMode: 'plain' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_auto_table_mode', () => {
    const table = makeTable([['A', 'B']]);
    const doc = makeDocument(undefined, [table]);
    const config: TextConverterConfig = { tableMode: 'auto' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });
});

// =============================================================================
// Numbering Tests
// =============================================================================

describe('TestNumberingConversion', () => {
  it('test_numbered_list', () => {
    const doc = makeDocument([
      createParagraph(
        [createRun([createText('Item 1')])],
        { numPr: { numId: 1, ilvl: 0 } }
      ),
      createParagraph(
        [createRun([createText('Item 2')])],
        { numPr: { numId: 1, ilvl: 0 } }
      ),
    ]);
    const converter = new TextConverter();
    const result = converter.convert(doc);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
  });

  it('test_bulleted_list', () => {
    const doc = makeDocument([
      createParagraph(
        [createRun([createText('Bullet 1')])],
        { numPr: { numId: 2, ilvl: 0 } }
      ),
    ]);
    const converter = new TextConverter();
    const result = converter.convert(doc);
    expect(result).toContain('Bullet 1');
  });
});

// =============================================================================
// Hyperlink Tests
// =============================================================================

describe('TestHyperlinkConversion', () => {
  it('test_hyperlink_text_extracted', () => {
    const doc = makeDocument([
      createParagraph([
        createHyperlink('rId1', [createRun([createText('Link text')])]),
      ]),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Link text');
  });

  it('test_hyperlink_with_url_in_markdown', () => {
    const doc = makeDocument([
      createParagraph([
        createHyperlink('rId1', [createRun([createText('Example')])]),
      ]),
    ]);
    const config: TextConverterConfig = { formatting: 'markdown' };
    const converter = new TextConverter({
      config,
      hyperlinkUrls: { rId1: 'https://example.com' },
    });
    const result = converter.convert(doc);
    expect(result).toContain('Example');
    expect(result).toContain('https://example.com');
  });
});

// =============================================================================
// Section Break Tests
// =============================================================================

describe('TestSectionBreaks', () => {
  it('test_section_break_as_separator', () => {
    const doc: Document = {
      body: {
        content: [
          makeParagraph('Section 1'),
          makeParagraph('Section 2'),
        ],
        sectPr: {},
      },
    };
    const result = documentToText(doc);
    expect(result).toContain('Section 1');
    expect(result).toContain('Section 2');
  });
});

// =============================================================================
// Empty Paragraph Tests
// =============================================================================

describe('TestEmptyParagraphs', () => {
  it('test_empty_paragraph_preserved', () => {
    const doc = makeDocument([
      makeParagraph('Before'),
      createParagraph([]),
      makeParagraph('After'),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Before');
    expect(result).toContain('After');
    const lines = result.split('\n');
    const nonEmpty = lines.filter(line => line.trim());
    expect(nonEmpty.length).toBe(2);
  });

  it('test_multiple_empty_paragraphs', () => {
    const doc = makeDocument([
      makeParagraph('Text'),
      createParagraph([]),
      createParagraph([]),
      makeParagraph('More'),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Text');
    expect(result).toContain('More');
  });
});

// =============================================================================
// Whitespace Handling Tests
// =============================================================================

describe('TestWhitespaceHandling', () => {
  it('test_preserve_spaces', () => {
    const doc = makeDocument([makeParagraph('Word1  Word2')]);
    const result = documentToText(doc);
    expect(result).toContain('Word1');
    expect(result).toContain('Word2');
  });

  it('test_trailing_newlines_trimmed', () => {
    const doc = makeDocument([makeParagraph('Content')]);
    const result = documentToText(doc);
    expect(result.endsWith('\n\n\n')).toBe(false);
  });
});

// =============================================================================
// TextConverter Class Tests
// =============================================================================

describe('TestTextConverterClass', () => {
  it('test_converter_initialization', () => {
    const converter = new TextConverter();
    expect(converter).not.toBeNull();
  });

  it('test_converter_with_config', () => {
    const config: TextConverterConfig = {
      formatting: 'markdown',
      tableMode: 'ascii',
    };
    const converter = new TextConverter({ config });
    expect(converter.config.formatting).toBe('markdown');
    expect(converter.config.tableMode).toBe('ascii');
  });

  it('test_converter_with_styles', () => {
    const styles: Styles = { docDefaults: null, latentStyles: null, style: [] };
    const converter = new TextConverter({ styles });
    expect(converter.styles).not.toBeNull();
  });

  it('test_converter_with_numbering', () => {
    const numbering: Numbering = { abstractNum: [], num: [] };
    const converter = new TextConverter({ numbering });
    expect(converter.numbering).not.toBeNull();
  });

  it('test_converter_with_hyperlinks', () => {
    const urls = { rId1: 'https://example.com' };
    const converter = new TextConverter({ hyperlinkUrls: urls });
    expect(converter.hyperlinkUrls).toEqual(urls);
  });

  it('test_convert_method', () => {
    const converter = new TextConverter();
    const doc = makeDocument([makeParagraph('Test')]);
    const result = converter.convert(doc);
    expect(result).toBe('Test');
  });

  it('test_convert_null_document', () => {
    const converter = new TextConverter();
    const result = converter.convert(null);
    expect(result).toBe('');
  });

  it('test_convert_undefined_document', () => {
    const converter = new TextConverter();
    const result = converter.convert(undefined);
    expect(result).toBe('');
  });
});

// =============================================================================
// TextConverterConfig Tests
// =============================================================================

describe('TestTextConverterConfig', () => {
  it('test_default_config', () => {
    const converter = new TextConverter();
    expect(converter.config.formatting).toBe('plain');
    expect(converter.config.tableMode).toBe('auto');
  });

  it('test_config_formatting_options', () => {
    const markdownConverter = new TextConverter({ config: { formatting: 'markdown' } });
    expect(markdownConverter.config.formatting).toBe('markdown');

    const plainConverter = new TextConverter({ config: { formatting: 'plain' } });
    expect(plainConverter.config.formatting).toBe('plain');
  });

  it('test_config_table_mode_options', () => {
    const asciiConverter = new TextConverter({ config: { tableMode: 'ascii' } });
    expect(asciiConverter.config.tableMode).toBe('ascii');

    const tabsConverter = new TextConverter({ config: { tableMode: 'tabs' } });
    expect(tabsConverter.config.tableMode).toBe('tabs');

    const plainConverter = new TextConverter({ config: { tableMode: 'plain' } });
    expect(plainConverter.config.tableMode).toBe('plain');

    const autoConverter = new TextConverter({ config: { tableMode: 'auto' } });
    expect(autoConverter.config.tableMode).toBe('auto');
  });

  it('test_config_paragraph_separator', () => {
    const converter = new TextConverter({ config: { paragraphSeparator: '\n' } });
    expect(converter.config.paragraphSeparator).toBe('\n');
  });

  it('test_config_preserve_empty_paragraphs', () => {
    const converter = new TextConverter({ config: { preserveEmptyParagraphs: false } });
    expect(converter.config.preserveEmptyParagraphs).toBe(false);
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('TestEdgeCases', () => {
  it('test_unicode_content', () => {
    const doc = makeDocument([makeParagraph('Hello \u4e16\u754c \ud83c\udf0d')]);
    const result = documentToText(doc);
    expect(result).toBe('Hello \u4e16\u754c \ud83c\udf0d');
  });

  it('test_rtl_content', () => {
    const doc = makeDocument([makeParagraph('\u0645\u0631\u062d\u0628\u0627')]);
    const result = documentToText(doc);
    expect(result).toBe('\u0645\u0631\u062d\u0628\u0627');
  });

  it('test_very_long_document', () => {
    const paragraphs = Array.from({ length: 100 }, (_, i) => makeParagraph(`Paragraph ${i}`));
    const doc = makeDocument(paragraphs);
    const result = documentToText(doc);
    expect(result).toContain('Paragraph 0');
    expect(result).toContain('Paragraph 99');
  });

  it('test_document_with_only_whitespace', () => {
    const doc = makeDocument([
      createParagraph([createRun([createText('   ', 'preserve')])]),
    ]);
    const result = documentToText(doc);
    expect(result.trim() === '' || result === '   ').toBe(true);
  });

  it('test_mixed_formatting_styles', () => {
    const doc = makeDocument([
      createParagraph([
        createRun([createText('Normal ')]),
        createRun([createText('bold')], { b: true }),
        createRun([createText(' ')]),
        createRun([createText('italic')], { i: true }),
      ]),
    ]);
    const config: TextConverterConfig = { formatting: 'markdown' };
    const converter = new TextConverter({ config });
    const result = converter.convert(doc);
    expect(result).toContain('Normal');
    expect(result).toContain('**bold**');
    expect(result).toContain('*italic*');
  });
});

// =============================================================================
// Line Break Tests
// =============================================================================

describe('TestLineBreaks', () => {
  it('test_line_break_within_paragraph', () => {
    const doc = makeDocument([
      createParagraph([
        createRun([
          createText('Line 1'),
          createBreak(),
          createText('Line 2'),
        ]),
      ]),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Line 1\nLine 2');
  });

  it('test_page_break', () => {
    const doc = makeDocument([
      createParagraph([
        createRun([
          createText('Page 1'),
          createBreak('page'),
          createText('Page 2'),
        ]),
      ]),
    ]);
    const result = documentToText(doc);
    expect(result).toContain('Page 1');
    expect(result).toContain('Page 2');
    expect(result).toContain('\n');
  });
});

// =============================================================================
// Document Body Tests
// =============================================================================

describe('TestDocumentBody', () => {
  it('test_document_without_body', () => {
    const doc = { body: undefined } as unknown as Document;
    const converter = new TextConverter();
    const result = converter.convert(doc);
    expect(result).toBe('');
  });

  it('test_document_with_null_body', () => {
    const doc = { body: null } as unknown as Document;
    const converter = new TextConverter();
    const result = converter.convert(doc);
    expect(result).toBe('');
  });

  it('test_document_body_with_null_content', () => {
    const doc = { body: { content: null } } as unknown as Document;
    const converter = new TextConverter();
    const result = converter.convert(doc);
    expect(result).toBe('');
  });
});

// =============================================================================
// Numbering with Definitions Tests
// =============================================================================

describe('TestNumberingWithDefinitions', () => {
  it('test_numbering_with_abstract_definitions', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 1,
          lvl: [
            { ilvl: 0, numFmt: 'decimal', lvlText: '%1.', suff: 'tab' },
          ],
        },
      ],
      num: [
        { numId: 1, abstractNumId: 1 },
      ],
    };
    const doc = makeDocument([
      createParagraph(
        [createRun([createText('First')])],
        { numPr: { numId: 1, ilvl: 0 } }
      ),
      createParagraph(
        [createRun([createText('Second')])],
        { numPr: { numId: 1, ilvl: 0 } }
      ),
    ]);
    const converter = new TextConverter({ numbering });
    const result = converter.convert(doc);
    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  it('test_bullet_numbering', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 2,
          lvl: [
            { ilvl: 0, numFmt: 'bullet', lvlText: '\u2022' },
          ],
        },
      ],
      num: [
        { numId: 2, abstractNumId: 2 },
      ],
    };
    const doc = makeDocument([
      createParagraph(
        [createRun([createText('Bullet item')])],
        { numPr: { numId: 2, ilvl: 0 } }
      ),
    ]);
    const converter = new TextConverter({ numbering });
    const result = converter.convert(doc);
    expect(result).toContain('Bullet item');
  });
});
