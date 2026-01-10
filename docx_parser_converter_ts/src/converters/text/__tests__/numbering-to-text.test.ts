/**
 * Unit tests for numbering to text converter.
 *
 * Tests conversion of numbering/list prefixes to plain text.
 */

import { describe, it, expect } from 'vitest';
import {
  NumberingToTextConverter,
  applyLevelText,
  formatNumber,
  getSuffix,
  toCardinalText,
  toLetter,
  toOrdinal,
  toOrdinalText,
  toRoman,
} from '../numbering-to-text';

// =============================================================================
// Roman Numeral Tests
// =============================================================================

describe('TestRomanNumerals', () => {
  it('test_roman_basic_values', () => {
    expect(toRoman(1)).toBe('i');
    expect(toRoman(5)).toBe('v');
    expect(toRoman(10)).toBe('x');
    expect(toRoman(50)).toBe('l');
    expect(toRoman(100)).toBe('c');
    expect(toRoman(500)).toBe('d');
    expect(toRoman(1000)).toBe('m');
  });

  it('test_roman_compound_values', () => {
    expect(toRoman(4)).toBe('iv');
    expect(toRoman(9)).toBe('ix');
    expect(toRoman(14)).toBe('xiv');
    expect(toRoman(19)).toBe('xix');
    expect(toRoman(40)).toBe('xl');
    expect(toRoman(90)).toBe('xc');
    expect(toRoman(400)).toBe('cd');
    expect(toRoman(900)).toBe('cm');
  });

  it('test_roman_complex_values', () => {
    expect(toRoman(1994)).toBe('mcmxciv');
    expect(toRoman(2024)).toBe('mmxxiv');
    expect(toRoman(3999)).toBe('mmmcmxcix');
  });

  it('test_roman_uppercase', () => {
    expect(toRoman(1, false)).toBe('I');
    expect(toRoman(10, false)).toBe('X');
    expect(toRoman(100, false)).toBe('C');
  });

  it('test_roman_zero_or_negative', () => {
    expect(toRoman(0)).toBe('0');
    expect(toRoman(-1)).toBe('-1');
  });
});

// =============================================================================
// Letter Format Tests
// =============================================================================

describe('TestLetterFormat', () => {
  it('test_letter_basic', () => {
    expect(toLetter(1)).toBe('a');
    expect(toLetter(2)).toBe('b');
    expect(toLetter(26)).toBe('z');
  });

  it('test_letter_beyond_z', () => {
    expect(toLetter(27)).toBe('aa');
    expect(toLetter(28)).toBe('ab');
    expect(toLetter(52)).toBe('az');
    expect(toLetter(53)).toBe('ba');
  });

  it('test_letter_uppercase', () => {
    expect(toLetter(1, false)).toBe('A');
    expect(toLetter(26, false)).toBe('Z');
    expect(toLetter(27, false)).toBe('AA');
  });

  it('test_letter_zero_or_negative', () => {
    expect(toLetter(0)).toBe('');
    expect(toLetter(-1)).toBe('');
  });
});

// =============================================================================
// Ordinal Format Tests
// =============================================================================

describe('TestOrdinalFormat', () => {
  it('test_ordinal_basic', () => {
    expect(toOrdinal(1)).toBe('1st');
    expect(toOrdinal(2)).toBe('2nd');
    expect(toOrdinal(3)).toBe('3rd');
    expect(toOrdinal(4)).toBe('4th');
  });

  it('test_ordinal_teens', () => {
    expect(toOrdinal(11)).toBe('11th');
    expect(toOrdinal(12)).toBe('12th');
    expect(toOrdinal(13)).toBe('13th');
  });

  it('test_ordinal_larger_values', () => {
    expect(toOrdinal(21)).toBe('21st');
    expect(toOrdinal(22)).toBe('22nd');
    expect(toOrdinal(23)).toBe('23rd');
    expect(toOrdinal(100)).toBe('100th');
    expect(toOrdinal(101)).toBe('101st');
    expect(toOrdinal(111)).toBe('111th');
  });

  it('test_ordinal_zero_or_negative', () => {
    expect(toOrdinal(0)).toBe('0');
    expect(toOrdinal(-1)).toBe('-1');
  });
});

// =============================================================================
// Ordinal Text Tests
// =============================================================================

describe('TestOrdinalText', () => {
  it('test_ordinal_text_basic', () => {
    expect(toOrdinalText(1)).toBe('First');
    expect(toOrdinalText(2)).toBe('Second');
    expect(toOrdinalText(3)).toBe('Third');
    expect(toOrdinalText(4)).toBe('Fourth');
    expect(toOrdinalText(5)).toBe('Fifth');
  });

  it('test_ordinal_text_teens', () => {
    expect(toOrdinalText(11)).toBe('Eleventh');
    expect(toOrdinalText(12)).toBe('Twelfth');
    expect(toOrdinalText(13)).toBe('Thirteenth');
    expect(toOrdinalText(20)).toBe('Twentieth');
  });

  it('test_ordinal_text_beyond_range', () => {
    expect(toOrdinalText(21)).toBe('21st');
    expect(toOrdinalText(100)).toBe('100th');
  });
});

