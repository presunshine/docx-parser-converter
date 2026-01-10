/**
 * Paragraph to HTML converter.
 *
 * Converts Paragraph elements to HTML p/div tags with proper formatting.
 * Matches Python: converters/html/paragraph_to_html.py
 */

import type { Paragraph, BookmarkStart, BookmarkEnd } from '../../models/document/paragraph';
import type { Hyperlink } from '../../models/document/hyperlink';
import type { Run } from '../../models/document/run';
import { paragraphPropertiesToCss } from './css-generator';
import { runToHtml } from './run-to-html';
import type { StyleResolver } from '../common/style-resolver';
import type { ImageData } from './image-to-html';

export interface ParagraphToHTMLConverterOptions {
  useSemanticTags?: boolean;
  useClasses?: boolean;
  useInlineStyles?: boolean;
  useHeadings?: boolean;
}

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts a bookmark start element to HTML.
 */
export function bookmarkStartToHtml(bookmark: BookmarkStart | null): string {
  if (!bookmark || !bookmark.name) return '';
  return `<span id="${escapeHtml(bookmark.name)}"></span>`;
}

/**
 * Converts a bookmark end element to HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function bookmarkEndToHtml(_bookmark: BookmarkEnd | null): string {
  return '';
}

/**
 * Converts a hyperlink element to HTML.
 */
export function hyperlinkToHtml(
  hyperlink: Hyperlink | null,
  relationships?: Record<string, string>,
  options?: ParagraphToHTMLConverterOptions
): string {
  if (!hyperlink) return '';

  // Get href
  let href = '';
  if (hyperlink.anchor) {
    href = `#${hyperlink.anchor}`;
  } else if (hyperlink.rId && relationships) {
    href = relationships[hyperlink.rId] || '#';
  } else {
    href = '#';
  }

  // Build attributes
  const attrs: string[] = [`href="${escapeHtml(href)}"`];
  if (hyperlink.tooltip) {
    attrs.push(`title="${escapeHtml(hyperlink.tooltip)}"`);
  }

  // Convert content
  let content = '';
  if (hyperlink.content) {
    content = hyperlink.content
      .map((item) => paragraphContentToHtml(item, relationships, options))
      .join('');
  }

  return `<a ${attrs.join(' ')}>${content}</a>`;
}

/**
 * Converts paragraph content item to HTML.
 */
export function paragraphContentToHtml(
  item: Run | Hyperlink | BookmarkStart | BookmarkEnd | unknown,
  relationships?: Record<string, string>,
  options?: ParagraphToHTMLConverterOptions & { imageData?: ImageData }
): string {
  if (!item || typeof item !== 'object') return '';

  // Check item type based on properties
  if ('content' in item && 'rPr' in item) {
    // It's a Run
    return runToHtml(item as Run, { ...options, imageData: options?.imageData });
  }
  if ('rId' in item || 'anchor' in item) {
    // It's a Hyperlink
    return hyperlinkToHtml(item as Hyperlink, relationships, options);
  }
  if ('name' in item && 'id' in item) {
    // It's a BookmarkStart
    return bookmarkStartToHtml(item as BookmarkStart);
  }
  if ('id' in item && !('name' in item)) {
    // It's a BookmarkEnd
    return bookmarkEndToHtml(item as BookmarkEnd);
  }

  // Try to convert as Run if it has content
  if ('content' in item && Array.isArray((item as Run).content)) {
    return runToHtml(item as Run, { ...options, imageData: options?.imageData });
  }

  return '';
}

/**
 * Converts a Paragraph element to HTML.
 */
