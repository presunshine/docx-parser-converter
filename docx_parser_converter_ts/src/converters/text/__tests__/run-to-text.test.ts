/**
 * Unit tests for run to text converter.
 *
 * Tests conversion of Run elements to plain text.
 */

import { describe, it, expect } from 'vitest';
import {
  RunToTextConverter,
  breakToText,
  runToText,
  tabToText,
  textToText,
} from '../run-to-text';
import type { Run, RunProperties, RunFonts } from '../../../models/document/run';
import type {
  Text,
  Break,
  TabChar,
  CarriageReturn,
  SoftHyphen,
  NoBreakHyphen,
} from '../../../models/document/run-content';

// Helper to create Text element
function createText(value: string, space?: string): Text {
  return { type: 'text', value, space };
}

// Helper to create Break element
function createBreak(breakType?: string): Break {
  return { type: 'break', breakType: breakType as any };
}

// Helper to create TabChar element
function createTab(): TabChar {
  return { type: 'tab' };
}

// Helper to create CarriageReturn element
function createCR(): CarriageReturn {
  return { type: 'cr' };
}

// Helper to create SoftHyphen element
function createSoftHyphen(): SoftHyphen {
  return { type: 'softHyphen' };
}

// Helper to create NoBreakHyphen element
function createNoBreakHyphen(): NoBreakHyphen {
  return { type: 'noBreakHyphen' };
}

// Helper to create Run
function createRun(content: any[], rPr?: RunProperties): Run {
  return { content, rPr };
}

// =============================================================================
// Basic Run Conversion Tests
// =============================================================================

describe('TestBasicRunConversion', () => {
  it('test_simple_text_run', () => {
    const run = createRun([createText('Hello World')]);
    const result = runToText(run);
    expect(result).toBe('Hello World');
  });

  it('test_empty_run', () => {
    const run = createRun([]);
    const result = runToText(run);
    expect(result).toBe('');
  });

  it('test_none_run', () => {
    const result = runToText(null);
    expect(result).toBe('');
  });

  it('test_multiple_text_segments', () => {
    const run = createRun([createText('Hello '), createText('World')]);
    const result = runToText(run);
    expect(result).toBe('Hello World');
  });

  it('test_text_with_spaces', () => {
    const run = createRun([createText('  Hello  ', 'preserve')]);
    const result = runToText(run);
    expect(result).toBe('  Hello  ');
  });
});

// =============================================================================
// Text Content Tests
// =============================================================================

describe('TestTextContent', () => {
  it('test_text_to_text_basic', () => {
    const result = textToText(createText('Test content'));
    expect(result).toBe('Test content');
  });

  it('test_text_to_text_empty', () => {
    const result = textToText(createText(''));
    expect(result).toBe('');
  });

  it('test_text_to_text_with_space_preserve', () => {
    const result = textToText(createText('   spaces   ', 'preserve'));
    expect(result).toBe('   spaces   ');
  });

  it('test_text_with_unicode', () => {
    const run = createRun([createText('Hello 世界 🌍')]);
    const result = runToText(run);
    expect(result).toBe('Hello 世界 🌍');
  });

  it('test_text_with_rtl', () => {
    const run = createRun([createText('مرحبا')]);
    const result = runToText(run);
    expect(result).toBe('مرحبا');
  });
});

// =============================================================================
// Break Handling Tests
// =============================================================================

describe('TestBreakHandling', () => {
  it('test_line_break', () => {
    const result = breakToText(createBreak());
    expect(result).toBe('\n');
  });

  it('test_page_break', () => {
    const result = breakToText(createBreak('page'));
    // Could be newline or special marker
    expect(result).toContain('\n');
  });

  it('test_column_break', () => {
    const result = breakToText(createBreak('column'));
    expect(result).toContain('\n');
  });

  it('test_text_wrap_break', () => {
    const result = breakToText(createBreak('textWrapping'));
    expect(result).toBe('\n');
  });

  it('test_run_with_line_break', () => {
    const run = createRun([createText('Line 1'), createBreak(), createText('Line 2')]);
    const result = runToText(run);
    expect(result).toBe('Line 1\nLine 2');
  });
});

// =============================================================================
// Tab Handling Tests
// =============================================================================

describe('TestTabHandling', () => {
  it('test_tab_to_tab_character', () => {
    const result = tabToText(createTab());
    expect(result).toBe('\t');
  });

  it('test_run_with_tab', () => {
    const run = createRun([createText('Column1'), createTab(), createText('Column2')]);
    const result = runToText(run);
    expect(result).toBe('Column1\tColumn2');
  });
});

// =============================================================================
// Special Character Tests
// =============================================================================

describe('TestSpecialCharacters', () => {
  it('test_soft_hyphen', () => {
    const run = createRun([createSoftHyphen()]);
    const result = runToText(run);
    // Soft hyphen could be empty or actual soft hyphen
    expect(result === '' || result === '\u00ad').toBe(true);
  });

  it('test_no_break_hyphen', () => {
    const run = createRun([createNoBreakHyphen()]);
    const result = runToText(run);
    expect(result === '-' || result === '\u2011').toBe(true);
  });

  it('test_carriage_return', () => {
    const run = createRun([createCR()]);
    const result = runToText(run);
    expect(result).toBe('\n');
  });
});

// =============================================================================
// Markdown Mode Tests
// =============================================================================

