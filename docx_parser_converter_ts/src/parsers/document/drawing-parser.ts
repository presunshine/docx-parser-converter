/**
 * Parsers for drawing elements (images, shapes).
 *
 * These are elements that appear inside a run as <w:drawing>.
 *
 * Matches Python: parsers/document/drawing_parser.py
 */

import type { Drawing, InlineDrawing, AnchorDrawing, DrawingExtent, DrawingProperties, Graphic, GraphicData, Picture, BlipFill, Blip, ShapeProperties } from '../../models/document/drawing';
import { getTextContent, iterChildren, getLocalName } from '../utils';

// Namespace prefixes
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/**
 * Find a child element by local name (namespace-agnostic).
 */
function findChildByLocalName(element: Element, localName: string): Element | null {
  for (const child of iterChildren(element)) {
    if (getLocalName(child) === localName) {
      return child;
    }
  }
  return null;
}

/**
 * Parse <wp:extent> or <a:ext> element.
 *
 * @param element - The extent element or null
 * @returns DrawingExtent model or null
 */
export function parseExtent(element: Element | null): DrawingExtent | null {
  if (element === null) {
    return null;
  }

  const cxStr = element.getAttribute('cx');
  const cyStr = element.getAttribute('cy');

  return {
    cx: cxStr ? parseInt(cxStr, 10) : null,
    cy: cyStr ? parseInt(cyStr, 10) : null,
  };
}

/**
 * Parse <wp:docPr> element.
 *
 * @param element - The <wp:docPr> element or null
 * @returns DrawingProperties model or null
 */
export function parseDocPr(element: Element | null): DrawingProperties | null {
  if (element === null) {
    return null;
  }

  const idStr = element.getAttribute('id');
  const name = element.getAttribute('name');
  const descr = element.getAttribute('descr');

  return {
    id: idStr ? parseInt(idStr, 10) : null,
    name: name || null,
    descr: descr || null,
  };
}

/**
 * Parse <a:blip> element.
 *
 * @param element - The <a:blip> element or null
 * @returns Blip model or null
 */
export function parseBlip(element: Element | null): Blip | null {
  if (element === null) {
    return null;
  }

  // r:embed attribute uses the relationship namespace
  const embed = element.getAttributeNS(R_NS, 'embed');

  return {
    embed: embed || null,
  };
}

/**
 * Parse <pic:blipFill> element.
 *
 * @param element - The <pic:blipFill> element or null
 * @returns BlipFill model or null
 */
export function parseBlipFill(element: Element | null): BlipFill | null {
  if (element === null) {
    return null;
  }

  const blipElem = findChildByLocalName(element, 'blip');
  const blip = parseBlip(blipElem);

  return {
    blip: blip,
  };
}

/**
 * Parse <pic:spPr> element.
 *
 * @param element - The <pic:spPr> element or null
 * @returns ShapeProperties model or null
 */
export function parseShapeProperties(element: Element | null): ShapeProperties | null {
  if (element === null) {
    return null;
  }

  // Look for transform with extent
  const xfrm = findChildByLocalName(element, 'xfrm');
  let extent: DrawingExtent | null = null;
  if (xfrm !== null) {
    const extElem = findChildByLocalName(xfrm, 'ext');
    extent = parseExtent(extElem);
  }

  return {
    extent: extent,
  };
}

/**
 * Parse <pic:pic> element.
 *
 * @param element - The <pic:pic> element or null
 * @returns Picture model or null
 */
export function parsePicture(element: Element | null): Picture | null {
  if (element === null) {
    return null;
  }

  const blipFillElem = findChildByLocalName(element, 'blipFill');
  const blipFill = parseBlipFill(blipFillElem);

  const spPrElem = findChildByLocalName(element, 'spPr');
  const spPr = parseShapeProperties(spPrElem);

  return {
    blipFill: blipFill,
    spPr: spPr,
  };
}

/**
 * Parse <a:graphicData> element.
 *
 * @param element - The <a:graphicData> element or null
 * @returns GraphicData model or null
 */
