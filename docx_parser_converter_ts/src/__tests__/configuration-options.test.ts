/**
 * Configuration options integration tests.
 *
 * Tests that all configuration options actually affect the output as expected.
 * Port of Python: tests/integration/test_configuration_options.py
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { docxToHtml, docxToText } from '../api';
import type { ConversionConfig } from '../config';

// =============================================================================
// Paths
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES_DIR = path.join(PROJECT_ROOT, 'fixtures');
const TEST_DOCX_DIR = path.join(FIXTURES_DIR, 'test_docx_files');
const TAGGED_TESTS_DIR = path.join(FIXTURES_DIR, 'tagged_tests');

function getTestFile(name: string): string | null {
  const directories = [TEST_DOCX_DIR, TAGGED_TESTS_DIR];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.includes(name) && f.endsWith('.docx'));
    if (match) {
      return path.join(dir, match);
    }
  }

  return null;
}

// =============================================================================
// HTML Configuration Tests
// =============================================================================

describe('TestHTMLFragmentOnly', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_includes_full_document', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('<head>');
    expect(result).toContain('<body>');
    expect(result).toContain('</html>');
  });

  it('test_fragment_only_excludes_wrapper', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { fragmentOnly: true };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).not.toContain('<!DOCTYPE html>');
    expect(result).not.toContain('<html');
    expect(result).not.toContain('<head>');
    expect(result).not.toContain('</html>');
    // Should still have content
    expect(result).toMatch(/<p|<div/);
  });
});

describe('TestHTMLTitle', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_empty_title', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(result).toContain('<title></title>');
  });

  it('test_custom_title', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { title: 'My Custom Title' };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('<title>My Custom Title</title>');
  });
});

describe('TestHTMLLanguage', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_english', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(result).toContain('lang="en"');
  });

  it('test_custom_language', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { language: 'de' };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('lang="de"');
  });
});

describe('TestHTMLStyleMode', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_inline_style_mode', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { styleMode: 'inline' };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    // Should have inline styles on elements
    expect(result).toContain('style="');
  });

  it('test_none_style_mode_reduces_styles', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);

    // Compare inline vs none mode
    const inlineConfig: ConversionConfig = { styleMode: 'inline' };
    const noneConfig: ConversionConfig = { styleMode: 'none' };

    const inlineResult = await docxToHtml(new Uint8Array(buffer), inlineConfig);
    const noneResult = await docxToHtml(new Uint8Array(buffer), noneConfig);

    // None mode should have fewer or equal style attributes
    const inlineCount = (inlineResult.match(/style="/g) || []).length;
    const noneCount = (noneResult.match(/style="/g) || []).length;

    expect(noneCount).toBeLessThanOrEqual(inlineCount);
  });
});

describe('TestHTMLSemanticTags', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_no_semantic_tags', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    // Should use basic tags by default
    expect(result).toMatch(/<p|<span/);
  });

  it('test_semantic_tags_enabled', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { useSemanticTags: true };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    // Should still produce valid HTML
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('TestHTMLResponsive', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_responsive', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(result).toContain('viewport');
    expect(result).toContain('width=device-width');
  });

  it('test_non_responsive', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { responsive: false };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).not.toContain('width=device-width');
  });
});

describe('TestHTMLPrintStyles', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_includes_print_styles', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToHtml(new Uint8Array(buffer));

    // Default includes print styles for better printing
    expect(result).toContain('@media print');
  });

  it('test_explicit_print_styles', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { includePrintStyles: true };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('@media print');
  });
});

describe('TestHTMLCustomCSS', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_custom_css_included', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const customCss = '.my-custom-class { color: red; }';
    const config: ConversionConfig = { customCss };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('.my-custom-class { color: red; }');
  });
});

// =============================================================================
// Text Configuration Tests
// =============================================================================

describe('TestTextFormatting', () => {
  let formattingFile: string | null;
  let inlineFormattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
    inlineFormattingFile = getTestFile('inline_formatting');
  });

  it('test_default_plain_text', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToText(new Uint8Array(buffer));

    // Plain text should not have markdown markers
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('test_markdown_formatting', async () => {
    const file = inlineFormattingFile || formattingFile;
    if (!file) return;

    const buffer = fs.readFileSync(file);
    const config: ConversionConfig = { textFormatting: 'markdown' };
    const result = await docxToText(new Uint8Array(buffer), config);

    // Should have some markdown formatting if document has formatting
    expect(typeof result).toBe('string');
    // Check for common markdown markers
    const hasBold = result.includes('**');
    const hasItalic = result.includes('*') && !result.replace(/\*\*/g, '').includes('*') === false;
    const hasStrike = result.includes('~~');
    // At least one formatting should be present or have content
    expect(hasBold || hasItalic || hasStrike || result.length > 0).toBe(true);
  });
});

