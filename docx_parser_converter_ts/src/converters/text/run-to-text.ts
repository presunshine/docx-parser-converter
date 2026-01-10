/**
 * Run to text converter.
 *
 * Converts Run elements to plain text or markdown.
 */

import type { Run, RunProperties } from '../../models/document/run';
import type {
  RunContentItem,
  Text,
  Break,
  TabChar,
} from '../../models/document/run-content';

// =============================================================================
// Monospace Font Detection
// =============================================================================

const MONOSPACE_FONTS = new Set([
  'courier',
  'courier new',
  'consolas',
  'monaco',
  'menlo',
  'lucida console',
  'dejavu sans mono',
  'liberation mono',
  'source code pro',
  'fira code',
  'fira mono',
  'roboto mono',
  'ubuntu mono',
  'andale mono',
]);

/**
 * Check if a font is a monospace font.
 *
 * @param fontName - Font name to check
 * @returns True if monospace font
 */
export function isMonospaceFont(fontName: string | null | undefined): boolean {
  if (!fontName) {
    return false;
  }
  return MONOSPACE_FONTS.has(fontName.toLowerCase());
}

// =============================================================================
// Run Content Converters
// =============================================================================

/**
 * Convert Text element to string.
 *
 * @param text - Text element
 * @returns Text content
 */
export function textToText(text: Text): string {
  return text.value || '';
}

/**
 * Convert Break element to string.
 *
 * @param br - Break element
 * @returns Newline or page separator
 */
export function breakToText(br: Break): string {
  const breakType = br.breakType || 'textWrapping';

  if (breakType === 'page') {
    // Page break - double newline for separation
    return '\n\n';
  } else if (breakType === 'column') {
    return '\n';
  } else {
    // Line break (textWrapping or default)
    return '\n';
  }
}

/**
 * Convert TabChar element to string.
 *
 * @param _tab - TabChar element
 * @returns Tab character
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tabToText(_tab: TabChar): string {
  return '\t';
}

/**
 * Convert any run content element to text.
 *
 * @param content - Run content element
 * @returns Text representation
 */
export function runContentToText(content: RunContentItem): string {
  switch (content.type) {
    case 'text':
      return textToText(content as Text);
    case 'break':
      return breakToText(content as Break);
    case 'tab':
      return tabToText(content as TabChar);
    case 'cr':
      return '\n';
    case 'softHyphen':
      // Soft hyphen is typically invisible
      return '';
    case 'noBreakHyphen':
      // Non-breaking hyphen renders as hyphen
      return '-';
    default:
      // Unknown content type - return empty
      return '';
  }
}

// =============================================================================
// Run to Text Converter
// =============================================================================

/**
 * Convert a Run to plain text.
 *
 * @param run - Run element or null/undefined
 * @returns Plain text content
 */
export function runToText(run: Run | null | undefined): string {
  if (!run) {
    return '';
  }

  const parts: string[] = [];
  for (const content of run.content) {
    parts.push(runContentToText(content));
  }

  return parts.join('');
}

// =============================================================================
// Markdown Formatting
// =============================================================================

/**
 * Apply markdown formatting to text based on run properties.
 *
 * @param text - Plain text content
 * @param rPr - Run properties
 * @returns Text with markdown markers
 */
export function applyMarkdownFormatting(text: string, rPr: RunProperties | null | undefined): string {
  if (!rPr || !text) {
    return text;
  }

  let result = text;

  // Check for bold
  const isBold = rPr.b === true;

  // Check for italic
  const isItalic = rPr.i === true;

  // Check for strikethrough
  const isStrike = rPr.strike === true;

  // Check for monospace font (code)
  let isCode = false;
  if (rPr.rFonts) {
    if (isMonospaceFont(rPr.rFonts.ascii)) {
      isCode = true;
    } else if (isMonospaceFont(rPr.rFonts.hAnsi)) {
      isCode = true;
    }
  }

  // Apply formatting in order
  if (isStrike) {
    result = `~~${result}~~`;
  }

  if (isBold && isItalic) {
    result = `***${result}***`;
  } else if (isBold) {
    result = `**${result}**`;
  } else if (isItalic) {
    result = `*${result}*`;
  }

  if (isCode && !isBold && !isItalic && !isStrike) {
    result = `\`${result}\``;
  }

  return result;
}

// =============================================================================
// Run to Text Converter Class
// =============================================================================

/**
 * Converter for Run elements to plain text or markdown.
 */
export class RunToTextConverter {
  /** Whether to use markdown formatting */
  useMarkdown: boolean;

  /**
   * Initialize run converter.
   *
   * @param options - Converter options
   */
  constructor(options: { useMarkdown?: boolean } = {}) {
    this.useMarkdown = options.useMarkdown ?? false;
  }

  /**
   * Convert a Run to text.
   *
   * @param run - Run element or null/undefined
   * @returns Text content (with optional markdown formatting)
   */
  convert(run: Run | null | undefined): string {
    if (!run) {
      return '';
    }

    // Extract text content
    let text = runToText(run);

    // Apply markdown formatting if enabled
    if (this.useMarkdown && text) {
      text = applyMarkdownFormatting(text, run.rPr);
    }

    return text;
  }

  /**
   * Convert a single run content element.
   *
   * @param content - Run content element
   * @returns Text representation
   */
  convertContent(content: RunContentItem): string {
    return runContentToText(content);
  }
}