export function parseGraphicData(element: Element | null): GraphicData | null {
  if (element === null) {
    return null;
  }

  const uri = element.getAttribute('uri');

  // Look for picture element
  const picElem = findChildByLocalName(element, 'pic');
  const pic = parsePicture(picElem);

  return {
    uri: uri || null,
    pic: pic,
  };
}

/**
 * Parse <a:graphic> element.
 *
 * @param element - The <a:graphic> element or null
 * @returns Graphic model or null
 */
export function parseGraphic(element: Element | null): Graphic | null {
  if (element === null) {
    return null;
  }

  const graphicDataElem = findChildByLocalName(element, 'graphicData');
  const graphicData = parseGraphicData(graphicDataElem);

  return {
    graphicData: graphicData,
  };
}

/**
 * Parse <wp:inline> element.
 *
 * @param element - The <wp:inline> element or null
 * @returns InlineDrawing model or null
 */
export function parseInlineDrawing(element: Element | null): InlineDrawing | null {
  if (element === null) {
    return null;
  }

  const extentElem = findChildByLocalName(element, 'extent');
  const extent = parseExtent(extentElem);

  const docPrElem = findChildByLocalName(element, 'docPr');
  const docPr = parseDocPr(docPrElem);

  const graphicElem = findChildByLocalName(element, 'graphic');
  const graphic = parseGraphic(graphicElem);

  return {
    extent: extent,
    docPr: docPr,
    graphic: graphic,
  };
}

/**
 * Parse <wp:anchor> element.
 *
 * @param element - The <wp:anchor> element or null
 * @returns AnchorDrawing model or null
 */
export function parseAnchorDrawing(element: Element | null): AnchorDrawing | null {
  if (element === null) {
    return null;
  }

  const extentElem = findChildByLocalName(element, 'extent');
  const extent = parseExtent(extentElem);

  const docPrElem = findChildByLocalName(element, 'docPr');
  const docPr = parseDocPr(docPrElem);

  const graphicElem = findChildByLocalName(element, 'graphic');
  const graphic = parseGraphic(graphicElem);

  // Parse horizontal alignment
  let hAlign: string | null = null;
  const posH = findChildByLocalName(element, 'positionH');
  if (posH !== null) {
    const alignElem = findChildByLocalName(posH, 'align');
    if (alignElem !== null) {
      const text = getTextContent(alignElem);
      if (text) {
        hAlign = text;
      }
    }
  }

  // Parse vertical alignment
  let vAlign: string | null = null;
  const posV = findChildByLocalName(element, 'positionV');
  if (posV !== null) {
    const alignElem = findChildByLocalName(posV, 'align');
    if (alignElem !== null) {
      const text = getTextContent(alignElem);
      if (text) {
        vAlign = text;
      }
    }
  }

  // Parse wrap type
  let wrapType: string | null = null;
  const wrapNames = ['wrapSquare', 'wrapTight', 'wrapThrough', 'wrapTopAndBottom', 'wrapNone'];
  for (const wrapName of wrapNames) {
    const wrapElem = findChildByLocalName(element, wrapName);
    if (wrapElem !== null) {
      wrapType = wrapName.replace('wrap', '').toLowerCase();
      break;
    }
  }

  // Parse behindDoc attribute
  const behindDocStr = element.getAttribute('behindDoc');
  let behindDoc: boolean | null = null;
  if (behindDocStr !== null) {
    behindDoc = behindDocStr === '1';
  }

  return {
    extent: extent,
    docPr: docPr,
    graphic: graphic,
    hAlign: hAlign,
    vAlign: vAlign,
    wrapType: wrapType,
    behindDoc: behindDoc,
  };
}

/**
 * Parse <w:drawing> element.
 *
 * @param element - The <w:drawing> element or null
 * @returns Drawing model or null
 */
export function parseDrawing(element: Element | null): Drawing | null {
  if (element === null) {
    return null;
  }

  // Check for inline image
  const inlineElem = findChildByLocalName(element, 'inline');
  const inline = parseInlineDrawing(inlineElem);

  // Check for anchored image
  const anchorElem = findChildByLocalName(element, 'anchor');
  const anchor = parseAnchorDrawing(anchorElem);

  return {
    inline: inline,
    anchor: anchor,
  };
}
