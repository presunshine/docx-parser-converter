/**
 * HTML converter utilities.
 */

export {
  CSSGenerator,
  cssGenerator,
  borderToCss,
  cellMarginsToCss,
  cellVerticalAlignToCss,
  colorToCss,
  eighthsToPt,
  emuToPx,
  fontFamilyToCss,
  fontSizeToCss,
  halfPointsToPt,
  highlightToCss,
  paragraphBordersToCss,
  paragraphPropertiesToCss,
  runPropertiesToCss,
  shadingToCss,
  tableBordersToCss,
  tableCellPropertiesToCss,
  twipsToPt,
  twipsToPx,
  widthToCss,
} from './css-generator';

export { HTMLDocument, HTMLDocumentBuilder } from './html-document';
export type { HTMLDocumentOptions } from './html-document';

export {
  RunToHTMLConverter,
  runToHtml,
  textToHtml,
  breakToHtml,
  tabToHtml,
  softHyphenToHtml,
  noBreakHyphenToHtml,
  carriageReturnToHtml,
  runContentToHtml,
} from './run-to-html';
export type { RunToHTMLConverterOptions } from './run-to-html';

export {
  ParagraphToHTMLConverter,
  paragraphToHtml,
  hyperlinkToHtml,
  bookmarkStartToHtml,
  bookmarkEndToHtml,
  paragraphContentToHtml,
} from './paragraph-to-html';
export type { ParagraphToHTMLConverterOptions, ParagraphContentToHTMLOptions } from './paragraph-to-html';

export {
  TableToHTMLConverter,
  tableToHtml,
  calculateRowspans,
  isMergedCell,
} from './table-to-html';
export type { TableToHTMLConverterOptions } from './table-to-html';

export {
  NumberingToHTMLConverter,
  toRoman,
  toLetter,
  toOrdinal,
  toOrdinalText,
  toChicago,
  toDecimalZero,
  toDecimalEnclosedCircle,
  formatNumber,
  applyLevelText,
  getSuffix,
  generateCssCounterStyle,
  generateCounterResetCss,
  generateCounterContentCss,
  getListType,
  getListStyleType,
} from './numbering-to-html';

export {
  ImageToHTMLConverter,
  emuToPx as imageEmuToPx,
  buildImgTag,
  getBlipEmbed,
  drawingToHtml,
  inlineDrawingToHtml,
  anchorDrawingToHtml,
} from './image-to-html';
export type { ImageData } from './image-to-html';

export {
  HTMLConverter,
  docxToHtml,
  docxToHtmlStream,
  ConversionError,
  InvalidDocumentError,
  UnsupportedFormatError,
} from './html-converter';
export type { ConversionConfig } from './html-converter';