describe('TestMarkdownMode', () => {
  it('test_bold_markdown', () => {
    const run = createRun([createText('bold')], { b: true });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    expect(result).toBe('**bold**');
  });

  it('test_italic_markdown', () => {
    const run = createRun([createText('italic')], { i: true });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    expect(result).toBe('*italic*');
  });

  it('test_bold_italic_markdown', () => {
    const run = createRun([createText('bold italic')], { b: true, i: true });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    expect(result).toBe('***bold italic***');
  });

  it('test_strikethrough_markdown', () => {
    const run = createRun([createText('deleted')], { strike: true });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    expect(result).toBe('~~deleted~~');
  });

  it('test_underline_markdown', () => {
    const run = createRun([createText('underlined')], { u: { val: 'single' } });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    // Underline has no markdown equivalent, could be unchanged or use _
    expect(result).toContain('underlined');
  });

  it('test_code_font_markdown', () => {
    const rFonts: RunFonts = { ascii: 'Courier New' };
    const run = createRun([createText('code')], { rFonts });
    const converter = new RunToTextConverter({ useMarkdown: true });
    const result = converter.convert(run);
    // Could wrap in backticks for monospace fonts
    expect(result).toContain('code');
  });
});

// =============================================================================
// Plain Mode Tests
// =============================================================================

describe('TestPlainMode', () => {
  it('test_bold_plain', () => {
    const run = createRun([createText('bold')], { b: true });
    const converter = new RunToTextConverter({ useMarkdown: false });
    const result = converter.convert(run);
    expect(result).toBe('bold');
  });

  it('test_italic_plain', () => {
    const run = createRun([createText('italic')], { i: true });
    const converter = new RunToTextConverter({ useMarkdown: false });
    const result = converter.convert(run);
    expect(result).toBe('italic');
  });

  it('test_formatted_text_plain', () => {
    const run = createRun(
      [createText('formatted')],
      {
        b: true,
        i: true,
        strike: true,
        u: { val: 'single' },
        color: { val: 'FF0000' },
      }
    );
    const result = runToText(run);
    expect(result).toBe('formatted');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('TestRunEdgeCases', () => {
  it('test_empty_text', () => {
    const run = createRun([createText('')]);
    const result = runToText(run);
    expect(result).toBe('');
  });

  it('test_only_whitespace', () => {
    const run = createRun([createText('   ', 'preserve')]);
    const result = runToText(run);
    expect(result).toBe('   ');
  });

  it('test_mixed_content_types', () => {
    const run = createRun([
      createText('Part 1'),
      createBreak(),
      createText('Part 2'),
      createTab(),
      createText('Part 3'),
    ]);
    const result = runToText(run);
    expect(result).toContain('Part 1');
    expect(result).toContain('Part 2');
    expect(result).toContain('Part 3');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  it('test_very_long_text', () => {
    const longText = 'A'.repeat(10000);
    const run = createRun([createText(longText)]);
    const result = runToText(run);
    expect(result).toBe(longText);
  });

  it('test_properties_without_content', () => {
    const run = createRun([], { b: true });
    const result = runToText(run);
    expect(result).toBe('');
  });

  it('test_multiple_consecutive_breaks', () => {
    const run = createRun([
      createText('Text'),
      createBreak(),
      createBreak(),
      createBreak(),
      createText('More'),
    ]);
    const result = runToText(run);
    expect(result).toBe('Text\n\n\nMore');
  });

  it('test_multiple_consecutive_tabs', () => {
    const run = createRun([createText('Col1'), createTab(), createTab(), createText('Col2')]);
    const result = runToText(run);
    expect(result).toBe('Col1\t\tCol2');
  });
});

// =============================================================================
// RunToTextConverter Class Tests
// =============================================================================

describe('TestRunToTextConverterClass', () => {
  it('test_converter_initialization', () => {
    const converter = new RunToTextConverter();
    expect(converter).not.toBeNull();
  });

  it('test_converter_plain_mode', () => {
    const converter = new RunToTextConverter({ useMarkdown: false });
    expect(converter.useMarkdown).toBe(false);
  });

  it('test_converter_markdown_mode', () => {
    const converter = new RunToTextConverter({ useMarkdown: true });
    expect(converter.useMarkdown).toBe(true);
  });

  it('test_convert_method', () => {
    const converter = new RunToTextConverter();
    const run = createRun([createText('Test')]);
    const result = converter.convert(run);
    expect(result).toBe('Test');
  });

  it('test_convert_content_method', () => {
    const converter = new RunToTextConverter();
    const result = converter.convertContent(createText('Test'));
    expect(result).toBe('Test');
  });
});

// =============================================================================
// Whitespace Handling Tests
// =============================================================================

describe('TestWhitespaceHandling', () => {
  it('test_preserve_single_space', () => {
    const run = createRun([createText('Hello World')]);
    const result = runToText(run);
    expect(result).toBe('Hello World');
  });

  it('test_preserve_multiple_spaces', () => {
    const run = createRun([createText('Hello  World', 'preserve')]);
    const result = runToText(run);
    expect(result).toBe('Hello  World');
  });

  it('test_leading_spaces_preserved', () => {
    const run = createRun([createText('  Indented', 'preserve')]);
    const result = runToText(run);
    expect(result).toBe('  Indented');
  });

  it('test_trailing_spaces_preserved', () => {
    const run = createRun([createText('Text  ', 'preserve')]);
    const result = runToText(run);
    expect(result).toBe('Text  ');
  });

  it('test_newlines_in_text', () => {
    const run = createRun([createText('Line1\nLine2', 'preserve')]);
    const result = runToText(run);
    expect(result).toContain('Line1');
    expect(result).toContain('Line2');
  });
});
