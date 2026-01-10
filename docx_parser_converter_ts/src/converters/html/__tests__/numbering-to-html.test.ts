/**
 * Unit tests for numbering to HTML converter.
 *
 * Tests conversion of list numbering to HTML.
 * Matches Python: tests/unit/converters/html/test_numbering_to_html.py
 */

import { describe, it, expect } from 'vitest';
import {
  NumberingToHTMLConverter,
  toRoman,
  toLetter,
  toOrdinal,
  toOrdinalText,
  toChicago,
  formatNumber,
  applyLevelText,
  getSuffix,
  generateCssCounterStyle,
  generateCounterResetCss,
  generateCounterContentCss,
  getListType,
  getListStyleType,
} from '../numbering-to-html';

// =============================================================================
// Roman Numeral Tests
// =============================================================================

describe('Roman Numerals', () => {
  it('should convert 1 to i', () => {
    expect(toRoman(1)).toBe('i');
  });

  it('should convert 5 to v', () => {
    expect(toRoman(5)).toBe('v');
  });

  it('should convert 10 to x', () => {
    expect(toRoman(10)).toBe('x');
  });

  it('should convert 50 to l', () => {
    expect(toRoman(50)).toBe('l');
  });

  it('should convert 100 to c', () => {
    expect(toRoman(100)).toBe('c');
  });

  it('should convert 500 to d', () => {
    expect(toRoman(500)).toBe('d');
  });

  it('should convert 1000 to m', () => {
    expect(toRoman(1000)).toBe('m');
  });

  it('should convert 4 to iv', () => {
    expect(toRoman(4)).toBe('iv');
  });

  it('should convert 9 to ix', () => {
    expect(toRoman(9)).toBe('ix');
  });

  it('should convert 14 to xiv', () => {
    expect(toRoman(14)).toBe('xiv');
  });

  it('should convert 40 to xl', () => {
    expect(toRoman(40)).toBe('xl');
  });

  it('should convert 90 to xc', () => {
    expect(toRoman(90)).toBe('xc');
  });

  it('should convert 400 to cd', () => {
    expect(toRoman(400)).toBe('cd');
  });

  it('should convert 900 to cm', () => {
    expect(toRoman(900)).toBe('cm');
  });

  it('should convert 1999 to mcmxcix', () => {
    expect(toRoman(1999)).toBe('mcmxcix');
  });

  it('should handle uppercase roman numerals', () => {
    expect(toRoman(5, false)).toBe('V');
  });

  it('should handle zero gracefully', () => {
    expect(toRoman(0)).toBe('0');
  });

  it('should handle negative numbers gracefully', () => {
    expect(toRoman(-1)).toBe('-1');
  });
});

// =============================================================================
// Letter Conversion Tests
// =============================================================================

describe('Letter Conversion', () => {
  it('should convert 1 to a', () => {
    expect(toLetter(1)).toBe('a');
  });

  it('should convert 26 to z', () => {
    expect(toLetter(26)).toBe('z');
  });

  it('should convert 27 to aa', () => {
    expect(toLetter(27)).toBe('aa');
  });

  it('should convert 52 to az', () => {
    expect(toLetter(52)).toBe('az');
  });

  it('should convert 53 to ba', () => {
    expect(toLetter(53)).toBe('ba');
  });

  it('should handle uppercase letters', () => {
    expect(toLetter(1, false)).toBe('A');
  });

  it('should convert 702 to zz', () => {
    expect(toLetter(702)).toBe('zz');
  });
});

// =============================================================================
// Ordinal Tests
// =============================================================================

describe('Ordinal Numbers', () => {
  it('should convert 1 to 1st', () => {
    expect(toOrdinal(1)).toBe('1st');
  });

  it('should convert 2 to 2nd', () => {
    expect(toOrdinal(2)).toBe('2nd');
  });

  it('should convert 3 to 3rd', () => {
    expect(toOrdinal(3)).toBe('3rd');
  });

  it('should convert 4 to 4th', () => {
    expect(toOrdinal(4)).toBe('4th');
  });

  it('should convert 11 to 11th', () => {
    expect(toOrdinal(11)).toBe('11th');
  });

  it('should convert 12 to 12th', () => {
    expect(toOrdinal(12)).toBe('12th');
  });

  it('should convert 13 to 13th', () => {
    expect(toOrdinal(13)).toBe('13th');
  });

  it('should convert 21 to 21st', () => {
    expect(toOrdinal(21)).toBe('21st');
  });

  it('should convert 22 to 22nd', () => {
    expect(toOrdinal(22)).toBe('22nd');
  });

  it('should convert 23 to 23rd', () => {
    expect(toOrdinal(23)).toBe('23rd');
  });

  it('should convert 100 to 100th', () => {
    expect(toOrdinal(100)).toBe('100th');
  });

  it('should convert 111 to 111th', () => {
    expect(toOrdinal(111)).toBe('111th');
  });

  it('should convert 112 to 112th', () => {
    expect(toOrdinal(112)).toBe('112th');
  });

  it('should convert 113 to 113th', () => {
    expect(toOrdinal(113)).toBe('113th');
  });
});

