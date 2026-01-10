/**
 * Unit tests for paragraph to text converter.
 *
 * Tests conversion of Paragraph elements to plain text.
 */

import { describe, it, expect } from 'vitest';
import {
  ParagraphToTextConverter,
  paragraphToText,
} from '../paragraph-to-text';
import type { Paragraph, ParagraphProperties } from '../../../models/document/paragraph';
import type { Run, RunProperties } from '../../../models/document/run';
import type { Hyperlink } from '../../../models/document/hyperlink';
import type { Text, Break, TabChar } from '../../../models/document/run-content';
import type { Spacing } from '../../../models/common/spacing';
import type { Indentation } from '../../../models/common/indentation';

// =============================================================================
// Helper Functions
// =============================================================================

function createText(value: string, space?: string): Text {
  return { type: 'text', value, space: space ?? null };
}

function createBreak(breakType?: string): Break {
  return { type: 'break', breakType: breakType as any };
}

function createTab(): TabChar {
  return { type: 'tab' };
}

function createRun(content: any[], rPr?: RunProperties): Run {
  return { content, rPr: rPr ?? null };
}

function createParagraph(content: any[], pPr?: ParagraphProperties): Paragraph {
  return { content, pPr: pPr ?? null };
}

function createHyperlink(rId: string, content: Run[]): Hyperlink {
  return { type: 'hyperlink', rId, content };
}

// =============================================================================
// Basic Paragraph Conversion Tests
// =============================================================================

