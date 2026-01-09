/**
 * Drawing model definitions.
 *
 * Represents images and other graphical elements in the document.
 */

/**
 * Drawing extent (dimensions).
 *
 * Values are in EMUs (English Metric Units).
 * 914400 EMUs = 1 inch
 */
export interface DrawingExtent {
  /** Width in EMUs */
  cx?: number | null;
  /** Height in EMUs */
  cy?: number | null;
}

/**
 * Drawing properties (metadata).
 */
export interface DrawingProperties {
  /** Unique ID for the drawing */
  id?: number | null;
  /** Name of the drawing */
  name?: string | null;
  /** Description/alt text for accessibility */
  descr?: string | null;
}

/**
 * Blip (binary large image or picture) reference.
 */
export interface Blip {
  /** Relationship ID to the image file */
  embed?: string | null;
  /** Link to external image (rarely used) */
  link?: string | null;
}

/**
 * Blip fill (image fill).
 */
export interface BlipFill {
  /** The image blip */
  blip?: Blip | null;
}

/**
 * Shape properties.
 */
export interface ShapeProperties {
  /** Shape extent/dimensions */
  extent?: DrawingExtent | null;
}

/**
 * Picture element.
 */
export interface Picture {
  /** Blip fill containing the image */
  blipFill?: BlipFill | null;
  /** Shape properties */
  spPr?: ShapeProperties | null;
}

/**
 * Graphic data container.
 */
export interface GraphicData {
  /** URI identifying the graphic type */
  uri?: string | null;
  /** Picture element */
  pic?: Picture | null;
}

/**
 * Graphic container.
 */
export interface Graphic {
  /** Graphic data */
  graphicData?: GraphicData | null;
}

/**
 * Inline drawing (embedded in text flow).
 */
export interface InlineDrawing {
  /** Drawing dimensions */
  extent?: DrawingExtent | null;
  /** Drawing properties (name, description) */
  docPr?: DrawingProperties | null;
  /** The graphic content */
  graphic?: Graphic | null;
}

/**
 * Anchor drawing (floating/positioned).
 */
export interface AnchorDrawing {
  /** Drawing dimensions */
  extent?: DrawingExtent | null;
  /** Drawing properties (name, description) */
  docPr?: DrawingProperties | null;
  /** The graphic content */
  graphic?: Graphic | null;
  /** Horizontal alignment */
  hAlign?: string | null;
  /** Vertical alignment */
  vAlign?: string | null;
  /** Text wrapping type */
  wrapType?: string | null;
  /** Draw behind document text */
  behindDoc?: boolean | null;
  /** Distance from text (top) in EMUs */
  distT?: number | null;
  /** Distance from text (bottom) in EMUs */
  distB?: number | null;
  /** Distance from text (left) in EMUs */
  distL?: number | null;
  /** Distance from text (right) in EMUs */
  distR?: number | null;
}

/**
 * A drawing element (image or shape).
 *
 * Can be either inline (flows with text) or anchor (floating).
 */
export interface Drawing {
  /** Inline drawing (in text flow) */
  inline?: InlineDrawing | null;
  /** Anchor drawing (floating) */
  anchor?: AnchorDrawing | null;
}
