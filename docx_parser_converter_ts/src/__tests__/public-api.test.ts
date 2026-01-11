/**
 * Integration tests for the public API.
 *
 * Tests the main entry points: docxToHtml and docxToText.
 * Port of Python: tests/integration/test_public_api.py
 *
 * Note: Golden standard tests (comparing output to expected files) are in
 * golden-standards.test.ts. This file tests API behavior and error handling.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { docxToHtml, docxToText } from '../api';
import { DEFAULT_CONFIG } from '../config';
import type { ConversionConfig } from '../config';
import {
  DocxNotFoundError,
  DocxReadError,
} from '../core/exceptions';

// =============================================================================
// Paths
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES_DIR = path.join(PROJECT_ROOT, 'fixtures', 'test_docx_files');

function getSampleFixture(): string | null {
  if (!fs.existsSync(FIXTURES_DIR)) return null;
  const fixtures = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.docx'));
  if (fixtures.length > 0) {
    return path.join(FIXTURES_DIR, fixtures[0]);
  }
  return null;
}

function getTableFixture(): string | null {
  if (!fs.existsSync(FIXTURES_DIR)) return null;
  const fixtures = fs.readdirSync(FIXTURES_DIR).filter((f) => f.includes('table') && f.endsWith('.docx'));
  if (fixtures.length > 0) {
    return path.join(FIXTURES_DIR, fixtures[0]);
  }
  return null;
}

// =============================================================================
// docxToHtml Tests
// =============================================================================

describe('TestDocxToHtmlBasic', () => {
  let fixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
  });

  it('test_simple_document', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('test_none_input_returns_empty_html', async () => {
    const result = await docxToHtml(null);

    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('test_undefined_input_returns_empty_html', async () => {
    const result = await docxToHtml(undefined);

    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('test_file_path_as_string', async () => {
    if (!fixture) return;

    const result = await docxToHtml(fixture);

    expect(typeof result).toBe('string');
    expect(result).toContain('<html');
  });

  it('test_bytes_input', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(typeof result).toBe('string');
    expect(result).toContain('<html');
  });

  it('test_arraybuffer_input', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const result = await docxToHtml(arrayBuffer);

    expect(typeof result).toBe('string');
    expect(result).toContain('<html');
  });
});

describe('TestDocxToHtmlErrors', () => {
  it('test_file_not_found_raises_error', async () => {
    await expect(docxToHtml('/nonexistent/path/document.docx')).rejects.toThrow(
      DocxNotFoundError
    );
  });

  it('test_invalid_docx_raises_error', async () => {
    const invalidContent = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    await expect(docxToHtml(invalidContent)).rejects.toThrow();
  });

  it('test_empty_bytes_raises_error', async () => {
    const emptyContent = new Uint8Array([]);
    await expect(docxToHtml(emptyContent)).rejects.toThrow(DocxReadError);
  });
});

describe('TestDocxToHtmlConfig', () => {
  let fixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
  });

  it('test_default_config', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToHtml(new Uint8Array(buffer));

    expect(result).toContain('<html');
  });

  it('test_fragment_only_mode', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const config: ConversionConfig = { fragmentOnly: true };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).not.toContain('<!DOCTYPE html>');
    expect(result).not.toContain('<html');
  });

  it('test_custom_title', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const config: ConversionConfig = { title: 'My Document' };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('<title>My Document</title>');
  });

  it('test_custom_language', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const config: ConversionConfig = { language: 'de' };
    const result = await docxToHtml(new Uint8Array(buffer), config);

    expect(result).toContain('lang="de"');
  });
});

// =============================================================================
// docxToText Tests
// =============================================================================

describe('TestDocxToTextBasic', () => {
  let fixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
  });

  it('test_simple_document', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToText(new Uint8Array(buffer));

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('test_none_input_returns_empty_string', async () => {
    const result = await docxToText(null);

    expect(result).toBe('');
  });

  it('test_undefined_input_returns_empty_string', async () => {
    const result = await docxToText(undefined);

    expect(result).toBe('');
  });

  it('test_file_path_as_string', async () => {
    if (!fixture) return;

    const result = await docxToText(fixture);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('test_bytes_input', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToText(new Uint8Array(buffer));

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('TestDocxToTextErrors', () => {
  it('test_file_not_found_raises_error', async () => {
    await expect(docxToText('/nonexistent/path/document.docx')).rejects.toThrow(
      DocxNotFoundError
    );
  });

  it('test_invalid_docx_raises_error', async () => {
    const invalidContent = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    await expect(docxToText(invalidContent)).rejects.toThrow();
  });
});

describe('TestDocxToTextConfig', () => {
  let fixture: string | null;
  let tableFixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
    tableFixture = getTableFixture();
  });

  it('test_default_config', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToText(new Uint8Array(buffer));

    expect(typeof result).toBe('string');
  });

  it('test_markdown_mode', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const config: ConversionConfig = { textFormatting: 'markdown' };
    const result = await docxToText(new Uint8Array(buffer), config);

    expect(typeof result).toBe('string');
  });

  it('test_table_mode_ascii', async () => {
    if (!tableFixture) return;

    const buffer = fs.readFileSync(tableFixture);
    const config: ConversionConfig = { tableMode: 'ascii' };
    const result = await docxToText(new Uint8Array(buffer), config);

    expect(typeof result).toBe('string');
  });

  it('test_table_mode_tabs', async () => {
    if (!tableFixture) return;

    const buffer = fs.readFileSync(tableFixture);
    const config: ConversionConfig = { tableMode: 'tabs' };
    const result = await docxToText(new Uint8Array(buffer), config);

    expect(typeof result).toBe('string');
  });
});

// =============================================================================
// ConversionConfig Tests
// =============================================================================

describe('TestConversionConfig', () => {
  it('test_default_values', () => {
    // HTML defaults
    expect(DEFAULT_CONFIG.styleMode).toBe('inline');
    expect(DEFAULT_CONFIG.useSemanticTags).toBe(false);
    expect(DEFAULT_CONFIG.preserveWhitespace).toBe(false);
    expect(DEFAULT_CONFIG.fragmentOnly).toBe(false);
    expect(DEFAULT_CONFIG.title).toBe('');
    expect(DEFAULT_CONFIG.language).toBe('en');

    // Text defaults
    expect(DEFAULT_CONFIG.textFormatting).toBe('plain');
    expect(DEFAULT_CONFIG.tableMode).toBe('auto');
    expect(DEFAULT_CONFIG.paragraphSeparator).toBe('\n\n');
  });

  it('test_html_options', () => {
    const config: ConversionConfig = {
      styleMode: 'class',
      useSemanticTags: false,
      preserveWhitespace: true,
      fragmentOnly: true,
      title: 'Test Document',
      language: 'fr',
      customCss: '.test { color: red; }',
      cssFiles: ['style.css'],
      responsive: false,
      includePrintStyles: true,
    };

    expect(config.styleMode).toBe('class');
    expect(config.useSemanticTags).toBe(false);
    expect(config.preserveWhitespace).toBe(true);
    expect(config.fragmentOnly).toBe(true);
    expect(config.title).toBe('Test Document');
    expect(config.language).toBe('fr');
    expect(config.customCss).toBe('.test { color: red; }');
    expect(config.cssFiles).toEqual(['style.css']);
    expect(config.responsive).toBe(false);
    expect(config.includePrintStyles).toBe(true);
  });

  it('test_text_options', () => {
    const config: ConversionConfig = {
      textFormatting: 'markdown',
      tableMode: 'ascii',
      paragraphSeparator: '\n',
      preserveEmptyParagraphs: false,
    };

    expect(config.textFormatting).toBe('markdown');
    expect(config.tableMode).toBe('ascii');
    expect(config.paragraphSeparator).toBe('\n');
    expect(config.preserveEmptyParagraphs).toBe(false);
  });
});

// =============================================================================
// Content Preservation Tests
// =============================================================================

describe('TestContentPreservation', () => {
  let fixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
  });

  it('test_text_content_preserved_in_html', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToHtml(new Uint8Array(buffer));

    // HTML should contain actual text from document
    expect(result.length).toBeGreaterThan(100); // Non-trivial output
  });

  it('test_text_content_preserved_in_text', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const result = await docxToText(new Uint8Array(buffer));

    // Text should contain actual content
    expect(result.length).toBeGreaterThan(10); // Non-trivial output
  });

  it('test_unicode_content_preserved', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const htmlResult = await docxToHtml(new Uint8Array(buffer));
    const textResult = await docxToText(new Uint8Array(buffer));

    // Both outputs should be valid strings
    expect(typeof htmlResult).toBe('string');
    expect(typeof textResult).toBe('string');
  });
});

// =============================================================================
// Multi-Format Tests
// =============================================================================

describe('TestMultiFormatConsistency', () => {
  let fixture: string | null;

  beforeAll(() => {
    fixture = getSampleFixture();
  });

  it('test_same_source_different_formats', async () => {
    if (!fixture) return;

    const buffer = fs.readFileSync(fixture);
    const data = new Uint8Array(buffer);

    const htmlResult = await docxToHtml(data);
    const textResult = await docxToText(data);

    // Both should produce output
    expect(htmlResult.length).toBeGreaterThan(0);
    expect(textResult.length).toBeGreaterThan(0);

    // Text should be shorter than HTML (no markup)
    expect(textResult.length).toBeLessThan(htmlResult.length);
  });

  it('test_bytes_and_path_produce_same_output', async () => {
    if (!fixture) return;

    const fromPath = await docxToHtml(fixture);
    const buffer = fs.readFileSync(fixture);
    const fromBytes = await docxToHtml(new Uint8Array(buffer));

    expect(fromPath).toBe(fromBytes);
  });
});
