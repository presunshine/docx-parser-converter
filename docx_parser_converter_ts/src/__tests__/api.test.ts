/**
 * Unit tests for the public API module.
 *
 * Tests the API functions and ConversionConfig without actual DOCX files.
 */

import { describe, it, expect } from 'vitest';
import { docxToHtml, docxToText } from '../api';
import { DEFAULT_CONFIG, toHtmlConfig, toTextConfig } from '../config';
import type { ConversionConfig } from '../config';
import type { Document, Body, BodyContentItem } from '../models/document/document';
import type { Paragraph } from '../models/document/paragraph';
import type { Run } from '../models/document/run';
import type { Text } from '../models/document/run-content';
import type { Table, TableRow, TableCell } from '../models/document/table';

// =============================================================================
// Helper Functions
// =============================================================================

function makeText(value: string): Text {
  return { type: 'text', value };
}

function makeRun(text: string): Run {
  return { content: [makeText(text)] };
}

function makeParagraph(text: string): Paragraph {
  return { content: [makeRun(text)] };
}

function makeTableCell(text: string): TableCell {
  return { content: [makeParagraph(text)] };
}

function makeTableRow(cells: string[]): TableRow {
  return { tc: cells.map(makeTableCell) };
}

function makeTable(rows: string[][]): Table {
  return { tr: rows.map(makeTableRow) };
}

function makeDocument(
  paragraphs?: Paragraph[],
  tables?: Table[]
): Document {
  const content: BodyContentItem[] = [];
  if (paragraphs) {
    content.push(...paragraphs);
  }
  if (tables) {
    content.push(...tables);
  }
  const body: Body = { content };
  return { body };
}

// =============================================================================
// ConversionConfig Tests
// =============================================================================

describe('TestConversionConfigDefaults', () => {
  it('test_default_style_mode', () => {
    expect(DEFAULT_CONFIG.styleMode).toBe('inline');
  });

  it('test_default_use_semantic_tags', () => {
    expect(DEFAULT_CONFIG.useSemanticTags).toBe(false);
  });

  it('test_default_preserve_whitespace', () => {
    expect(DEFAULT_CONFIG.preserveWhitespace).toBe(false);
  });

  it('test_default_include_default_styles', () => {
    expect(DEFAULT_CONFIG.includeDefaultStyles).toBe(true);
  });

  it('test_default_title', () => {
    expect(DEFAULT_CONFIG.title).toBe('');
  });

  it('test_default_language', () => {
    expect(DEFAULT_CONFIG.language).toBe('en');
  });

  it('test_default_fragment_only', () => {
    expect(DEFAULT_CONFIG.fragmentOnly).toBe(false);
  });

  it('test_default_custom_css', () => {
    expect(DEFAULT_CONFIG.customCss).toBeNull();
  });

  it('test_default_css_files', () => {
    expect(DEFAULT_CONFIG.cssFiles).toEqual([]);
  });

  it('test_default_use_css_variables', () => {
    expect(DEFAULT_CONFIG.useCssVariables).toBe(false);
  });

  it('test_default_responsive', () => {
    expect(DEFAULT_CONFIG.responsive).toBe(true);
  });

  it('test_default_include_print_styles', () => {
    expect(DEFAULT_CONFIG.includePrintStyles).toBe(false);
  });

  it('test_default_text_formatting', () => {
    expect(DEFAULT_CONFIG.textFormatting).toBe('plain');
  });

  it('test_default_table_mode', () => {
    expect(DEFAULT_CONFIG.tableMode).toBe('auto');
  });

  it('test_default_paragraph_separator', () => {
    expect(DEFAULT_CONFIG.paragraphSeparator).toBe('\n\n');
  });

  it('test_default_preserve_empty_paragraphs', () => {
    expect(DEFAULT_CONFIG.preserveEmptyParagraphs).toBe(true);
  });
});

