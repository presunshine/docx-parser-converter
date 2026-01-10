/**
 * Main HTML converter entry point.
 *
 * Provides the docxToHtml() function and HTMLConverter class for
 * converting DOCX documents to HTML.
 * Matches Python: converters/html/html_converter.py
 */

import type { Document } from '../../models/document/document';
import type { Paragraph } from '../../models/document/paragraph';
import type { Run, RunProperties } from '../../models/document/run';
import type { Table } from '../../models/document/table';
import type { SectionProperties } from '../../models/document/section';
import type { Styles } from '../../models/styles/styles';
import type { Numbering } from '../../models/numbering/numbering';
import { NumberingTracker } from '../common/numbering-tracker';
import { StyleResolver } from '../common/style-resolver';
import { CSSGenerator, runPropertiesToCss } from './css-generator';
import { HTMLDocumentBuilder } from './html-document';
import { paragraphToHtml } from './paragraph-to-html';
import { runToHtml } from './run-to-html';
import { tableToHtml } from './table-to-html';
import type { ImageData } from './image-to-html';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration options for HTML conversion.
 */
export interface ConversionConfig {
  /** Style output mode ("inline", "class", "none") */
  styleMode?: 'inline' | 'class' | 'none';
  /** Use semantic HTML tags (<strong>, <em>, etc.) */
  useSemanticTags?: boolean;
  /** Preserve whitespace in content */
  preserveWhitespace?: boolean;
  /** Include default CSS styles in output */
  includeDefaultStyles?: boolean;
  /** Document title for HTML output */
  title?: string;
  /** Document language (default: "en") */
  language?: string;
  /** Output HTML fragment without document wrapper */
  fragmentOnly?: boolean;
  /** Custom CSS to include in document */
  customCss?: string | null;
  /** External CSS files to reference */
  cssFiles?: string[];
  /** Use CSS custom properties */
  useCssVariables?: boolean;
  /** Include viewport meta for responsive design */
  responsive?: boolean;
  /** Include print media query styles */
  includePrintStyles?: boolean;
}

// =============================================================================
// Exceptions
// =============================================================================

/**
 * Base exception for conversion errors.
 */
export class ConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversionError';
  }
}

/**
 * Raised when the document is invalid or corrupted.
 */
export class InvalidDocumentError extends ConversionError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDocumentError';
  }
}

/**
 * Raised when the file format is not supported.
 */
export class UnsupportedFormatError extends ConversionError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFormatError';
  }
}

// =============================================================================
// HTMLConverter Class
// =============================================================================

/**
 * Converts DOCX documents to HTML.
 */
export class HTMLConverter {
  config: ConversionConfig;
  styles: Styles | undefined;
  numbering: Numbering | undefined;
  relationships: Record<string, string>;
  imageRelationships: Record<string, string>;
  imageData: ImageData;
  cssGenerator: CSSGenerator;
  styleResolver: StyleResolver;
  private _numberingTracker: NumberingTracker;

  constructor(
    config?: ConversionConfig,
    options?: {
      styles?: Styles;
      numbering?: Numbering;
      relationships?: Record<string, string>;
      imageRelationships?: Record<string, string>;
      imageData?: ImageData;
    }
  ) {
    this.config = {
      styleMode: 'inline',
      useSemanticTags: false,
      preserveWhitespace: false,
      includeDefaultStyles: true,
      title: '',
      language: 'en',
      fragmentOnly: false,
      customCss: null,
      cssFiles: [],
      useCssVariables: false,
      responsive: true,
      includePrintStyles: false,
      ...config,
    };

    this.styles = options?.styles;
    this.numbering = options?.numbering;
    this.relationships = options?.relationships ?? {};
    this.imageRelationships = options?.imageRelationships ?? {};
    this.imageData = options?.imageData ?? new Map();
    this.cssGenerator = new CSSGenerator();

    // Create numbering tracker for list counter management
    this._numberingTracker = new NumberingTracker(this.numbering);

    // Create style resolver for style inheritance
    const docDefaults = this.styles?.docDefaults;
    this.styleResolver = new StyleResolver(this.styles, docDefaults);
  }

