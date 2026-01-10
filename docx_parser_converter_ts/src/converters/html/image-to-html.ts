/**
 * Image to HTML converter.
 *
 * Converts Drawing elements to HTML img tags with base64 data URLs.
 * Matches Python: converters/html/image_to_html.py
 */

import type {
  Drawing,
  InlineDrawing,
  AnchorDrawing,
  Graphic,
} from '../../models/document/drawing';

// EMU to pixels conversion (914400 EMU = 1 inch at 96 DPI)
const EMU_PER_PIXEL = 9525;

/**
 * Image data type for pre-loaded images.
 */
export type ImageData = Map<string, { bytes: Uint8Array; contentType: string }>;

/**
 * Convert EMU (English Metric Units) to pixels.
 */
export function emuToPx(emu: number | undefined | null): number | undefined {
  if (emu === undefined || emu === null) {
    return undefined;
  }
  return Math.round(emu / EMU_PER_PIXEL);
}

/**
 * Escapes HTML special characters.
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
 * Convert Uint8Array to base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Drawing element to HTML img tag.
 */
export function drawingToHtml(
  drawing: Drawing | null | undefined,
  imageData: ImageData
): string {
  if (!drawing) return '';

  if (drawing.inline) {
    return inlineDrawingToHtml(drawing.inline, imageData);
  } else if (drawing.anchor) {
    return anchorDrawingToHtml(drawing.anchor, imageData);
  }
  return '';
}

/**
 * Convert inline drawing to HTML img tag.
 */
export function inlineDrawingToHtml(
  inline: InlineDrawing | null | undefined,
  imageData: ImageData
): string {
  if (!inline) return '';

  // Get the relationship ID from the blip
  const relId = getBlipEmbed(inline.graphic);
  if (!relId) return '';

  // Get the pre-loaded image data
  const data = imageData.get(relId);
  if (!data) return '';

  const { bytes, contentType } = data;

  // Create base64 data URL
  const b64Data = uint8ArrayToBase64(bytes);
  const dataUrl = `data:${contentType};base64,${b64Data}`;

  // Get dimensions
  let widthPx: number | undefined;
  let heightPx: number | undefined;
  if (inline.extent) {
    widthPx = emuToPx(inline.extent.cx);
    heightPx = emuToPx(inline.extent.cy);
  }

  // Get alt text
  let altText = '';
  if (inline.docPr?.descr) {
    altText = inline.docPr.descr;
  }

  // Build style attribute
  const styleParts: string[] = [];
  if (widthPx) {
    styleParts.push(`width: ${widthPx}px`);
  }
  if (heightPx) {
    styleParts.push(`height: ${heightPx}px`);
  }

  // Build the img tag
  return buildImgTag(dataUrl, altText, styleParts);
}

/**
 * Convert anchored/floating drawing to HTML img tag.
 */
export function anchorDrawingToHtml(
  anchor: AnchorDrawing | null | undefined,
  imageData: ImageData
): string {
  if (!anchor) return '';

  // Get the relationship ID from the blip
  const relId = getBlipEmbed(anchor.graphic);
  if (!relId) return '';

  // Get the pre-loaded image data
  const data = imageData.get(relId);
  if (!data) return '';

  const { bytes, contentType } = data;

  // Create base64 data URL
  const b64Data = uint8ArrayToBase64(bytes);
  const dataUrl = `data:${contentType};base64,${b64Data}`;

  // Get dimensions
  let widthPx: number | undefined;
  let heightPx: number | undefined;
  if (anchor.extent) {
    widthPx = emuToPx(anchor.extent.cx);
    heightPx = emuToPx(anchor.extent.cy);
  }

  // Get alt text
  let altText = '';
  if (anchor.docPr?.descr) {
    altText = anchor.docPr.descr;
  }

  // Build style attribute with float positioning
  const styleParts: string[] = [];
  if (widthPx) {
    styleParts.push(`width: ${widthPx}px`);
  }
  if (heightPx) {
    styleParts.push(`height: ${heightPx}px`);
  }

  // Apply float based on horizontal alignment
  // Wrap floated images in a container with clearfix to prevent float from
  // affecting subsequent content (Word anchored images don't bleed into next sections)
  let needsClearfix = false;
  if (anchor.hAlign === 'left') {
    styleParts.push('float: left');
    styleParts.push('margin-right: 10px');
    styleParts.push('margin-bottom: 10px');
    needsClearfix = true;
  } else if (anchor.hAlign === 'right') {
    styleParts.push('float: right');
    styleParts.push('margin-left: 10px');
    styleParts.push('margin-bottom: 10px');
    needsClearfix = true;
  } else if (anchor.hAlign === 'center') {
    styleParts.push('display: block');
    styleParts.push('margin-left: auto');
    styleParts.push('margin-right: auto');
  }

  // Build the img tag
  const imgTag = buildImgTag(dataUrl, altText, styleParts);

  // Wrap floated images in a clearfix container to contain the float
  if (needsClearfix) {
    return `<div style="overflow: hidden;">${imgTag}</div>`;
  }

  return imgTag;
}

/**
 * Extract the blip embed relationship ID from a graphic.
 */
export function getBlipEmbed(graphic: Graphic | null | undefined): string | undefined {
  if (!graphic) return undefined;

  if (!graphic.graphicData) return undefined;
  if (!graphic.graphicData.pic) return undefined;
  if (!graphic.graphicData.pic.blipFill) return undefined;
  if (!graphic.graphicData.pic.blipFill.blip) return undefined;

  return graphic.graphicData.pic.blipFill.blip.embed ?? undefined;
}

/**
 * Build an HTML img tag.
 */
export function buildImgTag(src: string, alt: string, styleParts: string[]): string {
  const attrs: string[] = [`src="${src}"`];

  if (alt) {
    attrs.push(`alt="${escapeHtml(alt)}"`);
  } else {
    attrs.push('alt=""');
  }

  if (styleParts.length > 0) {
    const style = styleParts.join('; ');
    attrs.push(`style="${style}"`);
  }

  return `<img ${attrs.join(' ')}>`;
}

/**
 * Converter class for converting images to HTML.
 */
export class ImageToHTMLConverter {
  private imageData: ImageData;

  constructor() {
    this.imageData = new Map();
  }

  /**
   * Set image data for conversion.
   */
  setImageData(imageData: ImageData): void {
    this.imageData = imageData;
  }

  /**
   * Convert a drawing to HTML.
   */
  convert(drawing: Drawing | null | undefined): string {
    return drawingToHtml(drawing, this.imageData);
  }

  /**
   * Convert an inline drawing to HTML.
   */
  convertInline(inline: InlineDrawing | null | undefined): string {
    return inlineDrawingToHtml(inline, this.imageData);
  }

  /**
   * Convert an anchor drawing to HTML.
   */
  convertAnchor(anchor: AnchorDrawing | null | undefined): string {
    return anchorDrawingToHtml(anchor, this.imageData);
  }
}
