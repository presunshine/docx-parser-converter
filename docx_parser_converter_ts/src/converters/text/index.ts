/**
 * Text converter utilities.
 */

export {
  toRoman,
  toLetter,
  toOrdinal,
  toOrdinalText,
  toCardinalText,
  toDecimalZero,
  formatNumber,
  applyLevelText,
  getSuffix,
  NumberingToTextConverter,
} from './numbering-to-text';

export {
  isMonospaceFont,
  textToText,
  breakToText,
  tabToText,
  runContentToText,
  runToText,
  applyMarkdownFormatting,
  RunToTextConverter,
} from './run-to-text';

export {
  paragraphToText,
  ParagraphToTextConverter,
  type ParagraphToTextConverterOptions,
} from './paragraph-to-text';

export {
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
} from './table-to-text';

export {
  type TextConverterConfig,
  type TextConverterOptions,
  documentToText,
  TextConverter,
} from './text-converter';