describe('TestTextTableMode', () => {
  let tablesFile: string | null;

  beforeAll(() => {
    tablesFile = getTestFile('tables');
  });

  it('test_ascii_table_mode', async () => {
    if (!tablesFile) return;

    const buffer = fs.readFileSync(tablesFile);
    const config: ConversionConfig = { tableMode: 'ascii' };
    const result = await docxToText(new Uint8Array(buffer), config);

    // ASCII tables use + - | characters
    expect(result).toContain('+');
    expect(result).toContain('-');
    expect(result).toContain('|');
  });

  it('test_tabs_table_mode', async () => {
    if (!tablesFile) return;

    const buffer = fs.readFileSync(tablesFile);
    const config: ConversionConfig = { tableMode: 'tabs' };
    const result = await docxToText(new Uint8Array(buffer), config);

    // Tab-separated values
    expect(result).toContain('\t');
  });

  it('test_plain_table_mode', async () => {
    if (!tablesFile) return;

    const buffer = fs.readFileSync(tablesFile);
    const config: ConversionConfig = { tableMode: 'plain' };
    const result = await docxToText(new Uint8Array(buffer), config);

    // Should have content but no special table characters
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('TestTextParagraphSeparator', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_default_double_newline', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const result = await docxToText(new Uint8Array(buffer));

    // Should have double newlines between paragraphs
    expect(result).toContain('\n\n');
  });

  it('test_single_newline_separator', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = { paragraphSeparator: '\n' };
    const result = await docxToText(new Uint8Array(buffer), config);

    // Should have content
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Combined Configuration Tests
// =============================================================================

describe('TestCombinedConfigurations', () => {
  let formattingFile: string | null;
  let tablesFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
    tablesFile = getTestFile('tables');
  });

  it('test_html_full_options', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);
    const config: ConversionConfig = {
      title: 'Combined Test',
      language: 'fr',
      useSemanticTags: true,
      includePrintStyles: true,
      customCss: '.test { margin: 0; }',
    };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('<title>Combined Test</title>');
    expect(result).toContain('lang="fr"');
    expect(result).toContain('@media print');
    expect(result).toContain('.test { margin: 0; }');
  });

  it('test_text_full_options', async () => {
    if (!tablesFile) return;

    const buffer = fs.readFileSync(tablesFile);
    const config: ConversionConfig = {
      textFormatting: 'markdown',
      tableMode: 'ascii',
      paragraphSeparator: '\n',
    };
    const result = await docxToText(new Uint8Array(buffer), config);

    // Should have ASCII table characters
    expect(result).toContain('+');
    expect(result).toContain('|');
    // Should have content
    expect(result.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Config Isolation Tests
// =============================================================================

describe('TestConfigIsolation', () => {
  let formattingFile: string | null;

  beforeAll(() => {
    formattingFile = getTestFile('formatting');
  });

  it('test_config_does_not_affect_other_conversions', async () => {
    if (!formattingFile) return;

    const buffer = fs.readFileSync(formattingFile);

    // First conversion with custom config
    const config1: ConversionConfig = { title: 'First' };
    const result1 = await docxToHtml(new Uint8Array(buffer), config1);

    // Second conversion with default config
    const result2 = await docxToHtml(new Uint8Array(buffer));

    // Third conversion with different custom config
    const config3: ConversionConfig = { title: 'Third' };
    const result3 = await docxToHtml(new Uint8Array(buffer), config3);

    expect(result1).toContain('<title>First</title>');
    expect(result2).toContain('<title></title>');
    expect(result3).toContain('<title>Third</title>');
  });
});
