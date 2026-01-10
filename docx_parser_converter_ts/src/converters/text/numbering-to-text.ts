/**
 * Numbering to text converter.
 *
 * Provides number formatting utilities and numbering prefix generation for plain text.
 */

// =============================================================================
// Number Format Constants
// =============================================================================

const ROMAN_VALUES: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

const ORDINAL_SUFFIXES: Record<number, string> = {
  1: 'st',
  2: 'nd',
  3: 'rd',
};

const ORDINAL_TEXT = [
  '',
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelfth',
  'Thirteenth',
  'Fourteenth',
  'Fifteenth',
  'Sixteenth',
  'Seventeenth',
  'Eighteenth',
  'Nineteenth',
  'Twentieth',
];

const CARDINAL_TEXT = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
  'Twenty',
];

// =============================================================================
// Number Format Functions
// =============================================================================

/**
 * Convert a number to Roman numeral format.
 *
 * @param value - Numeric value
 * @param lowercase - Whether to use lowercase (default true)
 * @returns Roman numeral string
 */
export function toRoman(value: number, lowercase = true): string {
  if (value <= 0) {
    return String(value);
  }

  let result = '';
  let remaining = value;
  for (const [val, numeral] of ROMAN_VALUES) {
    while (remaining >= val) {
      result += numeral;
      remaining -= val;
    }
  }

  return lowercase ? result.toLowerCase() : result;
}

/**
 * Convert a number to letter format (a, b, ..., z, aa, ab, ...).
 *
 * @param value - Numeric value (1-based)
 * @param lowercase - Whether to use lowercase letters (default true)
 * @returns Letter string
 */
export function toLetter(value: number, lowercase = true): string {
  if (value <= 0) {
    return '';
  }

  let result = '';
  let remaining = value;
  const baseChar = lowercase ? 'a' : 'A';

  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(baseChar.charCodeAt(0) + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }

  return result;
}

/**
 * Convert a number to ordinal format (1st, 2nd, 3rd...).
 *
 * @param value - Numeric value
 * @returns Ordinal string
 */
export function toOrdinal(value: number): string {
  if (value <= 0) {
    return String(value);
  }

  // Special case for 11, 12, 13
  if (value % 100 >= 11 && value % 100 <= 13) {
    return `${value}th`;
  }

  const suffix = ORDINAL_SUFFIXES[value % 10] || 'th';
  return `${value}${suffix}`;
}

/**
 * Convert a number to ordinal text (First, Second, Third...).
 *
 * @param value - Numeric value
 * @returns Ordinal text string
 */
export function toOrdinalText(value: number): string {
  if (value >= 1 && value < ORDINAL_TEXT.length) {
    return ORDINAL_TEXT[value];
  }
  return toOrdinal(value);
}

/**
 * Convert a number to cardinal text (One, Two, Three...).
 *
 * @param value - Numeric value
 * @returns Cardinal text string
 */
export function toCardinalText(value: number): string {
  if (value >= 1 && value < CARDINAL_TEXT.length) {
    return CARDINAL_TEXT[value];
  }
  return String(value);
}

/**
 * Convert a number to zero-padded decimal (01, 02...).
 *
 * @param value - Numeric value
 * @param width - Minimum width (default 2)
 * @returns Zero-padded decimal string
 */
export function toDecimalZero(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/**
 * Format a number according to the specified format.
 *
 * @param value - Numeric value
 * @param numFmt - Format type
 * @returns Formatted string
 */
export function formatNumber(value: number, numFmt: string): string {
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
    case 'bullet':
      return '\u2022'; // bullet character
    case 'ordinal':
      return toOrdinal(value);
    case 'ordinalText':
      return toOrdinalText(value);
    case 'cardinalText':
      return toCardinalText(value);
    case 'decimalZero':
      return toDecimalZero(value);
    case 'none':
      return '';
    default:
      // Default to decimal for unknown formats
      return String(value);
  }
}

// =============================================================================
// Level Text Template Functions
// =============================================================================

/**
 * Apply counter values to a level text template.
 *
 * Replaces placeholders like %1, %2 with formatted counter values.
 *
 * @param lvlText - Level text template (e.g., "%1.%2")
 * @param counters - Dict mapping level index to counter value
 * @param numFmts - Dict mapping level index to number format
 * @returns Formatted string with placeholders replaced
 */
export function applyLevelText(
  lvlText: string,
  counters: Record<number, number>,
  numFmts?: Record<number, string>
): string {
  let result = lvlText;
  const formats = numFmts || {};

  for (let levelIdx = 0; levelIdx < 10; levelIdx++) {
    const placeholder = `%${levelIdx + 1}`;
    if (result.includes(placeholder)) {
      const counterValue = counters[levelIdx] ?? 1;
      const numFmt = formats[levelIdx] || 'decimal';
      const formatted = formatNumber(counterValue, numFmt);
      result = result.split(placeholder).join(formatted);
    }
  }

  return result;
}

// =============================================================================
// Suffix Handling
// =============================================================================

/**
 * Get the suffix string for a list number.
 *
 * @param suff - Suffix type ('tab', 'space', 'nothing')
 * @returns Suffix string
 */
export function getSuffix(suff: string | null | undefined): string {
  if (suff === 'tab') {
    return '\t';
  } else if (suff === 'space') {
    return ' ';
  } else if (suff === 'nothing') {
    return '';
  } else {
    // Default to tab
    return '\t';
  }
}

// =============================================================================
// Numbering to Text Converter Class
// =============================================================================

/**
 * Converter for numbering/list prefixes to plain text.
 */
export class NumberingToTextConverter {
  /**
   * Initialize numbering converter.
   */
  constructor() {
    // No initialization needed
  }

  /**
   * Format a numbering prefix.
   *
   * @param value - Counter value
   * @param numFmt - Number format
   * @param lvlText - Level text template
   * @param suff - Suffix type
   * @returns Formatted prefix string
   */
  formatPrefix(
    value: number,
    numFmt: string,
    lvlText = '%1.',
    suff: string | null | undefined = 'tab'
  ): string {
    if (numFmt === 'bullet') {
      // For bullets, just return the bullet character (no suffix)
      return lvlText || '\u2022';
    }

    // Format the number
    const formatted = formatNumber(value, numFmt);

    // Apply level text template if it contains placeholder
    let prefix: string;
    if (lvlText.includes('%1')) {
      prefix = lvlText.split('%1').join(formatted);
    } else {
      // Just use the formatted number with lvlText as suffix
      prefix = formatted + lvlText;
    }

    // Add suffix
    const suffix = getSuffix(suff);
    return prefix + suffix;
  }

  /**
   * Format a multi-level numbering prefix.
   *
   * @param counters - Dict mapping level index to counter value
   * @param numFmts - Dict mapping level index to number format
   * @param lvlText - Level text template (e.g., "%1.%2")
   * @param suff - Suffix type
   * @returns Formatted prefix string
   */
  formatMultiLevelPrefix(
    counters: Record<number, number>,
    numFmts: Record<number, string>,
    lvlText: string,
    suff: string | null | undefined = 'tab'
  ): string {
    const prefix = applyLevelText(lvlText, counters, numFmts);
    const suffix = getSuffix(suff);
    return prefix + suffix;
  }
}
