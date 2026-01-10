/**
 * Unit tests for paragraph to HTML converter.
 *
 * Tests conversion of Paragraph elements to HTML p/div tags.
 * Matches Python: tests/unit/converters/html/test_paragraph_to_html.py
 */

import { describe, it, expect } from 'vitest';
import {
  ParagraphToHTMLConverter,
  paragraphToHtml,
  hyperlinkToHtml,
  bookmarkStartToHtml,
  bookmarkEndToHtml,
  paragraphContentToHtml,
} from '../paragraph-to-html';
import type { Paragraph } from '../../../models/document/paragraph';
import type { Run } from '../../../models/document/run';
import type { Hyperlink } from '../../../models/document/hyperlink';
import type { Border } from '../../../models/common/border';

// =============================================================================
// Basic Paragraph Conversion Tests
// =============================================================================

describe('Basic Paragraph Conversion', () => {
  it('should convert simple paragraph', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Hello' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('<p>');
    expect(result).toContain('Hello');
    expect(result).toContain('</p>');
  });

  it('should convert empty paragraph', () => {
    const para: Paragraph = { content: [] };
    const result = paragraphToHtml(para);
    expect(result).toContain('<p>');
    expect(result).toContain('</p>');
  });

  it('should return empty string for null paragraph', () => {
    const result = paragraphToHtml(null);
    expect(result).toBe('');
  });

  it('should convert paragraph with multiple runs', () => {
    const para: Paragraph = {
      content: [
        { content: [{ type: 'text', value: 'Hello ' }] },
        { content: [{ type: 'text', value: 'World' }] },
      ],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Hello ');
    expect(result).toContain('World');
  });

  it('should preserve run order', () => {
    const para: Paragraph = {
      content: [
        { content: [{ type: 'text', value: 'First' }] },
        { content: [{ type: 'text', value: 'Second' }] },
        { content: [{ type: 'text', value: 'Third' }] },
      ],
    };
    const result = paragraphToHtml(para);
    const firstPos = result.indexOf('First');
    const secondPos = result.indexOf('Second');
    const thirdPos = result.indexOf('Third');
    expect(firstPos).toBeLessThan(secondPos);
    expect(secondPos).toBeLessThan(thirdPos);
  });
});

// =============================================================================
// Paragraph Alignment Tests
// =============================================================================

