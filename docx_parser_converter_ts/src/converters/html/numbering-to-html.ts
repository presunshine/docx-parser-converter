/**
 * Numbering to HTML converter.
 *
 * Converts DOCX numbering formats to HTML lists and CSS counters.
 * Matches Python: converters/html/numbering_to_html.py
 */

import type { NumFmtType } from '../../models/types';

/**
 * Convert a number to lowercase or uppercase Roman numerals.
 */
export function toRoman(value: number, lowercase: boolean = true): string {
  if (value <= 0) {
    return String(value);
  }

  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

  let result = '';
  let remaining = value;

  for (let i = 0; i < values.length; i++) {
    while (remaining >= values[i]) {
      result += numerals[i];
      remaining -= values[i];
    }
  }

  return lowercase ? result.toLowerCase() : result;
}

/**
 * Convert a number to lowercase or uppercase letters (a, b, ..., z, aa, ab, ...).
 */
export function toLetter(value: number, lowercase: boolean = true): string {
  if (value <= 0) {
    return String(value);
  }

  let result = '';
  let remaining = value;

  while (remaining > 0) {
    remaining--;
    result = String.fromCharCode((remaining % 26) + (lowercase ? 97 : 65)) + result;
    remaining = Math.floor(remaining / 26);
  }

  return result;
}

/**
 * Convert a number to ordinal format (1st, 2nd, 3rd, etc.).
 */
