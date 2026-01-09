/**
 * Document models barrel export.
 */

// Document structure
export type { Document, Body, BodyContentItem } from './document';

// Paragraph and related
export type {
  Paragraph,
  ParagraphProperties,
  NumberingProperties,
  TabStop,
  FrameProperties,
  BookmarkStart,
  BookmarkEnd,
} from './paragraph';

// Run and related
export type {
  Run,
  RunProperties,
  RunFonts,
  Language,
  Underline,
} from './run';

// Run content items
export type {
  RunContentItem,
  Text,
  Break,
  TabChar,
  CarriageReturn,
  SoftHyphen,
  NoBreakHyphen,
  Symbol,
  FieldChar,
  InstrText,
  FootnoteReference,
  EndnoteReference,
  DrawingContent,
} from './run-content';

// Hyperlink
export type { Hyperlink } from './hyperlink';

// Table and related
export type {
  Table,
  TableProperties,
  TableGrid,
  TableGridColumn,
  TableLook,
  TableCellMargins,
  TableRow,
  TableRowProperties,
  TableRowHeight,
  TableCell,
  TableCellProperties,
} from './table';

// Drawing/Images
export type {
  Drawing,
  InlineDrawing,
  AnchorDrawing,
  DrawingExtent,
  DrawingProperties,
  Graphic,
  GraphicData,
  Picture,
  BlipFill,
  Blip,
  ShapeProperties,
} from './drawing';

// Section
export type {
  SectionProperties,
  PageSize,
  PageMargins,
  PageBorders,
  Columns,
  Column,
  DocumentGrid,
  HeaderFooterReference,
  PageNumberType,
  LineNumberType,
} from './section';
