/**
 * Paragraph model definitions.
 *
 * Represents a paragraph with its properties and content.
 */

import type { ParagraphBorders } from '../common/border';
import type { Shading } from '../common/shading';
import type { Spacing } from '../common/spacing';
import type { Indentation } from '../common/indentation';
import type {
  JustificationType,
  TextDirectionType,
  TabType,
  TabLeaderType,
  FrameWrapType,
  FrameAnchorType,
  DropCapType,
} from '../types';
import type { Run, RunProperties } from './run';

/**
 * Numbering properties for a paragraph.
 *
 * Links a paragraph to a numbering definition.
 */
export interface NumberingProperties {
  /** Numbering level (0-8) */
  ilvl?: number | null;
  /** Numbering definition ID */
  numId?: number | null;
}

/**
 * Tab stop definition.
 */
export interface TabStop {
  /** Tab stop type */
  val?: TabType | null;
  /** Position in twips */
  pos?: number | null;
  /** Leader character */
  leader?: TabLeaderType | null;
}

/**
 * Frame properties for text boxes and drop caps.
 */
export interface FrameProperties {
  /** Frame width in twips */
  w?: number | null;
  /** Frame height in twips */
  h?: number | null;
  /** Horizontal spacing around frame in twips */
  hSpace?: number | null;
  /** Vertical spacing around frame in twips */
  vSpace?: number | null;
  /** Text wrapping type */
  wrap?: FrameWrapType | null;
  /** Horizontal anchor */
  hAnchor?: FrameAnchorType | null;
  /** Vertical anchor */
  vAnchor?: FrameAnchorType | null;
  /** Horizontal position */
  x?: number | null;
  /** Vertical position */
  y?: number | null;
  /** Horizontal alignment */
  xAlign?: string | null;
  /** Vertical alignment */
  yAlign?: string | null;
  /** Lock anchor position */
  anchorLock?: boolean | null;
  /** Drop cap type */
  dropCap?: DropCapType | null;
  /** Number of lines for drop cap */
  lines?: number | null;
}

/**
 * Paragraph properties.
 *
 * Contains all formatting properties for a paragraph.
 */
export interface ParagraphProperties {
  /** Paragraph style ID */
  pStyle?: string | null;
  /** Keep with next paragraph */
  keepNext?: boolean | null;
  /** Keep lines together */
  keepLines?: boolean | null;
  /** Page break before paragraph */
  pageBreakBefore?: boolean | null;
  /** Widow/orphan control */
  widowControl?: boolean | null;
  /** Suppress line numbers */
  suppressLineNumbers?: boolean | null;
  /** Paragraph borders */
  pBdr?: ParagraphBorders | null;
  /** Paragraph shading/background */
  shd?: Shading | null;
  /** Tab stops */
  tabs?: TabStop[] | null;
  /** Suppress automatic hyphenation */
  suppressAutoHyphens?: boolean | null;
  /** Paragraph spacing */
  spacing?: Spacing | null;
  /** Paragraph indentation */
  ind?: Indentation | null;
  /** Justification/alignment */
  jc?: JustificationType | null;
  /** Outline level (0-9) for TOC */
  outlineLvl?: number | null;
  /** Numbering properties */
  numPr?: NumberingProperties | null;
  /** Right-to-left paragraph */
  bidi?: boolean | null;
  /** Run properties for paragraph mark */
  rPr?: RunProperties | null;
  /** Text direction */
  textDirection?: TextDirectionType | null;
  /** Text alignment relative to text direction */
  textAlignment?: string | null;
  /** Frame/text box properties */
  framePr?: FrameProperties | null;
}

/**
 * Bookmark start marker.
 */
export interface BookmarkStart {
  type: 'bookmarkStart';
  /** Bookmark ID */
  id?: string | null;
  /** Bookmark name */
  name?: string | null;
}

/**
 * Bookmark end marker.
 */
export interface BookmarkEnd {
  type: 'bookmarkEnd';
  /** Bookmark ID (matches BookmarkStart) */
  id?: string | null;
}

/**
 * Hyperlink forward declaration.
 * Full interface defined in hyperlink.ts.
 */
export interface HyperlinkRef {
  type: 'hyperlink';
}

/**
 * A paragraph in the document.
 *
 * Contains paragraph properties and a sequence of runs and other content.
 */
export interface Paragraph {
  /** Paragraph properties */
  pPr?: ParagraphProperties | null;
  /** Paragraph content (runs, hyperlinks, bookmarks) */
  content: (Run | HyperlinkRef | BookmarkStart | BookmarkEnd)[];
}