export function toOrdinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const lastTwo = Math.abs(value) % 100;
  const lastOne = Math.abs(value) % 10;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${value}th`;
  }

  return `${value}${suffixes[lastOne] || 'th'}`;
}

/**
 * Convert a number to ordinal text (first, second, third, etc.).
 */
export function toOrdinalText(value: number): string {
  const ordinals: { [key: number]: string } = {
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
    10: 'tenth',
    11: 'eleventh',
    12: 'twelfth',
    13: 'thirteenth',
    14: 'fourteenth',
    15: 'fifteenth',
    16: 'sixteenth',
    17: 'seventeenth',
    18: 'eighteenth',
    19: 'nineteenth',
    20: 'twentieth',
  };

  if (ordinals[value]) {
    return ordinals[value];
  }

  return toOrdinal(value);
}

/**
 * Convert a number to Chicago-style footnote symbols (*, †, ‡, §).
 */
export function toChicago(value: number): string {
  const symbols = ['*', '†', '‡', '§'];
  const idx = (value - 1) % 4;
  const repeat = Math.floor((value - 1) / 4) + 1;
  return symbols[idx].repeat(repeat);
}

/**
 * Convert a number to decimal with leading zero (01, 02, etc.).
 */
export function toDecimalZero(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Convert a number to enclosed circle numbers (①, ②, etc.).
 */
export function toDecimalEnclosedCircle(value: number): string {
  if (value >= 1 && value <= 20) {
    // Unicode circled digits start at U+2460
    return String.fromCodePoint(0x2460 + value - 1);
  }
  return String(value);
}

/**
 * Format a number according to the specified number format.
 */
export function formatNumber(value: number, numFmt: NumFmtType | string | null): string {
  if (!numFmt) {
    return String(value);
  }

  switch (numFmt) {
    case 'decimal':
      return String(value);
    case 'lowerLetter':
      return toLetter(value, true);
    case 'upperLetter':
      return toLetter(value, false);
    case 'lowerRoman':
      return toRoman(value, true);
    case 'upperRoman':
      return toRoman(value, false);
    case 'ordinal':
      return toOrdinal(value);
    case 'ordinalText':
      return toOrdinalText(value);
    case 'bullet':
    case 'none':
      return '';
    case 'decimalZero':
      return toDecimalZero(value);
    case 'decimalEnclosedCircle':
      return toDecimalEnclosedCircle(value);
    case 'chicago':
      return toChicago(value);
    default:
      return String(value);
  }
}

/**
 * Apply level text template with formatted numbers.
 *
 * @param levelText - Template string with %1, %2, etc. placeholders
 * @param values - Array of counter values for each level
 * @param numFmts - Optional array of number formats for each level
 */
export function applyLevelText(
  levelText: string,
  values: number[],
  numFmts?: (NumFmtType | string | null)[]
): string {
  let result = levelText;

  for (let i = 0; i < 9; i++) {
    const placeholder = `%${i + 1}`;
    if (result.includes(placeholder)) {
      const value = values[i] ?? 1;
      const numFmt = numFmts?.[i] ?? 'decimal';
      const formatted = formatNumber(value, numFmt);
      result = result.replace(placeholder, formatted);
    }
  }

  return result;
}

/**
 * Get the suffix string for a level.
 */
export function getSuffix(suff: string | null | undefined): string {
  if (suff === 'space') {
    return ' ';
  }
  if (suff === 'nothing') {
    return '';
  }
  // Default to tab
  return '\t';
}

/**
 * Generate CSS counter style name for a number format.
 */
export function generateCssCounterStyle(numFmt: NumFmtType | string | null): string {
  switch (numFmt) {
    case 'decimal':
      return 'decimal';
    case 'lowerLetter':
      return 'lower-alpha';
    case 'upperLetter':
      return 'upper-alpha';
    case 'lowerRoman':
      return 'lower-roman';
    case 'upperRoman':
      return 'upper-roman';
    case 'bullet':
      return 'disc';
    case 'none':
      return 'none';
    default:
      return 'decimal';
  }
}

/**
 * Generate CSS counter-reset declaration.
 */
export function generateCounterResetCss(counterName: string, startValue: number): string {
  return `counter-reset: ${counterName} ${startValue - 1};`;
}

/**
 * Generate CSS content declaration with counter.
 */
export function generateCounterContentCss(
  counterName: string,
  numFmt: NumFmtType | string | null,
  levelText: string
): string {
  const style = generateCssCounterStyle(numFmt);

  // Simple case: just %1
  if (levelText === '%1' || levelText === '%1.') {
    const suffix = levelText.endsWith('.') ? '.' : '';
    return `content: counter(${counterName}, ${style}) "${suffix}";`;
  }

  // More complex level text - use a string approximation
  // This is simplified; real implementation would parse the template
  return `content: counter(${counterName}, ${style}) " ";`;
}

/**
 * Get HTML list type (ol or ul) for a number format.
 */
export function getListType(numFmt: NumFmtType | string | null): 'ol' | 'ul' {
  switch (numFmt) {
    case 'bullet':
    case 'none':
      return 'ul';
    default:
      return 'ol';
  }
}

/**
 * Get CSS list-style-type for a number format.
 */
export function getListStyleType(numFmt: NumFmtType | string | null): string {
  switch (numFmt) {
    case 'decimal':
      return 'decimal';
    case 'lowerLetter':
      return 'lower-alpha';
    case 'upperLetter':
      return 'upper-alpha';
    case 'lowerRoman':
      return 'lower-roman';
    case 'upperRoman':
      return 'upper-roman';
    case 'bullet':
      return 'disc';
    case 'none':
      return 'none';
    default:
      return 'decimal';
  }
}

/**
 * Converter class for numbering to HTML conversion.
 */
export class NumberingToHTMLConverter {
  /**
   * Format a number with the specified format.
   */
  formatNumber(value: number, numFmt: NumFmtType | string | null): string {
    return formatNumber(value, numFmt);
  }

  /**
   * Apply level text template.
   */
  applyLevelText(
    levelText: string,
    values: number[],
    numFmts?: (NumFmtType | string | null)[]
  ): string {
    return applyLevelText(levelText, values, numFmts);
  }

  /**
   * Get HTML list type.
   */
  getListType(numFmt: NumFmtType | string | null): 'ol' | 'ul' {
    return getListType(numFmt);
  }

  /**
   * Get CSS list style type.
   */
  getListStyleType(numFmt: NumFmtType | string | null): string {
    return getListStyleType(numFmt);
  }

  /**
   * Generate CSS counter style.
   */
  generateCssCounterStyle(numFmt: NumFmtType | string | null): string {
    return generateCssCounterStyle(numFmt);
  }
}