// =============================================================================
// Ordinal Text Tests
// =============================================================================

describe('Ordinal Text', () => {
  it('should convert 1 to first', () => {
    expect(toOrdinalText(1)).toBe('first');
  });

  it('should convert 2 to second', () => {
    expect(toOrdinalText(2)).toBe('second');
  });

  it('should convert 3 to third', () => {
    expect(toOrdinalText(3)).toBe('third');
  });

  it('should convert 4 to fourth', () => {
    expect(toOrdinalText(4)).toBe('fourth');
  });

  it('should convert 5 to fifth', () => {
    expect(toOrdinalText(5)).toBe('fifth');
  });

  it('should convert 10 to tenth', () => {
    expect(toOrdinalText(10)).toBe('tenth');
  });

  it('should convert large numbers to ordinal string', () => {
    expect(toOrdinalText(100)).toBe('100th');
  });
});

// =============================================================================
// Chicago Style Tests
// =============================================================================

describe('Chicago Style', () => {
  it('should convert 1 to *', () => {
    expect(toChicago(1)).toBe('*');
  });

  it('should convert 2 to †', () => {
    expect(toChicago(2)).toBe('†');
  });

  it('should convert 3 to ‡', () => {
    expect(toChicago(3)).toBe('‡');
  });

  it('should convert 4 to §', () => {
    expect(toChicago(4)).toBe('§');
  });

  it('should cycle back after 4 symbols', () => {
    expect(toChicago(5)).toBe('**');
  });

  it('should double symbols in second cycle', () => {
    expect(toChicago(8)).toBe('§§');
  });
});

// =============================================================================
// formatNumber Tests
// =============================================================================

describe('formatNumber', () => {
  it('should format decimal', () => {
    expect(formatNumber(1, 'decimal')).toBe('1');
  });

  it('should format lowerLetter', () => {
    expect(formatNumber(1, 'lowerLetter')).toBe('a');
  });

  it('should format upperLetter', () => {
    expect(formatNumber(1, 'upperLetter')).toBe('A');
  });

  it('should format lowerRoman', () => {
    expect(formatNumber(5, 'lowerRoman')).toBe('v');
  });

  it('should format upperRoman', () => {
    expect(formatNumber(5, 'upperRoman')).toBe('V');
  });

  it('should format ordinal', () => {
    expect(formatNumber(1, 'ordinal')).toBe('1st');
  });

  it('should format ordinalText', () => {
    expect(formatNumber(1, 'ordinalText')).toBe('first');
  });

  it('should format bullet as empty', () => {
    expect(formatNumber(1, 'bullet')).toBe('');
  });

  it('should format none as empty', () => {
    expect(formatNumber(1, 'none')).toBe('');
  });

  it('should format decimalZero with leading zero', () => {
    expect(formatNumber(1, 'decimalZero')).toBe('01');
  });

  it('should format decimalEnclosedCircle', () => {
    expect(formatNumber(1, 'decimalEnclosedCircle')).toBe('①');
  });

  it('should default to decimal for unknown format', () => {
    expect(formatNumber(1, 'unknownFormat' as any)).toBe('1');
  });
});

// =============================================================================
// applyLevelText Tests
// =============================================================================

describe('applyLevelText', () => {
  it('should replace %1 with formatted number', () => {
    expect(applyLevelText('%1.', [1])).toBe('1.');
  });

  it('should replace %1 and %2 in multi-level', () => {
    expect(applyLevelText('%1.%2.', [1, 2])).toBe('1.2.');
  });

  it('should handle parentheses format', () => {
    expect(applyLevelText('(%1)', [1])).toBe('(1)');
  });

  it('should handle bracket format', () => {
    expect(applyLevelText('[%1]', [1])).toBe('[1]');
  });

  it('should handle prefix and suffix', () => {
    expect(applyLevelText('Item %1:', [1])).toBe('Item 1:');
  });

  it('should handle missing levels gracefully', () => {
    expect(applyLevelText('%1.%2.%3.', [1])).toContain('1.');
  });
});

// =============================================================================
// getSuffix Tests
// =============================================================================

describe('getSuffix', () => {
  it('should return tab for tab suffix', () => {
    expect(getSuffix('tab')).toBe('\t');
  });

  it('should return space for space suffix', () => {
    expect(getSuffix('space')).toBe(' ');
  });

  it('should return empty for nothing suffix', () => {
    expect(getSuffix('nothing')).toBe('');
  });

  it('should default to tab for null', () => {
    expect(getSuffix(null)).toBe('\t');
  });

  it('should default to tab for undefined', () => {
    expect(getSuffix(undefined)).toBe('\t');
  });
});

