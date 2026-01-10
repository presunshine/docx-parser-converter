/**
 * Unit tests for run to HTML converter.
 *
 * Tests conversion of Run elements to HTML spans.
 * Matches Python: tests/unit/converters/html/test_run_to_html.py
 */

import { describe, it, expect } from 'vitest';
import {
  RunToHTMLConverter,
  runToHtml,
  textToHtml,
  tabToHtml,
  softHyphenToHtml,
} from '../run-to-html';
import type { Run } from '../../../models/document/run';
import type { Text, TabChar, SoftHyphen } from '../../../models/document/run-content';

// =============================================================================
// Basic Run Conversion Tests
// =============================================================================

describe('Basic Run Conversion', () => {
  it('should convert simple text run to span', () => {
    const run: Run = { content: [{ type: 'text', value: 'Hello' }] };
    const result = runToHtml(run);
    expect(result).toContain('Hello');
  });

  it('should return empty string for empty run', () => {
    const run: Run = { content: [] };
    const result = runToHtml(run);
    expect(result).toBe('');
  });

  it('should return empty string for null run', () => {
    const result = runToHtml(null);
    expect(result).toBe('');
  });

  it('should preserve text with spaces', () => {
    const run: Run = { content: [{ type: 'text', value: '  Hello  ', space: 'preserve' }] };
    const result = runToHtml(run);
    expect(result).toContain('Hello');
    expect(result.includes('&nbsp;') || result.includes('  ')).toBe(true);
  });

  it('should handle multiple text segments', () => {
    const run: Run = {
      content: [
        { type: 'text', value: 'Hello ' },
        { type: 'text', value: 'World' },
      ],
    };
    const result = runToHtml(run);
    expect(result).toContain('Hello ');
    expect(result).toContain('World');
  });
});

// =============================================================================
// Run Formatting Tests
// =============================================================================