  /**
   * Convert Document model to complete HTML.
   */
  convert(document: Document | null | undefined): string {
    if (!document) {
      return this._wrapContent('', undefined);
    }

    // Reset numbering tracker for new document
    this._numberingTracker.reset();

    // Convert body content
    const contentParts: string[] = [];
    if (document.body?.content) {
      for (const element of document.body.content) {
        if (this._isParagraph(element)) {
          const html = this.convertParagraph(element as Paragraph);
          contentParts.push(html);
        } else if (this._isTable(element)) {
          const html = this.convertTable(element as Table);
          contentParts.push(html);
        }
      }
    }

    const contentHtml = contentParts.join('');

    if (this.config.fragmentOnly) {
      return contentHtml;
    }

    // Extract section properties for page margins
    const sectPr = document.body?.sectPr ?? undefined;
    return this._wrapContent(contentHtml, sectPr);
  }

  /**
   * Convert Paragraph model to HTML.
   */
  convertParagraph(paragraph: Paragraph | null | undefined): string {
    // Get numbering prefix, indentation, and styles if applicable
    const numberingPrefix = this._getNumberingPrefix(paragraph);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [numberingIndentPt, _numberingHangingPt] = this._getNumberingIndentation(paragraph);
    const numberingStyles = this._getNumberingStyles(paragraph);

    return paragraphToHtml(paragraph, {
      relationships: this.relationships,
      numberingPrefix,
      numberingIndentPt,
      numberingStyles,
      useSemanticTags: this.config.useSemanticTags,
      styleResolver: this.styleResolver,
      imageData: this.imageData,
    });
  }

  /**
   * Convert Table model to HTML.
   */
  convertTable(table: Table | null | undefined): string {
    return tableToHtml(table, {
      relationships: this.relationships,
      styleResolver: this.styleResolver,
    });
  }

  /**
   * Convert Run model to HTML.
   */
  convertRun(run: Run | null | undefined): string {
    return runToHtml(run, {
      useSemanticTags: this.config.useSemanticTags,
    });
  }

  /**
   * Get numbering prefix for paragraph.
   */
  private _getNumberingPrefix(para: Paragraph | null | undefined): string | undefined {
    if (!para?.pPr?.numPr) return undefined;

    const numPr = para.pPr.numPr;
    if (numPr.numId == null || numPr.ilvl == null) return undefined;

    // Get the formatted number from the numbering tracker
    const prefix = this._numberingTracker.getNumber(numPr.numId, numPr.ilvl);
    if (!prefix) return undefined;

    // Get suffix from level definition
    const level = this._numberingTracker.getLevel(numPr.numId, numPr.ilvl);
    const suff = level?.suff ?? 'tab';

    // Get suffix
    let suffix: string;
    if (suff === 'tab') {
      suffix = '\t';
    } else if (suff === 'space') {
      suffix = ' ';
    } else {
      suffix = '';
    }

    return prefix + suffix;
  }

  /**
   * Get left and hanging indentation in points from numbering level.
   */
  private _getNumberingIndentation(
    para: Paragraph | null | undefined
  ): [number | undefined, number | undefined] {
    if (!para?.pPr?.numPr) return [undefined, undefined];

    const numPr = para.pPr.numPr;
    if (numPr.numId == null || numPr.ilvl == null) return [undefined, undefined];

    // Get level definition
    const level = this._numberingTracker.getLevel(numPr.numId, numPr.ilvl);
    if (!level?.pPr) return [undefined, undefined];

    // Extract indentation from level's paragraph properties
    const pPr = level.pPr;
    let leftPt: number | undefined;
    let hangingPt: number | undefined;

    if (typeof pPr === 'object' && pPr !== null && pPr.ind) {
      const ind = pPr.ind;
      if (ind.left != null) {
        // Convert twips to points (1 point = 20 twips)
        leftPt = ind.left / 20;
      }

      if (ind.hanging != null) {
        // Convert twips to points (1 point = 20 twips)
        hangingPt = ind.hanging / 20;
      }
    }

    return [leftPt, hangingPt];
  }