describe('Paragraph Alignment', () => {
  it('should convert left alignment', () => {
    const para: Paragraph = {
      pPr: { jc: 'left' },
      content: [{ content: [{ type: 'text', value: 'Left' }] }],
    };
    const result = paragraphToHtml(para);
    // left is default, may or may not include explicit text-align
    expect(result).toContain('Left');
  });

  it('should convert center alignment', () => {
    const para: Paragraph = {
      pPr: { jc: 'center' },
      content: [{ content: [{ type: 'text', value: 'Centered' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('text-align');
    expect(result).toContain('center');
  });

  it('should convert right alignment', () => {
    const para: Paragraph = {
      pPr: { jc: 'right' },
      content: [{ content: [{ type: 'text', value: 'Right' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('text-align');
    expect(result).toContain('right');
  });

  it('should convert justify alignment', () => {
    const para: Paragraph = {
      pPr: { jc: 'both' },
      content: [{ content: [{ type: 'text', value: 'Justified text' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('text-align');
    expect(result).toContain('justify');
  });

  it('should convert distribute alignment', () => {
    const para: Paragraph = {
      pPr: { jc: 'distribute' },
      content: [{ content: [{ type: 'text', value: 'Distributed' }] }],
    };
    const result = paragraphToHtml(para);
    // Distribute typically maps to justify
    expect(result).toContain('Distributed');
  });
});

// =============================================================================
// Paragraph Spacing Tests
// =============================================================================

describe('Paragraph Spacing', () => {
  it('should apply space before paragraph', () => {
    const para: Paragraph = {
      pPr: { spacing: { before: 240 } }, // 12pt
      content: [{ content: [{ type: 'text', value: 'Spaced' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('margin-top');
  });

  it('should apply space after paragraph', () => {
    const para: Paragraph = {
      pPr: { spacing: { after: 240 } }, // 12pt
      content: [{ content: [{ type: 'text', value: 'Spaced' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('margin-bottom');
  });

  it('should handle single line spacing', () => {
    const para: Paragraph = {
      pPr: { spacing: { line: 240, lineRule: 'auto' } },
      content: [{ content: [{ type: 'text', value: 'Single spaced' }] }],
    };
    const result = paragraphToHtml(para);
    // Single spacing (1.0) might not add line-height
    expect(result).toContain('Single spaced');
  });

  it('should handle double line spacing', () => {
    const para: Paragraph = {
      pPr: { spacing: { line: 480, lineRule: 'auto' } },
      content: [{ content: [{ type: 'text', value: 'Double spaced' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('line-height');
  });

  it('should handle exact line spacing', () => {
    const para: Paragraph = {
      pPr: { spacing: { line: 300, lineRule: 'exact' } },
      content: [{ content: [{ type: 'text', value: 'Exact spacing' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('line-height');
  });

  it('should handle at least line spacing', () => {
    const para: Paragraph = {
      pPr: { spacing: { line: 300, lineRule: 'atLeast' } },
      content: [{ content: [{ type: 'text', value: 'At least spacing' }] }],
    };
    const result = paragraphToHtml(para);
    // atLeast uses min-height instead of line-height
    expect(result.includes('min-height') || result.includes('line-height')).toBe(true);
  });
});

// =============================================================================
// Paragraph Indentation Tests
// =============================================================================

describe('Paragraph Indentation', () => {
  it('should apply left indent', () => {
    const para: Paragraph = {
      pPr: { ind: { left: 720 } }, // 0.5in
      content: [{ content: [{ type: 'text', value: 'Indented' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('margin-left');
  });

  it('should apply right indent', () => {
    const para: Paragraph = {
      pPr: { ind: { right: 720 } },
      content: [{ content: [{ type: 'text', value: 'Right indented' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('margin-right');
  });

  it('should apply first line indent', () => {
    const para: Paragraph = {
      pPr: { ind: { firstLine: 720 } },
      content: [{ content: [{ type: 'text', value: 'First line indented paragraph' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('text-indent');
  });

  it('should apply hanging indent', () => {
    const para: Paragraph = {
      pPr: { ind: { left: 720, hanging: 720 } },
      content: [{ content: [{ type: 'text', value: 'Hanging indent' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('text-indent');
  });

  it('should apply start/end indent for RTL support', () => {
    const para: Paragraph = {
      pPr: { ind: { start: 720, end: 360 } },
      content: [{ content: [{ type: 'text', value: 'RTL aware indentation' }] }],
    };
    const result = paragraphToHtml(para);
    // Start/end get converted to left/right in CSS
    expect(result).toContain('RTL aware indentation');
  });
});

// =============================================================================
// Paragraph Border Tests
// =============================================================================

describe('Paragraph Borders', () => {
  it('should apply top border', () => {
    const para: Paragraph = {
      pPr: {
        pBdr: { top: { val: 'single', sz: 8, color: '000000' } },
      },
      content: [{ content: [{ type: 'text', value: 'Bordered' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('border-top');
  });

  it('should apply bottom border', () => {
    const para: Paragraph = {
      pPr: {
        pBdr: { bottom: { val: 'single', sz: 8, color: '000000' } },
      },
      content: [{ content: [{ type: 'text', value: 'Bordered' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('border-bottom');
  });

  it('should apply all borders', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const para: Paragraph = {
      pPr: {
        pBdr: { top: border, bottom: border, left: border, right: border },
      },
      content: [{ content: [{ type: 'text', value: 'Box border' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('border');
  });

  it('should handle bar border', () => {
    const para: Paragraph = {
      pPr: {
        pBdr: { bar: { val: 'single', sz: 8, color: 'FF0000' } },
      },
      content: [{ content: [{ type: 'text', value: 'With bar' }] }],
    };
    const result = paragraphToHtml(para);
    // Bar is converted to border
    expect(result).toContain('With bar');
  });
});

// =============================================================================
// Paragraph Shading Tests
// =============================================================================

describe('Paragraph Shading', () => {
  it('should apply fill color', () => {
    const para: Paragraph = {
      pPr: { shd: { fill: 'FFFF00' } },
      content: [{ content: [{ type: 'text', value: 'Yellow background' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('background');
  });

  it('should handle pattern shading', () => {
    const para: Paragraph = {
      pPr: { shd: { val: 'pct25', color: '000000', fill: 'FFFFFF' } },
      content: [{ content: [{ type: 'text', value: 'Patterned' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Patterned');
  });

  it('should handle clear shading', () => {
    const para: Paragraph = {
      pPr: { shd: { val: 'clear' } },
      content: [{ content: [{ type: 'text', value: 'No shading' }] }],
    };
    const result = paragraphToHtml(para);
    // Should not add background style for clear
    expect(result).toContain('No shading');
  });
});

// =============================================================================
// Hyperlink Tests
// =============================================================================

describe('Hyperlink Conversion', () => {
  it('should convert external hyperlink', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId1',
      content: [{ content: [{ type: 'text', value: 'Click here' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para, { relationships: { rId1: 'https://example.com' } });
    expect(result).toContain('<a');
    expect(result).toContain('href=');
    expect(result).toContain('https://example.com');
  });

  it('should convert internal anchor link', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      anchor: 'Section1',
      content: [{ content: [{ type: 'text', value: 'Go to Section 1' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para);
    expect(result).toContain('href="#Section1"');
  });

  it('should convert hyperlink with tooltip', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId1',
      tooltip: 'Visit our website',
      content: [{ content: [{ type: 'text', value: 'Link' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para, { relationships: { rId1: 'https://example.com' } });
    expect(result).toContain('title=');
    expect(result).toContain('Visit our website');
  });

  it('should convert hyperlink with formatted runs', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId1',
      content: [{ rPr: { b: true }, content: [{ type: 'text', value: 'Bold link' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para, { relationships: { rId1: 'https://example.com' } });
    expect(result).toContain('Bold link');
    expect(result).toContain('<a');
  });

  it('should handle missing relationship', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId999', // Not in relationships
      content: [{ content: [{ type: 'text', value: 'Broken link' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para, { relationships: {} });
    // Should handle gracefully
    expect(result).toContain('Broken link');
    expect(result).toContain('<a');
  });

  it('should handle mixed content with hyperlinks', () => {
    const para: Paragraph = {
      content: [
        { content: [{ type: 'text', value: 'Click ' }] },
        {
          type: 'hyperlink',
          rId: 'rId1',
          content: [{ content: [{ type: 'text', value: 'here' }] }],
        } as Hyperlink,
        { content: [{ type: 'text', value: ' for more.' }] },
      ],
    };
    const result = paragraphToHtml(para, { relationships: { rId1: 'https://example.com' } });
    expect(result).toContain('Click ');
    expect(result).toContain('<a');
    expect(result).toContain('here');
    expect(result).toContain('for more.');
  });
});

// =============================================================================
// Bookmark Tests
// =============================================================================

describe('Bookmark Conversion', () => {
  it('should create bookmark start anchor', () => {
    const para: Paragraph = {
      content: [
        { type: 'bookmarkStart', id: '0', name: 'Section1' },
        { content: [{ type: 'text', value: 'Section content' }] },
      ],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('id="Section1"');
  });

  it('should handle bookmark end (invisible)', () => {
    const para: Paragraph = {
      content: [
        { content: [{ type: 'text', value: 'Content' }] },
        { type: 'bookmarkEnd', id: '0' },
      ],
    };
    const result = paragraphToHtml(para);
    // Bookmark end should not add visible content
    expect(result).toContain('Content');
  });

  it('should handle bookmark range', () => {
    const para: Paragraph = {
      content: [
        { type: 'bookmarkStart', id: '0', name: 'Important' },
        { content: [{ type: 'text', value: 'Important content' }] },
        { type: 'bookmarkEnd', id: '0' },
      ],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('id="Important"');
  });

  it('should test bookmark_start_to_html standalone', () => {
    const result = bookmarkStartToHtml({ type: 'bookmarkStart', id: '0', name: 'MyBookmark' });
    expect(result).toContain('id="MyBookmark"');
  });

  it('should test bookmark_end_to_html standalone', () => {
    const result = bookmarkEndToHtml({ type: 'bookmarkEnd', id: '0' });
    expect(result).toBe('');
  });
});

// =============================================================================
// Numbering/List Tests
// =============================================================================

describe('Numbering Conversion', () => {
  it('should render numbered paragraph', () => {
    const para: Paragraph = {
      pPr: { numPr: { numId: 1, ilvl: 0 } },
      content: [{ content: [{ type: 'text', value: 'First item' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '1. ' });
    expect(result).toContain('1.');
  });

  it('should render bulleted paragraph', () => {
    const para: Paragraph = {
      pPr: { numPr: { numId: 2, ilvl: 0 } },
      content: [{ content: [{ type: 'text', value: 'Bullet item' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '\u2022 ' });
    expect(result).toContain('\u2022');
  });

  it('should handle nested list item', () => {
    const para: Paragraph = {
      pPr: { numPr: { numId: 1, ilvl: 1 } },
      content: [{ content: [{ type: 'text', value: 'Nested item' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: 'a. ' });
    expect(result).toContain('a.');
    expect(result).toContain('Nested item');
  });

  it('should apply numbered paragraph indentation', () => {
    const para: Paragraph = {
      pPr: {
        numPr: { numId: 1, ilvl: 0 },
        ind: { left: 720 },
      },
      content: [{ content: [{ type: 'text', value: 'Indented list' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '1. ' });
    expect(result).toContain('margin-left');
  });

  it('should apply numbering_indent_pt parameter', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Indented item' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '1.\t', numberingIndentPt: 36.0 });
    expect(result.includes('margin-left: 36') || result.includes('margin-left:36')).toBe(true);
  });

  it('should allow numbering_indent_pt to override paragraph indent', () => {
    const para: Paragraph = {
      pPr: { ind: { left: 1440 } }, // 72pt
      content: [{ content: [{ type: 'text', value: 'Item' }] }],
    };
    // numberingIndentPt should override to 36pt
    const result = paragraphToHtml(para, { numberingPrefix: '1.\t', numberingIndentPt: 36.0 });
    expect(result).toContain('36');
  });

  it('should apply numbering_styles to marker', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Bold marker text' }] }],
    };
    const result = paragraphToHtml(para, {
      numberingPrefix: '1.\t',
      numberingStyles: { 'font-weight': 'bold' },
    });
    expect(result).toContain('class="list-marker"');
    expect(result).toContain('font-weight');
    expect(result).toContain('bold');
  });

  it('should handle numbering_styles with multiple properties', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Styled marker' }] }],
    };
    const result = paragraphToHtml(para, {
      numberingPrefix: '1.\t',
      numberingStyles: { 'font-weight': 'bold', color: '#FF0000' },
    });
    expect(result).toContain('font-weight');
    expect(result).toContain('#FF0000');
  });

  it('should handle numbering_styles with font-family', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Font marker' }] }],
    };
    const result = paragraphToHtml(para, {
      numberingPrefix: '1.\t',
      numberingStyles: { 'font-family': "'Times New Roman'" },
    });
    expect(result).toContain('font-family');
    expect(result).toContain('Times New Roman');
  });

  it('should use plain marker when numbering_styles is null', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Plain marker' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '1.\t', numberingStyles: undefined });
    expect(result).toContain('class="list-marker"');
    // Should not have inline style on marker
    expect(result).not.toContain('list-marker" style="');
  });

  it('should use plain marker when numbering_styles is empty', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Empty style' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '1.\t', numberingStyles: {} });
    expect(result).toContain('class="list-marker"');
  });

  it('should combine indent and styles', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Styled and indented' }] }],
    };
    const result = paragraphToHtml(para, {
      numberingPrefix: '1.\t',
      numberingIndentPt: 72.0,
      numberingStyles: { 'font-style': 'italic' },
    });
    // Should have both margin-left and italic style
    expect(result).toContain('margin-left');
    expect(result).toContain('72');
    expect(result).toContain('font-style');
    expect(result).toContain('italic');
  });

  it('should escape HTML in prefix', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'HTML chars' }] }],
    };
    const result = paragraphToHtml(para, { numberingPrefix: '<1>\t' });
    // Should escape < and > in prefix
    expect(result).toContain('&lt;1&gt;');
  });
});

// =============================================================================
// Tab Stop Tests
// =============================================================================

describe('Tab Stop Conversion', () => {
  it('should handle left tab stop', () => {
    const para: Paragraph = {
      pPr: { tabs: [{ val: 'left', pos: 720 }] },
      content: [{ content: [{ type: 'text', value: 'Tab content' }] }],
    };
    const result = paragraphToHtml(para);
    // Tab stops are paragraph properties, content should render
    expect(result).toContain('Tab content');
  });

  it('should handle right tab stop', () => {
    const para: Paragraph = {
      pPr: { tabs: [{ val: 'right', pos: 9360 }] },
      content: [{ content: [{ type: 'text', value: 'Right aligned' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Right aligned');
  });

  it('should handle center tab stop', () => {
    const para: Paragraph = {
      pPr: { tabs: [{ val: 'center', pos: 4680 }] },
      content: [{ content: [{ type: 'text', value: 'Centered' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Centered');
  });

  it('should handle decimal tab stop', () => {
    const para: Paragraph = {
      pPr: { tabs: [{ val: 'decimal', pos: 5760 }] },
      content: [{ content: [{ type: 'text', value: '123.45' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('123.45');
  });

  it('should handle tab with leader', () => {
    const para: Paragraph = {
      pPr: { tabs: [{ val: 'right', pos: 9360, leader: 'dot' }] },
      content: [{ content: [{ type: 'text', value: 'TOC entry' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('TOC entry');
  });
});

// =============================================================================
// Page Break Control Tests
// =============================================================================

describe('Page Break Control', () => {
  it('should apply page break before', () => {
    const para: Paragraph = {
      pPr: { pageBreakBefore: true },
      content: [{ content: [{ type: 'text', value: 'New page' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('page-break-before');
  });

  it('should apply keep with next', () => {
    const para: Paragraph = {
      pPr: { keepNext: true },
      content: [{ content: [{ type: 'text', value: 'Heading' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result.includes('break-after') || result.includes('page-break-after')).toBe(true);
  });

  it('should apply keep lines together', () => {
    const para: Paragraph = {
      pPr: { keepLines: true },
      content: [{ content: [{ type: 'text', value: "Don't split me" }] }],
    };
    const result = paragraphToHtml(para);
    expect(result.includes('break-inside') || result.includes('page-break-inside')).toBe(true);
  });

  it('should handle widow control', () => {
    const para: Paragraph = {
      pPr: { widowControl: true },
      content: [{ content: [{ type: 'text', value: 'Protected text' }] }],
    };
    const result = paragraphToHtml(para);
    // Widow control might add orphans/widows CSS or just be noted
    expect(result).toContain('Protected text');
  });
});

// =============================================================================
// Style Reference Tests
// =============================================================================

describe('Style Reference', () => {
  it('should handle paragraph style reference', () => {
    const para: Paragraph = {
      pPr: { pStyle: 'Heading1' },
      content: [{ content: [{ type: 'text', value: 'Heading' }] }],
    };
    const result = paragraphToHtml(para);
    // Style reference doesn't directly affect output without style resolver
    expect(result).toContain('Heading');
  });

  it('should allow direct override of style', () => {
    const para: Paragraph = {
      pPr: { pStyle: 'Normal', jc: 'center' },
      content: [{ content: [{ type: 'text', value: 'Centered' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('center');
  });
});

// =============================================================================
// RTL and BiDi Tests
// =============================================================================

describe('BiDi Support', () => {
  it('should apply RTL direction', () => {
    const para: Paragraph = {
      pPr: { bidi: true },
      content: [{ content: [{ type: 'text', value: '\u0645\u0631\u062D\u0628\u0627' }] }], // "مرحبا"
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('dir="rtl"');
  });

  it('should handle LTR direction', () => {
    const para: Paragraph = {
      pPr: { bidi: false },
      content: [{ content: [{ type: 'text', value: 'Hello' }] }],
    };
    const result = paragraphToHtml(para);
    // LTR is default, might not need explicit attribute
    expect(result).toContain('Hello');
  });
});

// =============================================================================
// Heading/Outline Level Tests
// =============================================================================

describe('Outline Level Conversion', () => {
  it('should convert outline level 0 to h1', () => {
    const para: Paragraph = {
      pPr: { outlineLvl: 0 },
      content: [{ content: [{ type: 'text', value: 'Main Heading' }] }],
    };
    const result = paragraphToHtml(para, { useHeadings: true });
    expect(result).toContain('<h1');
  });

  it('should convert outline level 1 to h2', () => {
    const para: Paragraph = {
      pPr: { outlineLvl: 1 },
      content: [{ content: [{ type: 'text', value: 'Subheading' }] }],
    };
    const result = paragraphToHtml(para, { useHeadings: true });
    expect(result).toContain('<h2');
  });

  it('should use p tag without heading mode', () => {
    const para: Paragraph = {
      pPr: { outlineLvl: 0 },
      content: [{ content: [{ type: 'text', value: 'Heading as paragraph' }] }],
    };
    const result = paragraphToHtml(para, { useHeadings: false });
    expect(result).toContain('<p');
  });
});

// =============================================================================
// HTML Output Mode Tests
// =============================================================================

describe('Paragraph HTML Output Mode', () => {
  it('should produce inline styles', () => {
    const converter = new ParagraphToHTMLConverter({ useInlineStyles: true });
    const para: Paragraph = {
      pPr: { jc: 'center' },
      content: [{ content: [{ type: 'text', value: 'Centered' }] }],
    };
    const result = converter.convert(para);
    expect(result).toContain('style=');
  });

  it('should initialize with class mode', () => {
    const converter = new ParagraphToHTMLConverter({ useClasses: true });
    expect(converter.useClasses).toBe(true);
  });

  it('should use semantic tags', () => {
    const converter = new ParagraphToHTMLConverter({ useSemanticTags: true });
    const para: Paragraph = {
      content: [{ rPr: { b: true }, content: [{ type: 'text', value: 'Bold' }] }],
    };
    const result = converter.convert(para);
    expect(result).toContain('<strong>');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Paragraph Edge Cases', () => {
  it('should handle paragraph with only whitespace', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: '   ', space: 'preserve' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with empty run', () => {
    const para: Paragraph = { content: [{ content: [] }] };
    const result = paragraphToHtml(para);
    expect(result).toContain('<p>');
  });

  it('should handle very long paragraph', () => {
    const longText = 'A'.repeat(10000);
    const para: Paragraph = { content: [{ content: [{ type: 'text', value: longText }] }] };
    const result = paragraphToHtml(para);
    expect(result).toContain(longText);
  });

  it('should handle paragraph with all properties', () => {
    const para: Paragraph = {
      pPr: {
        jc: 'center',
        spacing: { before: 240, after: 120 },
        ind: { left: 720 },
      },
      content: [{ content: [{ type: 'text', value: 'Complex paragraph' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('center');
    expect(result).toContain('margin');
  });

  it('should handle unicode content', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Hello \u4E16\u754C \uD83C\uDF0D' }] }], // "Hello 世界 🌍"
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('\u4E16\u754C');
    expect(result).toContain('\uD83C\uDF0D');
  });

  it('should escape special characters', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: "<script>alert('xss')</script>" }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should handle properties without content', () => {
    const para: Paragraph = { pPr: { jc: 'center' }, content: [] };
    const result = paragraphToHtml(para);
    expect(result).toContain('<p');
    expect(result).toContain('</p>');
  });

  it('should handle nested hyperlinks gracefully', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId1',
      content: [{ content: [{ type: 'text', value: 'Link text' }] }],
    };
    const para: Paragraph = { content: [hyperlink] };
    const result = paragraphToHtml(para, { relationships: { rId1: 'https://example.com' } });
    // Just verify it renders properly
    expect(result).toContain('Link text');
  });

  it('should handle multiple bookmarks', () => {
    const para: Paragraph = {
      content: [
        { type: 'bookmarkStart', id: '0', name: 'Bookmark1' },
        { content: [{ type: 'text', value: 'First' }] },
        { type: 'bookmarkStart', id: '1', name: 'Bookmark2' },
        { content: [{ type: 'text', value: 'Second' }] },
      ],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('id="Bookmark1"');
    expect(result).toContain('id="Bookmark2"');
  });

  it('should handle combined spacing and indentation', () => {
    const para: Paragraph = {
      pPr: {
        spacing: { before: 240, after: 120, line: 480, lineRule: 'auto' },
        ind: { left: 720, firstLine: 360 },
      },
      content: [{ content: [{ type: 'text', value: 'Complex formatting' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('margin-top');
    expect(result).toContain('margin-bottom');
    expect(result).toContain('line-height');
    expect(result).toContain('margin-left');
    expect(result).toContain('text-indent');
  });

  it('should handle paragraph default run properties', () => {
    const para: Paragraph = {
      pPr: {
        rPr: { b: true }, // Default bold for runs
      },
      content: [{ content: [{ type: 'text', value: 'Should render' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Should render');
  });
});

// =============================================================================
// Line Numbering Tests
// =============================================================================

describe('Line Numbering', () => {
  it('should handle suppress line numbers', () => {
    const para: Paragraph = {
      pPr: { suppressLineNumbers: true },
      content: [{ content: [{ type: 'text', value: 'No line numbers' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('No line numbers');
  });
});

// =============================================================================
// Text Direction Tests
// =============================================================================

describe('Text Direction', () => {
  it('should handle default LR-TB direction', () => {
    const para: Paragraph = {
      content: [{ content: [{ type: 'text', value: 'Normal text' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Normal text');
  });

  it('should handle vertical TB-RL direction', () => {
    const para: Paragraph = {
      pPr: { textDirection: 'tbRl' },
      content: [{ content: [{ type: 'text', value: 'Vertical' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('Vertical');
  });
});

// =============================================================================
// Auto Hyphenation Tests
// =============================================================================

describe('Auto Hyphenation', () => {
  it('should handle suppress auto hyphens', () => {
    const para: Paragraph = {
      pPr: { suppressAutoHyphens: true },
      content: [{ content: [{ type: 'text', value: 'No auto hyphens' }] }],
    };
    const result = paragraphToHtml(para);
    expect(result).toContain('No auto hyphens');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('ParagraphToHTMLConverter Class', () => {
  it('should initialize converter', () => {
    const converter = new ParagraphToHTMLConverter();
    expect(converter).not.toBeNull();
  });

  it('should initialize with options', () => {
    const converter = new ParagraphToHTMLConverter({
      useSemanticTags: false,
      useClasses: true,
      useHeadings: true,
    });
    expect(converter.useSemanticTags).toBe(false);
    expect(converter.useClasses).toBe(true);
    expect(converter.useHeadings).toBe(true);
  });

  it('should set relationships', () => {
    const converter = new ParagraphToHTMLConverter();
    converter.setRelationships({ rId1: 'https://example.com' });
    expect(converter.relationships['rId1']).toBe('https://example.com');
  });

  it('should convert paragraph', () => {
    const converter = new ParagraphToHTMLConverter();
    const para: Paragraph = { content: [{ content: [{ type: 'text', value: 'Test' }] }] };
    const result = converter.convert(para);
    expect(result).toContain('Test');
  });

  it('should convert content', () => {
    const converter = new ParagraphToHTMLConverter();
    const run: Run = { content: [{ type: 'text', value: 'Test' }] };
    const result = converter.convertContent(run);
    expect(result).toContain('Test');
  });

  it('should test hyperlink_to_html directly', () => {
    const hyperlink: Hyperlink = {
      type: 'hyperlink',
      rId: 'rId1',
      content: [{ content: [{ type: 'text', value: 'Link' }] }],
    };
    const result = hyperlinkToHtml(hyperlink, { rId1: 'https://example.com' });
    expect(result).toContain('<a');
    expect(result).toContain('https://example.com');
  });

  it('should test paragraph_content_to_html function', () => {
    const run: Run = { content: [{ type: 'text', value: 'Test' }] };
    const result = paragraphContentToHtml(run);
    expect(result).toContain('Test');
  });
});

// =============================================================================
// Style Resolution Tests (Regression Tests)
// =============================================================================

describe('Paragraph Style Resolution', () => {
  it('should resolve paragraph style with style_resolver', () => {
    // Note: Full style resolver testing requires style resolver implementation
    // This test documents the expected behavior
    const para: Paragraph = {
      pPr: { pStyle: 'Heading1' },
      content: [{ content: [{ type: 'text', value: 'Styled heading' }] }],
    };
    // Without style resolver, direct formatting still applies
    const result = paragraphToHtml(para);
    expect(result).toContain('Styled heading');
  });

  it('should allow direct formatting to override style', () => {
    const para: Paragraph = {
      pPr: { pStyle: 'Normal', jc: 'right' },
      content: [{ content: [{ type: 'text', value: 'Right aligned' }] }],
    };
    const result = paragraphToHtml(para);
    // Direct formatting (right) should apply
    expect(result).toContain('text-align');
    expect(result).toContain('right');
  });

  it('should handle missing style gracefully', () => {
    const para: Paragraph = {
      pPr: { pStyle: 'NonexistentStyle' },
      content: [{ content: [{ type: 'text', value: 'Content' }] }],
    };
    const result = paragraphToHtml(para);
    // Should still render content without error
    expect(result).toContain('Content');
  });

  it('should work without style_resolver', () => {
    const para: Paragraph = {
      pPr: { pStyle: 'Heading1', jc: 'center' },
      content: [{ content: [{ type: 'text', value: 'Content' }] }],
    };
    // No styleResolver - direct formatting still applies
    const result = paragraphToHtml(para, { styleResolver: undefined });
    expect(result).toContain('Content');
    expect(result).toContain('center');
  });
});