describe('TestConversionConfigCustomization', () => {
  it('test_custom_style_mode', () => {
    const config: ConversionConfig = { styleMode: 'class' };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.styleMode).toBe('class');
  });

  it('test_custom_semantic_tags', () => {
    const config: ConversionConfig = { useSemanticTags: true };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.useSemanticTags).toBe(true);
  });

  it('test_custom_title', () => {
    const config: ConversionConfig = { title: 'My Document' };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.title).toBe('My Document');
  });

  it('test_custom_language', () => {
    const config: ConversionConfig = { language: 'de' };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.language).toBe('de');
  });

  it('test_custom_css', () => {
    const config: ConversionConfig = { customCss: 'body { color: red; }' };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.customCss).toBe('body { color: red; }');
  });

  it('test_custom_css_files', () => {
    const config: ConversionConfig = { cssFiles: ['style.css', 'theme.css'] };
    const htmlConfig = toHtmlConfig(config);
    expect(htmlConfig.cssFiles).toEqual(['style.css', 'theme.css']);
  });

  it('test_custom_text_formatting', () => {
    const config: ConversionConfig = { textFormatting: 'markdown' };
    const textConfig = toTextConfig(config);
    expect(textConfig.formatting).toBe('markdown');
  });

  it('test_custom_table_mode', () => {
    const config: ConversionConfig = { tableMode: 'ascii' };
    const textConfig = toTextConfig(config);
    expect(textConfig.tableMode).toBe('ascii');
  });

  it('test_custom_paragraph_separator', () => {
    const config: ConversionConfig = { paragraphSeparator: '\n' };
    const textConfig = toTextConfig(config);
    expect(textConfig.paragraphSeparator).toBe('\n');
  });
});

// =============================================================================
// docxToHtml with Document Model Tests
// =============================================================================