  /**
   * Get CSS styles from numbering level's run properties.
   */
  private _getNumberingStyles(para: Paragraph | null | undefined): Record<string, string> | undefined {
    if (!para?.pPr?.numPr) return undefined;

    const numPr = para.pPr.numPr;
    if (numPr.numId == null || numPr.ilvl == null) return undefined;

    // Get level definition
    const level = this._numberingTracker.getLevel(numPr.numId, numPr.ilvl);
    if (!level?.rPr) return undefined;

    // Convert the level's run properties to CSS
    const rPr = level.rPr;
    if (typeof rPr !== 'object' || rPr === null || Object.keys(rPr).length === 0) {
      return undefined;
    }

    try {
      const cssProps = runPropertiesToCss(rPr as RunProperties);
      return Object.keys(cssProps).length > 0 ? cssProps : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Wrap content in HTML document structure.
   */
  private _wrapContent(
    content: string,
    sectPr?: SectionProperties
  ): string {
    const builder = new HTMLDocumentBuilder();
    builder.setContent(content);
    builder.setTitle(this.config.title ?? '');
    builder.setLanguage(this.config.language ?? 'en');
    builder.setResponsive(this.config.responsive ?? true);

    // Apply page margins from section properties
    if (sectPr?.pgMar) {
      const pgMar = sectPr.pgMar;
      // Convert twips to points (1 point = 20 twips)
      const topPt = (pgMar.top ?? 1440) / 20;
      const rightPt = (pgMar.right ?? 1440) / 20;
      const bottomPt = (pgMar.bottom ?? 1440) / 20;
      const leftPt = (pgMar.left ?? 1440) / 20;
      builder.setPageMargins(topPt, rightPt, bottomPt, leftPt);
    }

    if (this.config.customCss) {
      builder.addCss(this.config.customCss);
    }

    for (const cssFile of this.config.cssFiles ?? []) {
      builder.addStylesheet(cssFile);
    }

    if (this.config.includePrintStyles) {
      builder.enablePrintStyles();
    }

    const doc = builder.build();
    return doc.render();
  }

  /**
   * Check if element is a Paragraph.
   */
  private _isParagraph(element: unknown): element is Paragraph {
    if (!element || typeof element !== 'object') return false;
    // Paragraph has content array and optionally pPr
    return 'content' in element && !('tr' in element) && !('tc' in element);
  }

  /**
   * Check if element is a Table.
   */
  private _isTable(element: unknown): element is Table {
    if (!element || typeof element !== 'object') return false;
    // Table has tr array
    return 'tr' in element;
  }
}

// =============================================================================
// Main Conversion Function
// =============================================================================

/**
 * Convert DOCX document to HTML.
 */
export function docxToHtml(
  source: Document | null | undefined,
  options?: {
    config?: ConversionConfig;
    styles?: Styles;
    numbering?: Numbering;
    relationships?: Record<string, string>;
    imageData?: ImageData;
  }
): string {
  const config = options?.config;

  // If source is null/undefined, return empty HTML structure
  if (!source) {
    if (config?.fragmentOnly) {
      return '';
    }
    const converter = new HTMLConverter(config);
    return converter['_wrapContent']('');
  }

  // Convert document
  const converter = new HTMLConverter(config, {
    styles: options?.styles,
    numbering: options?.numbering,
    relationships: options?.relationships,
    imageData: options?.imageData,
  });

  return converter.convert(source);
}

/**
 * Convert DOCX document to HTML in streaming mode.
 * Returns array of chunks (for now just one chunk).
 */
export function docxToHtmlStream(
  source: Document | null | undefined,
  options?: {
    config?: ConversionConfig;
  }
): string[] {
  const result = docxToHtml(source, options);
  return [result];
}
