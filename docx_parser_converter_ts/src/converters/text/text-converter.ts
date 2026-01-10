/**
 * Main text converter.
 *
 * Provides the main entry point for converting DOCX documents to plain text.
 */

import type { Document } from '../../models/document/document';
import type { Paragraph } from '../../models/document/paragraph';
import type { Table } from '../../models/document/table';
import type { Numbering } from '../../models/numbering/numbering';
import type { AbstractNumbering } from '../../models/numbering/abstract-numbering';
import type { Styles } from '../../models/styles/styles';
import { NumberingTracker } from '../common/numbering-tracker';
import { ParagraphToTextConverter } from './paragraph-to-text';
import { TableToTextConverter, type TableMode } from './table-to-text';
import { applyLevelText } from './numbering-to-text';

// =============================================================================
// Configuration
// =============================================================================

export interface TextConverterConfig {
  /** Text formatting mode */
  formatting?: 'plain' | 'markdown';
  /** Table rendering mode */
  tableMode?: TableMode;
  /** Separator between paragraphs */
  paragraphSeparator?: string;
  /** Whether to preserve empty paragraphs */
  preserveEmptyParagraphs?: boolean;
  /** Whether to preserve list indentation */
  preserveListIndentation?: boolean;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Convert a Document to plain text.
 *
 * @param doc - Document element or null
 * @param config - Optional configuration
 * @returns Plain text content
 */
export function documentToText(
  doc: Document | null | undefined,
  config?: TextConverterConfig
): string {
  if (!doc) {
    return '';
  }

  const converter = new TextConverter({ config });
  return converter.convert(doc);
}

// =============================================================================
// Text Converter Class
// =============================================================================

export interface TextConverterOptions {
  config?: TextConverterConfig;
  styles?: Styles;
  numbering?: Numbering;
  hyperlinkUrls?: Record<string, string>;
}

/**
 * Main converter for Document elements to plain text.
 */
export class TextConverter {
  config: Required<TextConverterConfig>;
  styles: Styles | undefined;
  numbering: Numbering | undefined;
  hyperlinkUrls: Record<string, string>;

  private _numberingCounters: Map<string, number> = new Map();
  private _numberingTracker: NumberingTracker;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private __paragraphConverter: ParagraphToTextConverter;
  private _tableConverter: TableToTextConverter;

  constructor(options?: TextConverterOptions) {
    this.config = {
      formatting: options?.config?.formatting ?? 'plain',
      tableMode: options?.config?.tableMode ?? 'auto',
      paragraphSeparator: options?.config?.paragraphSeparator ?? '\n\n',
      preserveEmptyParagraphs: options?.config?.preserveEmptyParagraphs ?? true,
      preserveListIndentation: options?.config?.preserveListIndentation ?? true,
    };
    this.styles = options?.styles;
    this.numbering = options?.numbering;
    this.hyperlinkUrls = options?.hyperlinkUrls ?? {};

    // Create numbering tracker for list indentation
    this._numberingTracker = new NumberingTracker(this.numbering);

    // Initialize sub-converters
    const useMarkdown = this.config.formatting === 'markdown';
    this.__paragraphConverter = new ParagraphToTextConverter({
      useMarkdown,
      hyperlinkUrls: this.hyperlinkUrls,
    });
    // Suppress unused variable warning
    void this.__paragraphConverter;
    this._tableConverter = new TableToTextConverter({
      mode: this.config.tableMode,
    });
  }

  /**
   * Convert a Document to text.
   *
   * @param doc - Document element or null
   * @returns Plain text content
   */
  convert(doc: Document | null | undefined): string {
    if (!doc) {
      return '';
    }

    if (!doc.body) {
      return '';
    }

    // Reset numbering counters
    this._numberingCounters.clear();

    const parts: string[] = [];

    if (doc.body.content) {
      for (const content of doc.body.content) {
        const text = this._convertContent(content);
        parts.push(text);
      }
    }

    // Join with paragraph separator and clean up
    let result = parts.join(this.config.paragraphSeparator);

    // Remove excessive newlines
    while (result.includes('\n\n\n')) {
      result = result.replace(/\n\n\n/g, '\n\n');
    }

    return result.trim();
  }

  /**
   * Convert body content element.
   */
  private _convertContent(content: unknown): string {
    if (!content || typeof content !== 'object') {
      return '';
    }

    // Check if it's a Paragraph
    if ('pPr' in content || ('content' in content && !('tr' in content))) {
      return this._convertParagraph(content as Paragraph);
    }

    // Check if it's a Table
    if ('tr' in content) {
      return this._tableConverter.convert(content as Table);
    }

    return '';
  }

