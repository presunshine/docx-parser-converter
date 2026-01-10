/**
 * Converters barrel export.
 */

export { StyleResolver, NumberingTracker } from './common';
export * from './html';

// Text converters - explicitly export to avoid conflicts with HTML
export {
  // Run to text
  isMonospaceFont,
  textToText,
  breakToText,
  tabToText,
  runContentToText,
  runToText,
  applyMarkdownFormatting,
  RunToTextConverter,
  // Numbering to text
  NumberingToTextConverter,
  toCardinalText,
  // Paragraph to text
  paragraphToText,
  ParagraphToTextConverter,
  // Table to text
  type TableMode,
  type BorderInfo,
  createBorderInfo,
  hasAnyBorder,
  cellToText,
  rowToText,
  detectBorders,
  hasVisibleBorders,
  tableToAscii,
  tableToTabs,
  tableToPlain,
  tableToText,
  TableToTextConverter,
  // Text converter (main)
  type TextConverterConfig,
  type TextConverterOptions,
  documentToText,
  TextConverter,
} from './text';