describe('TestBasicParagraphConversion', () => {
  it('test_simple_paragraph', () => {
    const para = createParagraph([createRun([createText('Hello World')])]);
    const result = paragraphToText(para);
    expect(result).toBe('Hello World');
  });

  it('test_empty_paragraph', () => {
    const para = createParagraph([]);
    const result = paragraphToText(para);
    expect(result).toBe('');
  });

  it('test_none_paragraph', () => {
    const result = paragraphToText(null);
    expect(result).toBe('');
  });

  it('test_undefined_paragraph', () => {
    const result = paragraphToText(undefined);
    expect(result).toBe('');
  });

  it('test_multiple_runs', () => {
    const para = createParagraph([
      createRun([createText('Hello ')]),
      createRun([createText('World')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Hello World');
  });

  it('test_paragraph_with_properties_only', () => {
    const para = createParagraph([], { jc: 'center' });
    const result = paragraphToText(para);
    expect(result).toBe('');
  });
});

// =============================================================================
// Hyperlink Tests
// =============================================================================

describe('TestHyperlinkHandling', () => {
  it('test_hyperlink_text_extracted', () => {
    const para = createParagraph([
      createHyperlink('rId1', [createRun([createText('Click here')])]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Click here');
  });

  it('test_hyperlink_with_surrounding_text', () => {
    const para = createParagraph([
      createRun([createText('Visit ')]),
      createHyperlink('rId1', [createRun([createText('our website')])]),
      createRun([createText(' for more info.')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Visit our website for more info.');
  });

  it('test_hyperlink_markdown_mode', () => {
    const para = createParagraph([
      createHyperlink('rId1', [createRun([createText('Example')])]),
    ]);
    const converter = new ParagraphToTextConverter({
      useMarkdown: true,
      hyperlinkUrls: { rId1: 'https://example.com' },
    });
    const result = converter.convert(para);
    expect(result).toContain('Example');
    expect(result).toContain('https://example.com');
  });

  it('test_hyperlink_markdown_without_url', () => {
    const para = createParagraph([
      createHyperlink('rId1', [createRun([createText('Example')])]),
    ]);
    const converter = new ParagraphToTextConverter({
      useMarkdown: true,
      hyperlinkUrls: {},
    });
    const result = converter.convert(para);
    expect(result).toBe('Example');
  });
});

// =============================================================================
// Numbering/List Tests
// =============================================================================

describe('TestNumberingHandling', () => {
  it('test_numbered_paragraph', () => {
    const para = createParagraph(
      [createRun([createText('First item')])],
      { numPr: { numId: 1, ilvl: 0 } }
    );
    const converter = new ParagraphToTextConverter({
      numberingPrefixes: { '1:0': ['1.', '\t'] },
    });
    const result = converter.convert(para);
    expect(result).toContain('1.');
    expect(result).toContain('First item');
  });

  it('test_bulleted_paragraph', () => {
    const para = createParagraph(
      [createRun([createText('Bullet point')])],
      { numPr: { numId: 2, ilvl: 0 } }
    );
    const converter = new ParagraphToTextConverter({
      numberingPrefixes: { '2:0': ['\u2022', '\t'] },
    });
    const result = converter.convert(para);
    expect(result).toContain('\u2022');
    expect(result).toContain('Bullet point');
  });

  it('test_multi_level_list', () => {
    const para = createParagraph(
      [createRun([createText('Sub-item')])],
      { numPr: { numId: 1, ilvl: 1 } }
    );
    const converter = new ParagraphToTextConverter({
      numberingPrefixes: { '1:1': ['a.', '\t'] },
    });
    const result = converter.convert(para);
    expect(result).toContain('a.');
    expect(result).toContain('Sub-item');
  });

  it('test_no_numbering_prefix_when_not_configured', () => {
    const para = createParagraph(
      [createRun([createText('Item')])],
      { numPr: { numId: 1, ilvl: 0 } }
    );
    const converter = new ParagraphToTextConverter({
      numberingPrefixes: {},
    });
    const result = converter.convert(para);
    expect(result).toBe('Item');
  });
});

// =============================================================================
// Break and Tab Handling Tests
// =============================================================================

describe('TestBreakAndTabHandling', () => {
  it('test_paragraph_with_line_break', () => {
    const para = createParagraph([
      createRun([
        createText('Line 1'),
        createBreak(),
        createText('Line 2'),
      ]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Line 1\nLine 2');
  });

  it('test_paragraph_with_tabs', () => {
    const para = createParagraph([
      createRun([
        createText('Col1'),
        createTab(),
        createText('Col2'),
      ]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Col1\tCol2');
  });

  it('test_paragraph_with_page_break', () => {
    const para = createParagraph([
      createRun([
        createText('Before'),
        createBreak('page'),
        createText('After'),
      ]),
    ]);
    const result = paragraphToText(para);
    expect(result).toContain('Before');
    expect(result).toContain('After');
    expect(result).toContain('\n');
  });
});

// =============================================================================
// Formatting Mode Tests
// =============================================================================

describe('TestFormattingModes', () => {
  it('test_plain_mode_no_markers', () => {
    const para = createParagraph([
      createRun([createText('bold')], { b: true }),
    ]);
    const converter = new ParagraphToTextConverter({ useMarkdown: false });
    const result = converter.convert(para);
    expect(result).toBe('bold');
  });

  it('test_markdown_mode_preserves_formatting', () => {
    const para = createParagraph([
      createRun([createText('bold')], { b: true }),
    ]);
    const converter = new ParagraphToTextConverter({ useMarkdown: true });
    const result = converter.convert(para);
    expect(result).toBe('**bold**');
  });

  it('test_mixed_formatting_markdown', () => {
    const para = createParagraph([
      createRun([createText('Normal ')]),
      createRun([createText('bold')], { b: true }),
      createRun([createText(' and ')]),
      createRun([createText('italic')], { i: true }),
    ]);
    const converter = new ParagraphToTextConverter({ useMarkdown: true });
    const result = converter.convert(para);
    expect(result).toContain('Normal ');
    expect(result).toContain('**bold**');
    expect(result).toContain('*italic*');
  });

  it('test_bold_italic_markdown', () => {
    const para = createParagraph([
      createRun([createText('bold italic')], { b: true, i: true }),
    ]);
    const converter = new ParagraphToTextConverter({ useMarkdown: true });
    const result = converter.convert(para);
    expect(result).toBe('***bold italic***');
  });
});

// =============================================================================
// Whitespace Handling Tests
// =============================================================================

describe('TestWhitespaceHandling', () => {
  it('test_preserve_spaces_between_runs', () => {
    const para = createParagraph([
      createRun([createText('Word1 ')]),
      createRun([createText('Word2')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Word1 Word2');
  });

  it('test_leading_spaces_preserved', () => {
    const para = createParagraph([
      createRun([createText('  Indented', 'preserve')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('  Indented');
  });

  it('test_trailing_spaces_preserved', () => {
    const para = createParagraph([
      createRun([createText('Text  ', 'preserve')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Text  ');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('TestParagraphEdgeCases', () => {
  it('test_empty_runs', () => {
    const para = createParagraph([
      createRun([]),
      createRun([createText('Text')]),
      createRun([]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Text');
  });

  it('test_only_whitespace', () => {
    const para = createParagraph([
      createRun([createText('   ', 'preserve')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('   ');
  });

  it('test_unicode_content', () => {
    const para = createParagraph([
      createRun([createText('Hello \u4e16\u754c \ud83c\udf0d')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('Hello \u4e16\u754c \ud83c\udf0d');
  });

  it('test_rtl_content', () => {
    const para = createParagraph([
      createRun([createText('\u0645\u0631\u062d\u0628\u0627')]),
    ]);
    const result = paragraphToText(para);
    expect(result).toBe('\u0645\u0631\u062d\u0628\u0627');
  });

  it('test_very_long_paragraph', () => {
    const longText = 'A'.repeat(10000);
    const para = createParagraph([createRun([createText(longText)])]);
    const result = paragraphToText(para);
    expect(result).toBe(longText);
  });

  it('test_empty_text_value', () => {
    const para = createParagraph([createRun([createText('')])]);
    const result = paragraphToText(para);
    expect(result).toBe('');
  });
});

// =============================================================================
// Paragraph Properties Tests
// =============================================================================

describe('TestParagraphProperties', () => {
  it('test_properties_ignored_in_plain_text', () => {
    const para = createParagraph(
      [createRun([createText('Styled text')])],
      {
        jc: 'center',
        spacing: { before: 240, after: 120 } as Spacing,
        ind: { left: 720 } as Indentation,
      }
    );
    const result = paragraphToText(para);
    expect(result).toBe('Styled text');
  });

  it('test_indentation_as_spaces', () => {
    const para = createParagraph(
      [createRun([createText('Indented')])],
      { ind: { firstLine: 720 } as Indentation }
    );
    const converter = new ParagraphToTextConverter({ renderIndentation: true });
    const result = converter.convert(para);
    expect(result).toContain('Indented');
    // Should have some leading spaces from indentation
    expect(result.length).toBeGreaterThan('Indented'.length);
  });

  it('test_list_indent_spaces', () => {
    const para = createParagraph([createRun([createText('Item')])]);
    const converter = new ParagraphToTextConverter({ listIndentSpaces: 4 });
    const result = converter.convert(para);
    expect(result).toBe('    Item');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('TestParagraphToTextConverterClass', () => {
  it('test_converter_initialization', () => {
    const converter = new ParagraphToTextConverter();
    expect(converter).not.toBeNull();
  });

  it('test_converter_plain_mode', () => {
    const converter = new ParagraphToTextConverter({ useMarkdown: false });
    expect(converter.useMarkdown).toBe(false);
  });

  it('test_converter_markdown_mode', () => {
    const converter = new ParagraphToTextConverter({ useMarkdown: true });
    expect(converter.useMarkdown).toBe(true);
  });

  it('test_converter_with_hyperlink_urls', () => {
    const urls = { rId1: 'https://example.com' };
    const converter = new ParagraphToTextConverter({ hyperlinkUrls: urls });
    expect(converter.hyperlinkUrls).toEqual(urls);
  });

  it('test_converter_with_numbering_prefixes', () => {
    const prefixes = { '1:0': ['1.', '\t'] as [string, string] };
    const converter = new ParagraphToTextConverter({ numberingPrefixes: prefixes });
    expect(converter.numberingPrefixes).toEqual(prefixes);
  });

  it('test_convert_method', () => {
    const converter = new ParagraphToTextConverter();
    const para = createParagraph([createRun([createText('Test')])]);
    const result = converter.convert(para);
    expect(result).toBe('Test');
  });

  it('test_default_options', () => {
    const converter = new ParagraphToTextConverter();
    expect(converter.useMarkdown).toBe(false);
    expect(converter.hyperlinkUrls).toEqual({});
    expect(converter.numberingPrefixes).toEqual({});
    expect(converter.renderIndentation).toBe(false);
    expect(converter.listIndentSpaces).toBe(0);
  });
});