describe('TestDocxToHtmlWithModel', () => {
  it('test_none_document', async () => {
    const result = await docxToHtml(null);

    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('test_undefined_document', async () => {
    const result = await docxToHtml(undefined);

    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('test_empty_document', async () => {
    const doc = makeDocument([]);
    const result = await docxToHtml(doc);

    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('test_simple_paragraph_document', async () => {
    const doc = makeDocument([makeParagraph('Hello World')]);
    const result = await docxToHtml(doc);

    expect(result).toContain('Hello World');
    expect(result).toContain('<p');
  });

  it('test_multiple_paragraphs', async () => {
    const doc = makeDocument([
      makeParagraph('First paragraph'),
      makeParagraph('Second paragraph'),
    ]);
    const result = await docxToHtml(doc);

    expect(result).toContain('First paragraph');
    expect(result).toContain('Second paragraph');
  });

  it('test_document_with_table', async () => {
    const table = makeTable([['A', 'B'], ['C', 'D']]);
    const doc = makeDocument(undefined, [table]);
    const result = await docxToHtml(doc);

    expect(result).toContain('<table');
    expect(result).toContain('A');
    expect(result).toContain('D');
  });

  it('test_fragment_only_mode', async () => {
    const doc = makeDocument([makeParagraph('Content')]);
    const config: ConversionConfig = { fragmentOnly: true };
    const result = await docxToHtml(doc, config);

    expect(result).not.toContain('<!DOCTYPE html>');
    expect(result).toContain('Content');
  });

  it('test_custom_title', async () => {
    const doc = makeDocument([makeParagraph('Content')]);
    const config: ConversionConfig = { title: 'My Title' };
    const result = await docxToHtml(doc, config);

    expect(result).toContain('<title>My Title</title>');
  });
});

// =============================================================================
// docxToText with Document Model Tests
// =============================================================================

describe('TestDocxToTextWithModel', () => {
  it('test_none_document', async () => {
    const result = await docxToText(null);

    expect(result).toBe('');
  });

  it('test_undefined_document', async () => {
    const result = await docxToText(undefined);

    expect(result).toBe('');
  });

  it('test_empty_document', async () => {
    const doc = makeDocument([]);
    const result = await docxToText(doc);

    expect(result).toBe('');
  });

  it('test_simple_paragraph_document', async () => {
    const doc = makeDocument([makeParagraph('Hello World')]);
    const result = await docxToText(doc);

    expect(result).toBe('Hello World');
  });

  it('test_multiple_paragraphs', async () => {
    const doc = makeDocument([
      makeParagraph('First'),
      makeParagraph('Second'),
    ]);
    const result = await docxToText(doc);

    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  it('test_document_with_table', async () => {
    const table = makeTable([['A', 'B']]);
    const doc = makeDocument(undefined, [table]);
    const result = await docxToText(doc);

    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_markdown_mode', async () => {
    const doc = makeDocument([makeParagraph('Text')]);
    const config: ConversionConfig = { textFormatting: 'markdown' };
    const result = await docxToText(doc, config);

    expect(result).toContain('Text');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('TestEdgeCases', () => {
  it('test_unicode_content', async () => {
    const doc = makeDocument([makeParagraph('Hello 世界 🌍')]);

    const html = await docxToHtml(doc);
    const text = await docxToText(doc);

    expect(html).toContain('Hello 世界 🌍');
    expect(text).toContain('Hello 世界 🌍');
  });

  it('test_empty_paragraph', async () => {
    const emptyPara: Paragraph = { content: [] };
    const doc = makeDocument([emptyPara]);

    const html = await docxToHtml(doc);
    const text = await docxToText(doc);

    expect(typeof html).toBe('string');
    expect(typeof text).toBe('string');
  });

  it('test_whitespace_only_paragraph', async () => {
    const doc = makeDocument([makeParagraph('   ')]);

    const html = await docxToHtml(doc);
    const text = await docxToText(doc);

    expect(typeof html).toBe('string');
    expect(typeof text).toBe('string');
  });

  it('test_very_long_content', async () => {
    const longText = 'A'.repeat(10000);
    const doc = makeDocument([makeParagraph(longText)]);

    const html = await docxToHtml(doc);
    const text = await docxToText(doc);

    expect(html).toContain(longText);
    expect(text).toContain(longText);
  });
});

// =============================================================================
// API Consistency Tests
// =============================================================================

describe('TestApiConsistency', () => {
  it('test_same_config_type', async () => {
    const doc = makeDocument([makeParagraph('Content')]);
    const config: ConversionConfig = { title: 'Test' };

    const html = await docxToHtml(doc, config);
    const text = await docxToText(doc, config);

    expect(html.length).toBeGreaterThan(0);
    expect(text.length).toBeGreaterThan(0);
  });

  it('test_consistent_output_types', async () => {
    const doc = makeDocument([makeParagraph('Content')]);

    const html = await docxToHtml(doc);
    const text = await docxToText(doc);

    expect(typeof html).toBe('string');
    expect(typeof text).toBe('string');
  });
});

// =============================================================================
// Config Conversion Tests
// =============================================================================

describe('TestConfigConversion', () => {
  it('test_to_html_config_with_defaults', () => {
    const htmlConfig = toHtmlConfig();

    expect(htmlConfig.styleMode).toBe('inline');
    expect(htmlConfig.useSemanticTags).toBe(false);
    expect(htmlConfig.language).toBe('en');
  });

  it('test_to_html_config_with_partial_config', () => {
    const config: ConversionConfig = { title: 'Custom', styleMode: 'class' };
    const htmlConfig = toHtmlConfig(config);

    expect(htmlConfig.title).toBe('Custom');
    expect(htmlConfig.styleMode).toBe('class');
    // Other values should be defaults
    expect(htmlConfig.language).toBe('en');
  });

  it('test_to_text_config_with_defaults', () => {
    const textConfig = toTextConfig();

    expect(textConfig.formatting).toBe('plain');
    expect(textConfig.tableMode).toBe('auto');
    expect(textConfig.paragraphSeparator).toBe('\n\n');
  });

  it('test_to_text_config_with_partial_config', () => {
    const config: ConversionConfig = { textFormatting: 'markdown', tableMode: 'ascii' };
    const textConfig = toTextConfig(config);

    expect(textConfig.formatting).toBe('markdown');
    expect(textConfig.tableMode).toBe('ascii');
    // Other values should be defaults
    expect(textConfig.preserveEmptyParagraphs).toBe(true);
  });
});