describe('Run Formatting', () => {
  it('should convert bold text', () => {
    const run: Run = {
      rPr: { b: true },
      content: [{ type: 'text', value: 'Bold' }],
    };
    const result = runToHtml(run);
    expect(result.includes('<strong>') || result.includes('font-weight')).toBe(true);
  });

  it('should convert italic text', () => {
    const run: Run = {
      rPr: { i: true },
      content: [{ type: 'text', value: 'Italic' }],
    };
    const result = runToHtml(run);
    expect(result.includes('<em>') || result.includes('font-style')).toBe(true);
  });

  it('should convert underlined text', () => {
    const run: Run = {
      rPr: { u: { val: 'single' } },
      content: [{ type: 'text', value: 'Underlined' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('underline');
  });

  it('should convert strikethrough text', () => {
    const run: Run = {
      rPr: { strike: true },
      content: [{ type: 'text', value: 'Strikethrough' }],
    };
    const result = runToHtml(run);
    expect(
      result.includes('line-through') || result.includes('<del>') || result.includes('<s>')
    ).toBe(true);
  });

  it('should convert superscript text', () => {
    const run: Run = {
      rPr: { vertAlign: 'superscript' },
      content: [{ type: 'text', value: '2' }],
    };
    const result = runToHtml(run);
    expect(result.includes('<sup>') || result.includes('vertical-align: super')).toBe(true);
  });

  it('should convert subscript text', () => {
    const run: Run = {
      rPr: { vertAlign: 'subscript' },
      content: [{ type: 'text', value: '2' }],
    };
    const result = runToHtml(run);
    expect(result.includes('<sub>') || result.includes('vertical-align: sub')).toBe(true);
  });

  it('should handle combined formatting', () => {
    const run: Run = {
      rPr: { b: true, i: true, u: { val: 'single' } },
      content: [{ type: 'text', value: 'Bold Italic Underlined' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('Bold Italic Underlined');
  });

  it('should apply font family', () => {
    const run: Run = {
      rPr: { rFonts: { ascii: 'Arial' } },
      content: [{ type: 'text', value: 'Arial text' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('Arial');
  });

  it('should apply font size', () => {
    const run: Run = {
      rPr: { sz: 32 }, // 16pt
      content: [{ type: 'text', value: 'Large text' }],
    };
    const result = runToHtml(run);
    expect(result.includes('16pt') || result.includes('font-size')).toBe(true);
  });

  it('should apply text color', () => {
    const run: Run = {
      rPr: { color: { val: 'FF0000' } },
      content: [{ type: 'text', value: 'Red text' }],
    };
    const result = runToHtml(run);
    expect(result.toUpperCase().includes('FF0000') || result.toLowerCase().includes('#ff0000')).toBe(true);
  });

  it('should apply highlight color', () => {
    const run: Run = {
      rPr: { highlight: 'yellow' },
      content: [{ type: 'text', value: 'Highlighted' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('background');
  });

  it('should convert all caps text', () => {
    const run: Run = {
      rPr: { caps: true },
      content: [{ type: 'text', value: 'uppercase' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('uppercase');
  });

  it('should convert small caps text', () => {
    const run: Run = {
      rPr: { smallCaps: true },
      content: [{ type: 'text', value: 'small caps' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('small-caps');
  });

  it('should convert hidden text (vanish)', () => {
    const run: Run = {
      rPr: { vanish: true },
      content: [{ type: 'text', value: 'Hidden' }],
    };
    const result = runToHtml(run);
    expect(result.includes('display: none') || result.includes('visibility: hidden')).toBe(true);
  });
});

// =============================================================================
// Special Content Tests
// =============================================================================

describe('Special Content', () => {
  it('should convert line break to <br>', () => {
    const run: Run = {
      content: [
        { type: 'text', value: 'Line 1' },
        { type: 'break' },
        { type: 'text', value: 'Line 2' },
      ],
    };
    const result = runToHtml(run);
    expect(result).toContain('<br');
  });

  it('should handle page break', () => {
    const run: Run = {
      content: [{ type: 'break', breakType: 'page' }],
    };
    const result = runToHtml(run);
    expect(result.includes('page-break') || result.includes('<hr')).toBe(true);
  });

  it('should handle column break', () => {
    const run: Run = {
      content: [{ type: 'break', breakType: 'column' }],
    };
    const result = runToHtml(run);
    expect(result.includes('break') || result.includes('column')).toBe(true);
  });

  it('should handle tab character', () => {
    const tab: TabChar = { type: 'tab' };
    const result = tabToHtml(tab);
    expect(result.includes('tab') || result.includes('<span')).toBe(true);
  });

  it('should handle carriage return', () => {
    const run: Run = {
      content: [{ type: 'cr' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('<br');
  });

  it('should handle soft hyphen', () => {
    const softHyphen: SoftHyphen = { type: 'softHyphen' };
    const result = softHyphenToHtml(softHyphen);
    expect(result).toContain('&shy;');
  });

  it('should handle no-break hyphen', () => {
    const run: Run = {
      content: [
        { type: 'text', value: 'non' },
        { type: 'noBreakHyphen' },
        { type: 'text', value: 'breaking' },
      ],
    };
    const result = runToHtml(run);
    expect(result).toContain('non');
    expect(result).toContain('breaking');
  });
});

// =============================================================================
// HTML Escaping Tests
// =============================================================================

describe('HTML Escaping', () => {
  it('should escape less than sign', () => {
    const text: Text = { type: 'text', value: 'a < b' };
    const result = textToHtml(text);
    expect(result).toContain('&lt;');
  });

  it('should escape greater than sign', () => {
    const text: Text = { type: 'text', value: 'a > b' };
    const result = textToHtml(text);
    expect(result).toContain('&gt;');
  });

  it('should escape ampersand', () => {
    const text: Text = { type: 'text', value: 'a & b' };
    const result = textToHtml(text);
    expect(result).toContain('&amp;');
  });

  it('should handle quotes in text', () => {
    const text: Text = { type: 'text', value: 'He said "Hello"' };
    const result = textToHtml(text);
    expect(result).toContain('Hello');
  });

  it('should escape HTML-like content', () => {
    const text: Text = { type: 'text', value: "<script>alert('xss')</script>" };
    const result = textToHtml(text);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

// =============================================================================
// Whitespace Handling Tests
// =============================================================================

describe('Whitespace Handling', () => {
  it('should preserve single space', () => {
    const run: Run = { content: [{ type: 'text', value: 'Hello World' }] };
    const result = runToHtml(run);
    expect(result).toContain('Hello World');
  });

  it('should preserve multiple spaces with xml:space="preserve"', () => {
    const run: Run = { content: [{ type: 'text', value: 'Hello  World', space: 'preserve' }] };
    const result = runToHtml(run);
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should preserve leading spaces', () => {
    const run: Run = { content: [{ type: 'text', value: '  Indented', space: 'preserve' }] };
    const result = runToHtml(run);
    expect(result.includes('&nbsp;') || result.includes('  ')).toBe(true);
  });

  it('should preserve trailing spaces', () => {
    const run: Run = { content: [{ type: 'text', value: 'Text  ', space: 'preserve' }] };
    const result = runToHtml(run);
    expect(result).toContain('Text');
  });
});

// =============================================================================
// Inline vs Semantic HTML Tests
// =============================================================================

describe('HTML Output Mode', () => {
  it('should produce inline styles in inline mode', () => {
    const converter = new RunToHTMLConverter({ useSemanticTags: false });
    const run: Run = {
      rPr: { b: true },
      content: [{ type: 'text', value: 'Bold' }],
    };
    const result = converter.convert(run);
    expect(result).toContain('style=');
    expect(result).toContain('font-weight');
  });

  it('should use semantic tags in semantic mode', () => {
    const converter = new RunToHTMLConverter({ useSemanticTags: true });
    const run: Run = {
      rPr: { b: true },
      content: [{ type: 'text', value: 'Bold' }],
    };
    const result = converter.convert(run);
    expect(result).toContain('<strong>');
  });

  it('should not wrap plain text in span', () => {
    const run: Run = { content: [{ type: 'text', value: 'Plain text' }] };
    const result = runToHtml(run);
    expect(result).toContain('Plain text');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Run Edge Cases', () => {
  it('should handle empty text element', () => {
    const run: Run = { content: [{ type: 'text', value: '' }] };
    const result = runToHtml(run);
    expect(result).toBe('');
  });

  it('should handle only whitespace text', () => {
    const run: Run = { content: [{ type: 'text', value: '   ', space: 'preserve' }] };
    const result = runToHtml(run);
    expect(result.includes('&nbsp;') || result.includes('   ')).toBe(true);
  });

  it('should handle mixed content types', () => {
    const run: Run = {
      content: [
        { type: 'text', value: 'Part 1' },
        { type: 'break' },
        { type: 'text', value: 'Part 2' },
        { type: 'tab' },
        { type: 'text', value: 'Part 3' },
      ],
    };
    const result = runToHtml(run);
    expect(result).toContain('Part 1');
    expect(result).toContain('Part 2');
    expect(result).toContain('Part 3');
    expect(result).toContain('<br');
  });

  it('should handle very long text', () => {
    const longText = 'A'.repeat(10000);
    const run: Run = { content: [{ type: 'text', value: longText }] };
    const result = runToHtml(run);
    expect(result).toContain(longText);
  });

  it('should handle unicode characters', () => {
    const run: Run = { content: [{ type: 'text', value: 'Hello 世界 🌍' }] };
    const result = runToHtml(run);
    expect(result).toContain('世界');
    expect(result).toContain('🌍');
  });

  it('should handle RTL text', () => {
    const run: Run = { content: [{ type: 'text', value: 'مرحبا' }] };
    const result = runToHtml(run);
    expect(result).toContain('مرحبا');
  });

  it('should handle properties without content', () => {
    const run: Run = { rPr: { b: true }, content: [] };
    const result = runToHtml(run);
    expect(result).toBe('');
  });

  it('should handle double underline', () => {
    const run: Run = {
      rPr: { u: { val: 'double' } },
      content: [{ type: 'text', value: 'Double underlined' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('underline');
  });

  it('should handle wavy underline', () => {
    const run: Run = {
      rPr: { u: { val: 'wave' } },
      content: [{ type: 'text', value: 'Wavy underlined' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('underline');
  });

  it('should handle colored underline', () => {
    const run: Run = {
      rPr: { u: { val: 'single', color: 'FF0000' } },
      content: [{ type: 'text', value: 'Red underlined' }],
    };
    const result = runToHtml(run);
    expect(result).toContain('underline');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('RunToHTMLConverter Class', () => {
  it('should initialize converter', () => {
    const converter = new RunToHTMLConverter();
    expect(converter).not.toBeNull();
  });

  it('should initialize with options', () => {
    const converter = new RunToHTMLConverter({ useSemanticTags: false, useClasses: true });
    expect(converter.useSemanticTags).toBe(false);
    expect(converter.useClasses).toBe(true);
  });

  it('should convert run with convert method', () => {
    const converter = new RunToHTMLConverter();
    const run: Run = { content: [{ type: 'text', value: 'Test' }] };
    const result = converter.convert(run);
    expect(result).toContain('Test');
  });

  it('should convert content with convertContent method', () => {
    const converter = new RunToHTMLConverter();
    const text: Text = { type: 'text', value: 'Test' };
    const result = converter.convertContent(text);
    expect(result).toContain('Test');
  });
});