// =============================================================================
// Cardinal Text Tests
// =============================================================================

describe('TestCardinalText', () => {
  it('test_cardinal_text_basic', () => {
    expect(toCardinalText(1)).toBe('One');
    expect(toCardinalText(2)).toBe('Two');
    expect(toCardinalText(3)).toBe('Three');
    expect(toCardinalText(10)).toBe('Ten');
  });

  it('test_cardinal_text_teens', () => {
    expect(toCardinalText(11)).toBe('Eleven');
    expect(toCardinalText(12)).toBe('Twelve');
    expect(toCardinalText(20)).toBe('Twenty');
  });

  it('test_cardinal_text_beyond_range', () => {
    expect(toCardinalText(21)).toBe('21');
    expect(toCardinalText(100)).toBe('100');
  });
});

// =============================================================================
// Format Number Tests
// =============================================================================

describe('TestFormatNumber', () => {
  it('test_format_decimal', () => {
    expect(formatNumber(1, 'decimal')).toBe('1');
    expect(formatNumber(10, 'decimal')).toBe('10');
    expect(formatNumber(100, 'decimal')).toBe('100');
  });

  it('test_format_lower_letter', () => {
    expect(formatNumber(1, 'lowerLetter')).toBe('a');
    expect(formatNumber(26, 'lowerLetter')).toBe('z');
  });

  it('test_format_upper_letter', () => {
    expect(formatNumber(1, 'upperLetter')).toBe('A');
    expect(formatNumber(26, 'upperLetter')).toBe('Z');
  });

  it('test_format_lower_roman', () => {
    expect(formatNumber(1, 'lowerRoman')).toBe('i');
    expect(formatNumber(10, 'lowerRoman')).toBe('x');
  });

  it('test_format_upper_roman', () => {
    expect(formatNumber(1, 'upperRoman')).toBe('I');
    expect(formatNumber(10, 'upperRoman')).toBe('X');
  });

  it('test_format_bullet', () => {
    expect(formatNumber(1, 'bullet')).toBe('\u2022');
    expect(formatNumber(5, 'bullet')).toBe('\u2022');
  });

  it('test_format_ordinal', () => {
    expect(formatNumber(1, 'ordinal')).toBe('1st');
    expect(formatNumber(2, 'ordinal')).toBe('2nd');
  });

  it('test_format_ordinal_text', () => {
    expect(formatNumber(1, 'ordinalText')).toBe('First');
    expect(formatNumber(2, 'ordinalText')).toBe('Second');
  });

  it('test_format_cardinal_text', () => {
    expect(formatNumber(1, 'cardinalText')).toBe('One');
    expect(formatNumber(2, 'cardinalText')).toBe('Two');
  });

  it('test_format_decimal_zero', () => {
    expect(formatNumber(1, 'decimalZero')).toBe('01');
    expect(formatNumber(10, 'decimalZero')).toBe('10');
  });

  it('test_format_none', () => {
    expect(formatNumber(1, 'none')).toBe('');
    expect(formatNumber(10, 'none')).toBe('');
  });

  it('test_format_unknown', () => {
    expect(formatNumber(5, 'unknownFormat')).toBe('5');
  });
});

// =============================================================================
// Level Text Template Tests
// =============================================================================

describe('TestApplyLevelText', () => {
  it('test_simple_placeholder', () => {
    const result = applyLevelText('%1.', { 0: 1 });
    expect(result).toBe('1.');
  });

  it('test_multiple_placeholders', () => {
    const result = applyLevelText('%1.%2', { 0: 1, 1: 2 });
    expect(result).toBe('1.2');
  });

  it('test_with_number_formats', () => {
    const result = applyLevelText(
      '%1.%2',
      { 0: 1, 1: 2 },
      { 0: 'upperRoman', 1: 'lowerLetter' }
    );
    expect(result).toBe('I.b');
  });

  it('test_multilevel_numbering', () => {
    const result = applyLevelText(
      '%1.%2.%3',
      { 0: 1, 1: 2, 2: 3 },
      { 0: 'decimal', 1: 'decimal', 2: 'decimal' }
    );
    expect(result).toBe('1.2.3');
  });

  it('test_parenthesis_format', () => {
    const result = applyLevelText('(%1)', { 0: 1 });
    expect(result).toBe('(1)');
  });

  it('test_missing_counter', () => {
    const result = applyLevelText('%1.%2', { 0: 5 });
    expect(result).toBe('5.1');
  });

  it('test_no_placeholders', () => {
    const result = applyLevelText('\u2022', { 0: 1 });
    expect(result).toBe('\u2022');
  });
});