// =============================================================================
// CSS Counter Style Tests
// =============================================================================

describe('CSS Counter Styles', () => {
  it('should generate CSS counter style for decimal', () => {
    const css = generateCssCounterStyle('decimal');
    expect(css).toBe('decimal');
  });

  it('should generate CSS counter style for lower-alpha', () => {
    const css = generateCssCounterStyle('lowerLetter');
    expect(css).toBe('lower-alpha');
  });

  it('should generate CSS counter style for upper-alpha', () => {
    const css = generateCssCounterStyle('upperLetter');
    expect(css).toBe('upper-alpha');
  });

  it('should generate CSS counter style for lower-roman', () => {
    const css = generateCssCounterStyle('lowerRoman');
    expect(css).toBe('lower-roman');
  });

  it('should generate CSS counter style for upper-roman', () => {
    const css = generateCssCounterStyle('upperRoman');
    expect(css).toBe('upper-roman');
  });

  it('should generate CSS counter style for disc (bullet)', () => {
    const css = generateCssCounterStyle('bullet');
    expect(css).toBe('disc');
  });
});

// =============================================================================
// Counter Reset/Content CSS Tests
// =============================================================================

describe('Counter CSS Generation', () => {
  it('should generate counter reset CSS', () => {
    const css = generateCounterResetCss('list-1', 1);
    expect(css).toContain('counter-reset');
    expect(css).toContain('list-1');
  });

  it('should generate counter content CSS', () => {
    const css = generateCounterContentCss('list-1', 'decimal', '%1.');
    expect(css).toContain('content');
    expect(css).toContain('counter(list-1');
  });

  it('should handle multiple counters in content', () => {
    const css = generateCounterContentCss('list-1', 'decimal', '%1.%2.');
    expect(css).toContain('content');
  });
});

// =============================================================================
// List Type Detection Tests
// =============================================================================

describe('List Type Detection', () => {
  it('should detect ordered list for decimal', () => {
    expect(getListType('decimal')).toBe('ol');
  });

  it('should detect ordered list for lowerLetter', () => {
    expect(getListType('lowerLetter')).toBe('ol');
  });

  it('should detect ordered list for upperLetter', () => {
    expect(getListType('upperLetter')).toBe('ol');
  });

  it('should detect ordered list for lowerRoman', () => {
    expect(getListType('lowerRoman')).toBe('ol');
  });

  it('should detect ordered list for upperRoman', () => {
    expect(getListType('upperRoman')).toBe('ol');
  });

  it('should detect unordered list for bullet', () => {
    expect(getListType('bullet')).toBe('ul');
  });

  it('should detect unordered list for none', () => {
    expect(getListType('none')).toBe('ul');
  });
});

// =============================================================================
// List Style Type Tests
// =============================================================================

describe('List Style Type', () => {
  it('should return decimal for decimal', () => {
    expect(getListStyleType('decimal')).toBe('decimal');
  });

  it('should return lower-alpha for lowerLetter', () => {
    expect(getListStyleType('lowerLetter')).toBe('lower-alpha');
  });

  it('should return upper-alpha for upperLetter', () => {
    expect(getListStyleType('upperLetter')).toBe('upper-alpha');
  });

  it('should return lower-roman for lowerRoman', () => {
    expect(getListStyleType('lowerRoman')).toBe('lower-roman');
  });

  it('should return upper-roman for upperRoman', () => {
    expect(getListStyleType('upperRoman')).toBe('upper-roman');
  });

  it('should return disc for bullet', () => {
    expect(getListStyleType('bullet')).toBe('disc');
  });

  it('should return none for none', () => {
    expect(getListStyleType('none')).toBe('none');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('NumberingToHTMLConverter', () => {
  it('should initialize converter', () => {
    const converter = new NumberingToHTMLConverter();
    expect(converter).not.toBeNull();
  });

  it('should format number with given format', () => {
    const converter = new NumberingToHTMLConverter();
    expect(converter.formatNumber(1, 'decimal')).toBe('1');
  });

  it('should apply level text', () => {
    const converter = new NumberingToHTMLConverter();
    expect(converter.applyLevelText('%1.', [1])).toBe('1.');
  });

  it('should get list type', () => {
    const converter = new NumberingToHTMLConverter();
    expect(converter.getListType('decimal')).toBe('ol');
  });

  it('should get list style type', () => {
    const converter = new NumberingToHTMLConverter();
    expect(converter.getListStyleType('decimal')).toBe('decimal');
  });
});
