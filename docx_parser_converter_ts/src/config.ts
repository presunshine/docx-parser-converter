/**
 * Configuration options for DOCX conversion.
 *
 * This module provides the unified ConversionConfig interface that supports
 * both HTML and text conversion options.
 *
 * Matches Python: api.py (ConversionConfig)
 */

import type { ConversionConfig as HTMLConversionConfig } from './converters/html/html-converter';
import type { TextConverterConfig } from './converters/text/text-converter';

// =============================================================================
// Configuration Types
// =============================================================================

/** Style output mode for HTML */
export type StyleMode = 'inline' | 'class' | 'none';

/** Text formatting mode */
export type TextFormatting = 'plain' | 'markdown';

/** Table rendering mode for text output */
export type TableMode = 'auto' | 'ascii' | 'tabs' | 'plain';

// =============================================================================
// Unified Configuration
// =============================================================================

/**
 * Configuration options for DOCX conversion.
 *
 * This unified configuration interface supports both HTML and text conversion.
 * Options are grouped by their target format.
 *
 * HTML Options:
 *   - styleMode: How to output styles ("inline", "class", "none")
 *   - useSemanticTags: Use semantic HTML tags (<strong>, <em>, <del>, <sub>, <sup>)
 *       instead of CSS spans. Default is false for maximum styling fidelity.
 *   - preserveWhitespace: Preserve whitespace in content
 *   - includeDefaultStyles: Include default CSS styles
 *   - title: Document title for HTML output
 *   - language: Document language (e.g., "en", "de")
 *   - fragmentOnly: Output HTML fragment without document wrapper
 *   - customCss: Custom CSS to include in document
 *   - cssFiles: External CSS files to reference
 *   - useCssVariables: Use CSS custom properties
 *   - responsive: Include viewport meta for responsive design
 *   - includePrintStyles: Include print media query styles
 *
 * Text Options:
 *   - textFormatting: Text output format ("plain", "markdown")
 *   - tableMode: Table rendering ("auto", "ascii", "tabs", "plain")
 *   - paragraphSeparator: Separator between paragraphs
 *   - preserveEmptyParagraphs: Preserve empty paragraphs as blank lines
 */
export interface ConversionConfig {
  // -------------------------------------------------------------------------
  // HTML Options
  // -------------------------------------------------------------------------

  /** Style output mode ("inline", "class", "none"). Default: "inline" */
  styleMode?: StyleMode;

  /** Use semantic HTML tags (<strong>, <em>, etc.). Default: false */
  useSemanticTags?: boolean;

  /** Preserve whitespace in content. Default: false */
  preserveWhitespace?: boolean;

  /** Include default CSS styles in output. Default: true */
  includeDefaultStyles?: boolean;

  /** Document title for HTML output. Default: "" */
  title?: string;

  /** Document language (e.g., "en", "de"). Default: "en" */
  language?: string;

  /** Output HTML fragment without document wrapper. Default: false */
  fragmentOnly?: boolean;

  /** Custom CSS to include in document. Default: null */
  customCss?: string | null;

  /** External CSS files to reference. Default: [] */
  cssFiles?: string[];

  /** Use CSS custom properties. Default: false */
  useCssVariables?: boolean;

  /** Include viewport meta for responsive design. Default: true */
  responsive?: boolean;

  /** Include print media query styles. Default: false */
  includePrintStyles?: boolean;

  // -------------------------------------------------------------------------
  // Text Options
  // -------------------------------------------------------------------------

  /** Text output format ("plain", "markdown"). Default: "plain" */
  textFormatting?: TextFormatting;

  /** Table rendering mode ("auto", "ascii", "tabs", "plain"). Default: "auto" */
  tableMode?: TableMode;

  /** Separator between paragraphs. Default: "\n\n" */
  paragraphSeparator?: string;

  /** Preserve empty paragraphs as blank lines. Default: true */
  preserveEmptyParagraphs?: boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: Required<ConversionConfig> = {
  // HTML defaults
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

  // Text defaults
  textFormatting: 'plain',
  tableMode: 'auto',
  paragraphSeparator: '\n\n',
  preserveEmptyParagraphs: true,
};

// =============================================================================
// Configuration Conversion
// =============================================================================

/**
 * Convert unified config to HTML-specific configuration.
 *
 * @param config - Unified conversion configuration
 * @returns HTML-specific configuration
 */
export function toHtmlConfig(config?: ConversionConfig): HTMLConversionConfig {
  const c = config ?? {};
  return {
    styleMode: c.styleMode ?? DEFAULT_CONFIG.styleMode,
    useSemanticTags: c.useSemanticTags ?? DEFAULT_CONFIG.useSemanticTags,
    preserveWhitespace: c.preserveWhitespace ?? DEFAULT_CONFIG.preserveWhitespace,
    includeDefaultStyles: c.includeDefaultStyles ?? DEFAULT_CONFIG.includeDefaultStyles,
    title: c.title ?? DEFAULT_CONFIG.title,
    language: c.language ?? DEFAULT_CONFIG.language,
    fragmentOnly: c.fragmentOnly ?? DEFAULT_CONFIG.fragmentOnly,
    customCss: c.customCss ?? DEFAULT_CONFIG.customCss,
    cssFiles: c.cssFiles ?? DEFAULT_CONFIG.cssFiles,
    useCssVariables: c.useCssVariables ?? DEFAULT_CONFIG.useCssVariables,
    responsive: c.responsive ?? DEFAULT_CONFIG.responsive,
    includePrintStyles: c.includePrintStyles ?? DEFAULT_CONFIG.includePrintStyles,
  };
}

/**
 * Convert unified config to text-specific configuration.
 *
 * @param config - Unified conversion configuration
 * @returns Text-specific configuration
 */
export function toTextConfig(config?: ConversionConfig): TextConverterConfig {
  const c = config ?? {};
  return {
    formatting: c.textFormatting ?? DEFAULT_CONFIG.textFormatting,
    tableMode: c.tableMode ?? DEFAULT_CONFIG.tableMode,
    paragraphSeparator: c.paragraphSeparator ?? DEFAULT_CONFIG.paragraphSeparator,
    preserveEmptyParagraphs: c.preserveEmptyParagraphs ?? DEFAULT_CONFIG.preserveEmptyParagraphs,
  };
}
