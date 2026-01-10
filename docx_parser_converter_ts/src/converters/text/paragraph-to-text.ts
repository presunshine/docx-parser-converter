/**
 * Paragraph to text converter.
 *
 * Converts Paragraph elements to plain text or markdown.
 */

import type { Paragraph } from '../../models/document/paragraph';
import type { Run } from '../../models/document/run';
import type { Hyperlink } from '../../models/document/hyperlink';
import { RunToTextConverter } from './run-to-text';

// =============================================================================
// Constants
// =============================================================================

// Twips per space character (approximate, assuming 720 twips = 1/2 inch)
const TWIPS_PER_SPACE = 144;

// =============================================================================
// Paragraph to Text Function
// =============================================================================

/**
 * Convert a Paragraph to plain text.
 *
 * @param para - Paragraph element or null
 * @returns Plain text content
 */
export function paragraphToText(para: Paragraph | null | undefined): string {
  if (!para) {
    return '';
  }

  const converter = new ParagraphToTextConverter();
  return converter.convert(para);
}

// =============================================================================
// Paragraph to Text Converter Class
// =============================================================================

export interface ParagraphToTextConverterOptions {
  /** Whether to use markdown formatting */
  useMarkdown?: boolean;
  /** Dict mapping rId to URL for hyperlink rendering */
  hyperlinkUrls?: Record<string, string>;
  /** Dict mapping "numId:ilvl" to [prefix, suffix] */
  numberingPrefixes?: Record<string, [string, string]>;
  /** Whether to render indentation as spaces */
  renderIndentation?: boolean;
  /** Number of spaces to prepend for list indentation */
  listIndentSpaces?: number;
}

/**
 * Converter for Paragraph elements to plain text or markdown.
 */
export class ParagraphToTextConverter {
  useMarkdown: boolean;
  hyperlinkUrls: Record<string, string>;
  numberingPrefixes: Record<string, [string, string]>;
  renderIndentation: boolean;
  listIndentSpaces: number;
  private _runConverter: RunToTextConverter;

  constructor(options?: ParagraphToTextConverterOptions) {
    this.useMarkdown = options?.useMarkdown ?? false;
    this.hyperlinkUrls = options?.hyperlinkUrls ?? {};
    this.numberingPrefixes = options?.numberingPrefixes ?? {};
    this.renderIndentation = options?.renderIndentation ?? false;
    this.listIndentSpaces = options?.listIndentSpaces ?? 0;
    this._runConverter = new RunToTextConverter({ useMarkdown: this.useMarkdown });
  }

  /**
   * Convert a Paragraph to text.
   *
   * @param para - Paragraph element or null
   * @returns Text content
   */
  convert(para: Paragraph | null | undefined): string {
    if (!para) {
      return '';
    }

    const parts: string[] = [];

    // Add list indentation (spaces at the start for nested lists)
    if (this.listIndentSpaces > 0) {
      parts.push(' '.repeat(this.listIndentSpaces));
    }

    // Add numbering prefix if present
    const prefix = this._getNumberingPrefix(para);
    if (prefix) {
      parts.push(prefix);
    }

    // Add indentation if enabled (for non-list paragraph indentation)
    if (this.renderIndentation) {
      const indent = this._getIndentationSpaces(para);
      if (indent) {
        parts.push(indent);
      }
    }

    // Convert paragraph content
    if (para.content) {
      for (const content of para.content) {
        const text = this._convertContent(content);
        if (text) {
          parts.push(text);
        }
      }
    }

    return parts.join('');
  }

  /**
   * Convert paragraph content element.
   */
  private _convertContent(content: unknown): string {
    if (!content || typeof content !== 'object') {
      return '';
    }

    // Check if it's a Run
    if ('rPr' in content || ('content' in content && !('rId' in content))) {
      return this._runConverter.convert(content as Run);
    }

    // Check if it's a Hyperlink
    if ('rId' in content || ('content' in content && 'anchor' in content)) {
      return this._convertHyperlink(content as Hyperlink);
    }

    return '';
  }

  /**
   * Convert a Hyperlink to text.
   */
  private _convertHyperlink(hyperlink: Hyperlink): string {
    // Extract text from hyperlink runs
    const textParts: string[] = [];

    if (hyperlink.content) {
      for (const content of hyperlink.content) {
        if (content && typeof content === 'object' && ('rPr' in content || 'content' in content)) {
          const text = this._runConverter.convert(content as Run);
          if (text) {
            textParts.push(text);
          }
        }
      }
    }

    const linkText = textParts.join('');

    // In markdown mode, render as [text](url) if URL is available
    if (this.useMarkdown && hyperlink.rId) {
      const url = this.hyperlinkUrls[hyperlink.rId];
      if (url) {
        return `[${linkText}](${url})`;
      }
    }

    return linkText;
  }

  /**
   * Get numbering prefix for paragraph.
   */
  private _getNumberingPrefix(para: Paragraph): string {
    if (!para.pPr?.numPr) {
      return '';
    }

    const numPr = para.pPr.numPr;
    if (numPr.numId === undefined || numPr.ilvl === undefined) {
      return '';
    }

    const key = `${numPr.numId}:${numPr.ilvl}`;
    if (key in this.numberingPrefixes) {
      const [prefix, suffix] = this.numberingPrefixes[key];
      return prefix + suffix;
    }

    return '';
  }

  /**
   * Get indentation as spaces.
   */
  private _getIndentationSpaces(para: Paragraph): string {
    if (!para.pPr?.ind) {
      return '';
    }

    const ind = para.pPr.ind;

    // Calculate spaces from first line indentation
    if (ind.firstLine !== undefined && ind.firstLine !== null) {
      const twips = typeof ind.firstLine === 'number' ? ind.firstLine : parseInt(String(ind.firstLine), 10);
      if (!isNaN(twips)) {
        const spaces = Math.max(1, Math.floor(twips / TWIPS_PER_SPACE));
        return ' '.repeat(spaces);
      }
    }

    return '';
  }
}