export function paragraphToHtml(
  paragraph: Paragraph | null | undefined,
  options?: {
    relationships?: Record<string, string>;
    useHeadings?: boolean;
    useSemanticTags?: boolean;
    useClasses?: boolean;
    useInlineStyles?: boolean;
    numberingPrefix?: string;
    numberingIndentPt?: number;
    numberingStyles?: Record<string, string>;
    styleResolver?: StyleResolver | null;
    imageData?: ImageData;
  }
): string {
  if (!paragraph) return '';

  const pPr = paragraph.pPr;
  const relationships = options?.relationships;
  const useHeadings = options?.useHeadings ?? false;
  const useInlineStyles = options?.useInlineStyles ?? true;
  const styleResolver = options?.styleResolver;
  const numberingPrefix = options?.numberingPrefix;
  const numberingIndentPt = options?.numberingIndentPt;
  const numberingStyles = options?.numberingStyles;

  // Determine tag type
  let tag = 'p';
  if (useHeadings && pPr?.outlineLvl !== undefined && pPr.outlineLvl !== null) {
    const level = Math.min(pPr.outlineLvl + 1, 6);
    tag = `h${level}`;
  }

  // Build CSS styles
  let css: Record<string, string> = {};

  // Resolve styles if style resolver provided
  if (styleResolver && pPr?.pStyle) {
    const resolvedProps = styleResolver.resolveParagraphProperties(pPr.pStyle);
    css = { ...css, ...paragraphPropertiesToCss(resolvedProps) };
  }

  // Add direct formatting (overrides style)
  if (pPr) {
    css = { ...css, ...paragraphPropertiesToCss(pPr) };
  }

  // Handle numbering indent
  if (numberingIndentPt !== undefined) {
    css['margin-left'] = `${numberingIndentPt}pt`;
  }

  // Build attributes
  const attrs: string[] = [];

  // Add inline styles
  if (useInlineStyles && Object.keys(css).length > 0) {
    const styleStr = Object.entries(css)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    attrs.push(`style="${styleStr}"`);
  }

  // Add RTL direction
  if (pPr?.bidi) {
    attrs.push('dir="rtl"');
  }

  // Convert content
  let contentHtml = '';

  // Add numbering prefix if provided
  if (numberingPrefix) {
    const markerCss = numberingStyles
      ? Object.entries(numberingStyles)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ')
      : '';
    const markerStyle = markerCss ? ` style="${markerCss}"` : '';
    contentHtml += `<span class="list-marker"${markerStyle}>${escapeHtml(numberingPrefix)}</span>`;
  }

  // Convert paragraph content
  if (paragraph.content) {
    contentHtml += paragraph.content
      .map((item) =>
        paragraphContentToHtml(item, relationships, {
          useSemanticTags: options?.useSemanticTags,
          useClasses: options?.useClasses,
          imageData: options?.imageData,
        })
      )
      .join('');
  }

  // If empty paragraph, add <br> to preserve vertical space
  if (!contentHtml) {
    contentHtml = '<br>';
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  return `<${tag}${attrStr}>${contentHtml}</${tag}>`;
}

/**
 * Converter class for converting paragraphs to HTML.
 */
export class ParagraphToHTMLConverter {
  useSemanticTags: boolean;
  useClasses: boolean;
  useInlineStyles: boolean;
  useHeadings: boolean;
  relationships: Record<string, string>;
  styleResolver: StyleResolver | null;

  constructor(options?: ParagraphToHTMLConverterOptions) {
    this.useSemanticTags = options?.useSemanticTags ?? false;
    this.useClasses = options?.useClasses ?? false;
    this.useInlineStyles = options?.useInlineStyles ?? true;
    this.useHeadings = options?.useHeadings ?? false;
    this.relationships = {};
    this.styleResolver = null;
  }

  /**
   * Set relationships for hyperlink resolution.
   */
  setRelationships(relationships: Record<string, string>): void {
    this.relationships = relationships;
  }

  /**
   * Set style resolver for style resolution.
   */
  setStyleResolver(styleResolver: StyleResolver | null): void {
    this.styleResolver = styleResolver;
  }

  /**
   * Convert a paragraph to HTML.
   */
  convert(
    paragraph: Paragraph | null,
    options?: {
      numberingPrefix?: string;
      numberingIndentPt?: number;
      numberingStyles?: Record<string, string>;
    }
  ): string {
    return paragraphToHtml(paragraph, {
      relationships: this.relationships,
      useHeadings: this.useHeadings,
      useSemanticTags: this.useSemanticTags,
      useClasses: this.useClasses,
      useInlineStyles: this.useInlineStyles,
      styleResolver: this.styleResolver,
      ...options,
    });
  }

  /**
   * Convert a single content item to HTML.
   */
  convertContent(item: Run | Hyperlink | BookmarkStart | BookmarkEnd | unknown): string {
    return paragraphContentToHtml(item, this.relationships, {
      useSemanticTags: this.useSemanticTags,
      useClasses: this.useClasses,
    });
  }
}