  /**
   * Convert a paragraph with numbering support.
   */
  private _convertParagraph(para: Paragraph): string {
    // Update numbering counters and get prefix
    const prefixInfo = this._getNumberingPrefix(para);

    // Get list indentation if enabled
    let listIndentSpaces = 0;
    if (this.config.preserveListIndentation) {
      listIndentSpaces = this._getListIndentationSpaces(para);
    }

    // Create paragraph-specific converter with numbering info
    const numberingPrefixes: Record<string, [string, string]> = {};
    if (prefixInfo.key) {
      numberingPrefixes[prefixInfo.key] = [prefixInfo.prefix, prefixInfo.suffix];
    }

    const converter = new ParagraphToTextConverter({
      useMarkdown: this.config.formatting === 'markdown',
      hyperlinkUrls: this.hyperlinkUrls,
      numberingPrefixes,
      listIndentSpaces,
    });

    return converter.convert(para);
  }

  /**
   * Get list indentation as number of spaces.
   */
  private _getListIndentationSpaces(para: Paragraph): number {
    if (!para.pPr?.numPr) {
      return 0;
    }

    const numPr = para.pPr.numPr;
    if (numPr.numId == null || numPr.ilvl == null) {
      return 0;
    }

    // Get level definition
    const level = this._numberingTracker.getLevel(numPr.numId, numPr.ilvl);
    if (!level?.pPr) {
      return 0;
    }

    // Extract left indentation from level's paragraph properties
    const pPr = level.pPr;
    if (typeof pPr === 'object' && pPr !== null && 'left' in pPr) {
      const leftTwips = (pPr as Record<string, unknown>).left;
      if (typeof leftTwips === 'number') {
        // Convert twips to spaces (180 twips per space)
        return Math.max(0, Math.floor(leftTwips / 180));
      }
    }

    return 0;
  }

  /**
   * Get numbering prefix for paragraph.
   */
  private _getNumberingPrefix(para: Paragraph): { key: string | null; prefix: string; suffix: string } {
    if (!para.pPr?.numPr) {
      return { key: null, prefix: '', suffix: '' };
    }

    const numPr = para.pPr.numPr;
    if (numPr.numId == null || numPr.ilvl == null) {
      return { key: null, prefix: '', suffix: '' };
    }

    const key = `${numPr.numId}:${numPr.ilvl}`;
    // ilvl and numId are guaranteed not null here
    const ilvl: number = numPr.ilvl;
    const numId: number = numPr.numId;

    // Get format from numbering definitions
    let numFmt = 'decimal';
    let lvlText = `%${ilvl + 1}.`;
    let suff = '\t';
    let abstractDef: AbstractNumbering | undefined = undefined;

    if (this.numbering?.num) {
      // Find the numbering instance and abstract definition
      for (const numInstance of this.numbering.num) {
        if (numInstance.numId === numId) {
          if (this.numbering.abstractNum) {
            for (const abstract of this.numbering.abstractNum) {
              if (abstract.abstractNumId === numInstance.abstractNumId) {
                abstractDef = abstract;
                // Find the level
                if (abstract.lvl) {
                  for (const level of abstract.lvl) {
                    if (level.ilvl === ilvl) {
                      numFmt = level.numFmt ?? 'decimal';
                      lvlText = level.lvlText ?? `%${ilvl + 1}.`;
                      suff = level.suff ?? 'tab';
                      break;
                    }
                  }
                }
                break;
              }
            }
          }
          break;
        }
      }
    }

    // Reset counters for deeper levels when we go back to a shallower level
    for (const counterKey of Array.from(this._numberingCounters.keys())) {
      const [counterId, counterLevel] = counterKey.split(':').map(Number);
      if (counterId === numId && counterLevel > ilvl) {
        this._numberingCounters.delete(counterKey);
      }
    }

    // Increment counter for current level
    const current = (this._numberingCounters.get(key) ?? 0) + 1;
    this._numberingCounters.set(key, current);

    // Format the prefix
    let prefix: string;
    if (numFmt === 'bullet') {
      prefix = lvlText || '\u2022';
    } else {
      // Build counters dict and numFmts dict for all levels
      const counters: Record<number, number> = {};
      const numFmts: Record<number, string> = {};

      for (let levelIdx = 0; levelIdx < 10; levelIdx++) {
        const levelKey = `${numId}:${levelIdx}`;
        const counterVal = this._numberingCounters.get(levelKey);
        if (counterVal !== undefined) {
          counters[levelIdx] = counterVal;
        }

        // Get numFmt for each level from abstract definition
        if (abstractDef?.lvl) {
          for (const level of abstractDef.lvl) {
            if (level.ilvl === levelIdx) {
              numFmts[levelIdx] = level.numFmt ?? 'decimal';
              break;
            }
          }
        }
      }

      // Make sure current level is in counters
      counters[ilvl] = current;
      numFmts[ilvl] = numFmt;

      // Use applyLevelText to handle all placeholders
      prefix = applyLevelText(lvlText, counters, numFmts);
    }

    // Get suffix
    let suffix: string;
    if (suff === 'tab') {
      suffix = '\t';
    } else if (suff === 'space') {
      suffix = ' ';
    } else {
      suffix = '';
    }

    return { key, prefix, suffix };
  }
}
