/**
 * Run to HTML converter.
 *
 * Converts Run elements to HTML spans with proper formatting.
 * Matches Python: converters/html/run_to_html.py
 */

import type { Run, RunProperties } from '../../models/document/run';
import type { RunContentItem, Text, Break, TabChar, SoftHyphen, NoBreakHyphen, CarriageReturn, DrawingContent } from '../../models/document/run-content';
import { runPropertiesToCss } from './css-generator';
import { drawingToHtml } from './image-to-html';
import type { ImageData } from './image-to-html';
import type { Drawing } from '../../models/document/drawing';

export interface RunToHTMLConverterOptions {
  useSemanticTags?: boolean;
  useClasses?: boolean;
  imageData?: ImageData;
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
 * Converts text content to HTML.
 */
export function textToHtml(text: Text | null): string {
  if (!text || !text.value) return '';

  let content = escapeHtml(text.value);

  // Handle xml:space="preserve" - convert spaces to &nbsp;
  if (text.space === 'preserve') {
    // Convert leading/trailing spaces and multiple spaces to &nbsp;
    content = content.replace(/\s{2}/g, '&nbsp;&nbsp;');
    if (content.startsWith(' ')) {
      content = '&nbsp;' + content.slice(1);
    }
    if (content.endsWith(' ')) {
      content = content.slice(0, -1) + '&nbsp;';
    }
  }

  return content;
}

/**
 * Converts a break element to HTML.
 */
export function breakToHtml(br: Break | null): string {
  if (!br) return '<br>';

  if (br.breakType === 'page') {
    return '<hr class="page-break" style="page-break-after: always; border: none;">';
  }
  if (br.breakType === 'column') {
    return '<span class="column-break" style="break-after: column;"></span>';
  }

  return '<br>';
}

/**
 * Converts a tab character to HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tabToHtml(_tab: TabChar | null): string {
  return '<span class="tab" style="display: inline-block; width: 0.5in;">\t</span>';
}

/**
 * Converts a soft hyphen to HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function softHyphenToHtml(_sh: SoftHyphen | null): string {
  return '&shy;';
}

/**
 * Converts a no-break hyphen to HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function noBreakHyphenToHtml(_nbh: NoBreakHyphen | null): string {
  return '&#8209;'; // Non-breaking hyphen
}

/**
 * Converts a carriage return to HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function carriageReturnToHtml(_cr: CarriageReturn | null): string {
  return '<br>';
}

/**
 * Converts run content item to HTML.
 */
export function runContentToHtml(item: RunContentItem, imageData?: ImageData): string {
  if (!item) return '';

  switch (item.type) {
    case 'text':
      return textToHtml(item as Text);
    case 'break':
      return breakToHtml(item as Break);
    case 'tab':
      return tabToHtml(item as TabChar);
    case 'softHyphen':
      return softHyphenToHtml(item as SoftHyphen);
    case 'noBreakHyphen':
      return noBreakHyphenToHtml(item as NoBreakHyphen);
    case 'cr':
      return carriageReturnToHtml(item as CarriageReturn);
    case 'drawing':
      if (imageData) {
        const drawingItem = item as DrawingContent;
        return drawingToHtml(drawingItem.drawing as Drawing, imageData);
      }
      return '';
    default:
      return '';
  }
}

/**
 * Converts a Run element to HTML.
 */
export function runToHtml(run: Run | null | undefined, options?: RunToHTMLConverterOptions): string {
  if (!run) return '';
  if (!run.content || run.content.length === 0) return '';

  // Convert all content items
  const imageData = options?.imageData;
  const contentHtml = run.content.map(item => runContentToHtml(item, imageData)).join('');

  // If no content, return empty string
  if (!contentHtml) return '';

  // Get run properties
  const rPr = run.rPr;
  if (!rPr) {
    return contentHtml;
  }

  // Check if semantic tags should be used
  const useSemanticTags = options?.useSemanticTags ?? false;

  if (useSemanticTags) {
    return applySemanticTags(contentHtml, rPr);
  } else {
    return applyInlineStyles(contentHtml, rPr);
  }
}

/**
 * Apply semantic HTML tags for formatting.
 */
function applySemanticTags(content: string, rPr: RunProperties): string {
  let result = content;

  // Apply semantic tags from innermost to outermost
  if (rPr.vertAlign === 'superscript') {
    result = `<sup>${result}</sup>`;
  } else if (rPr.vertAlign === 'subscript') {
    result = `<sub>${result}</sub>`;
  }

  if (rPr.u && rPr.u.val && rPr.u.val !== 'none') {
    result = `<u>${result}</u>`;
  }

  if (rPr.strike || rPr.dstrike) {
    result = `<s>${result}</s>`;
  }

  if (rPr.i) {
    result = `<em>${result}</em>`;
  }

  if (rPr.b) {
    result = `<strong>${result}</strong>`;
  }

  // Apply remaining styles via span
  const css = runPropertiesToCss(rPr);
  // Remove properties that were handled by semantic tags
  delete css['font-weight'];
  delete css['font-style'];
  delete css['text-decoration'];
  delete css['vertical-align'];

  if (Object.keys(css).length > 0) {
    const styleStr = Object.entries(css)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    result = `<span style="${styleStr}">${result}</span>`;
  }

  return result;
}

/**
 * Apply inline CSS styles for formatting.
 */
function applyInlineStyles(content: string, rPr: RunProperties): string {
  const css = runPropertiesToCss(rPr);

  if (Object.keys(css).length === 0) {
    return content;
  }

  const styleStr = Object.entries(css)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');

  return `<span style="${styleStr}">${content}</span>`;
}

/**
 * Converter class for converting runs to HTML.
 */
export class RunToHTMLConverter {
  useSemanticTags: boolean;
  useClasses: boolean;

  constructor(options?: RunToHTMLConverterOptions) {
    this.useSemanticTags = options?.useSemanticTags ?? false;
    this.useClasses = options?.useClasses ?? false;
  }

  /**
   * Convert a run to HTML.
   */
  convert(run: Run | null): string {
    return runToHtml(run, {
      useSemanticTags: this.useSemanticTags,
      useClasses: this.useClasses,
    });
  }

  /**
   * Convert a single content item to HTML.
   */
  convertContent(item: RunContentItem): string {
    return runContentToHtml(item);
  }
}