// =============================================================================
// Suffix Tests
// =============================================================================

describe('TestGetSuffix', () => {
  it('test_suffix_tab', () => {
    expect(getSuffix('tab')).toBe('\t');
  });

  it('test_suffix_space', () => {
    expect(getSuffix('space')).toBe(' ');
  });

  it('test_suffix_nothing', () => {
    expect(getSuffix('nothing')).toBe('');
  });

  it('test_suffix_none', () => {
    expect(getSuffix(null)).toBe('\t');
  });

  it('test_suffix_unknown', () => {
    expect(getSuffix('unknown')).toBe('\t');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('TestNumberingToTextConverterClass', () => {
  it('test_converter_initialization', () => {
    const converter = new NumberingToTextConverter();
    expect(converter).not.toBeNull();
  });

  it('test_format_prefix_decimal', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatPrefix(1, 'decimal', '%1.');
    expect(result).toBe('1.\t');
  });

  it('test_format_prefix_bullet', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatPrefix(1, 'bullet', '\u2022');
    expect(result).toBe('\u2022');
  });

  it('test_format_prefix_with_suffix', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatPrefix(1, 'decimal', '%1.', 'space');
    expect(result).toBe('1. ');
  });

  it('test_format_prefix_nothing_suffix', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatPrefix(1, 'decimal', '%1.', 'nothing');
    expect(result).toBe('1.');
  });

  it('test_format_multi_level_prefix', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatMultiLevelPrefix(
      { 0: 1, 1: 2 },
      { 0: 'decimal', 1: 'lowerLetter' },
      '%1.%2)'
    );
    expect(result).toBe('1.b)\t');
  });

  it('test_format_multi_level_with_suffix', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatMultiLevelPrefix(
      { 0: 1, 1: 1, 2: 1 },
      { 0: 'decimal', 1: 'decimal', 2: 'decimal' },
      '%1.%2.%3',
      'space'
    );
    expect(result).toBe('1.1.1 ');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('TestNumberingEdgeCases', () => {
  it('test_large_numbers', () => {
    expect(formatNumber(1000, 'decimal')).toBe('1000');
    expect(formatNumber(1000, 'lowerRoman')).toBe('m');
    expect(toLetter(27)).toContain('aa');
  });

  it('test_empty_level_text', () => {
    const result = applyLevelText('', { 0: 1 });
    expect(result).toBe('');
  });

  it('test_consecutive_placeholders', () => {
    const result = applyLevelText('%1%2%3', { 0: 1, 1: 2, 2: 3 });
    expect(result).toBe('123');
  });

  it('test_repeated_placeholders', () => {
    const result = applyLevelText('%1-%1', { 0: 5 });
    expect(result).toBe('5-5');
  });

  it('test_high_level_placeholders', () => {
    const counters: Record<number, number> = {};
    for (let i = 0; i < 9; i++) {
      counters[i] = i + 1;
    }
    const result = applyLevelText('%1.%9', counters);
    expect(result).toContain('1.');
    expect(result).toContain('.9');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('TestNumberingIntegration', () => {
  it('test_typical_numbered_list', () => {
    const converter = new NumberingToTextConverter();
    const prefixes = [];
    for (let i = 1; i <= 5; i++) {
      prefixes.push(converter.formatPrefix(i, 'decimal', '%1.'));
    }
    expect(prefixes[0]).toBe('1.\t');
    expect(prefixes[4]).toBe('5.\t');
  });

  it('test_typical_bulleted_list', () => {
    const converter = new NumberingToTextConverter();
    const prefix = converter.formatPrefix(1, 'bullet', '\u2022');
    // Bullet should not have tab suffix (it's the entire marker)
    expect(prefix).toBe('\u2022');
  });

  it('test_typical_outline_numbering', () => {
    const converter = new NumberingToTextConverter();

    // Level 0: I, II, III
    const level0 = converter.formatPrefix(1, 'upperRoman', '%1.');
    expect(level0).toBe('I.\t');

    // Level 1: A, B, C
    const level1 = converter.formatPrefix(1, 'upperLetter', '%1.');
    expect(level1).toBe('A.\t');

    // Level 2: 1, 2, 3
    const level2 = converter.formatPrefix(1, 'decimal', '%1.');
    expect(level2).toBe('1.\t');
  });

  it('test_legal_numbering', () => {
    const converter = new NumberingToTextConverter();
    const result = converter.formatMultiLevelPrefix(
      { 0: 1, 1: 2, 2: 3 },
      { 0: 'decimal', 1: 'decimal', 2: 'decimal' },
      '%1.%2.%3',
      'tab'
    );
    expect(result).toBe('1.2.3\t');
  });
});
