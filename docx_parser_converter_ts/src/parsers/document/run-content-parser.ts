/**
 * Run content parser.
 *
 * Matches Python: parsers/document/run_content_parser.py
 */

import type { RunContentItem } from '../../models/document/run-content';
import type { BreakType, BreakClearType, FieldCharType } from '../../models/types';
import {
  getAttribute,
  getAttributeAnyNs,
  getIntAttribute,
  getTextContent,
  getLocalName,
} from '../utils';
import { parseDrawing } from './drawing-parser';

/**
 * Parse <w:t> text element.
 *
 * @param element - The <w:t> element or null
 * @returns Text content item or null
 */
export function parseText(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const value = getTextContent(element) ?? '';
  const space = getAttributeAnyNs(element, 'space');

  return {
    type: 'text',
    value,
    space: space ?? null,
  };
}

/**
 * Parse <w:br> break element.
 *
 * @param element - The <w:br> element or null
 * @returns Break content item or null
 */
export function parseBreak(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const breakType = getAttribute(element, 'type');
  const clear = getAttribute(element, 'clear');

  return {
    type: 'break',
    breakType: (breakType ?? null) as BreakType | null,
    clear: (clear ?? null) as BreakClearType | null,
  };
}

/**
 * Parse <w:tab> tab character element.
 *
 * @param element - The <w:tab> element or null
 * @returns Tab content item or null
 */
export function parseTabChar(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  return {
    type: 'tab',
  };
}

/**
 * Parse <w:cr> carriage return element.
 *
 * @param element - The <w:cr> element or null
 * @returns Carriage return content item or null
 */
export function parseCarriageReturn(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  return {
    type: 'cr',
  };
}

/**
 * Parse <w:softHyphen> element.
 *
 * @param element - The <w:softHyphen> element or null
 * @returns Soft hyphen content item or null
 */
export function parseSoftHyphen(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  return {
    type: 'softHyphen',
  };
}

/**
 * Parse <w:noBreakHyphen> element.
 *
 * @param element - The <w:noBreakHyphen> element or null
 * @returns No-break hyphen content item or null
 */
export function parseNoBreakHyphen(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  return {
    type: 'noBreakHyphen',
  };
}

/**
 * Parse <w:sym> symbol element.
 *
 * @param element - The <w:sym> element or null
 * @returns Symbol content item or null
 */
export function parseSymbol(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const font = getAttribute(element, 'font');
  const char = getAttribute(element, 'char');

  return {
    type: 'symbol',
    font: font ?? null,
    char: char ?? null,
  };
}

/**
 * Parse <w:fldChar> field character element.
 *
 * @param element - The <w:fldChar> element or null
 * @returns Field character content item or null
 */
export function parseFieldChar(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const fldCharType = getAttribute(element, 'fldCharType');

  return {
    type: 'fieldChar',
    fldCharType: (fldCharType as FieldCharType) ?? null,
  };
}

/**
 * Parse <w:instrText> instruction text element.
 *
 * @param element - The <w:instrText> element or null
 * @returns Instruction text content item or null
 */
export function parseInstrText(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const value = getTextContent(element) ?? '';
  const space = getAttributeAnyNs(element, 'space');

  return {
    type: 'instrText',
    value,
    space: space ?? null,
  };
}

/**
 * Parse <w:footnoteReference> element.
 *
 * @param element - The <w:footnoteReference> element or null
 * @returns Footnote reference content item or null
 */
export function parseFootnoteReference(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const id = getIntAttribute(element, 'id');

  return {
    type: 'footnoteRef',
    id: id ?? null,
  };
}

/**
 * Parse <w:endnoteReference> element.
 *
 * @param element - The <w:endnoteReference> element or null
 * @returns Endnote reference content item or null
 */
export function parseEndnoteReference(element: Element | null): RunContentItem | null {
  if (element === null) {
    return null;
  }

  const id = getIntAttribute(element, 'id');

  return {
    type: 'endnoteRef',
    id: id ?? null,
  };
}

/**
 * Parse any run content item.
 *
 * @param element - The content element
 * @returns Run content item or null
 */
export function parseRunContentItem(element: Element): RunContentItem | null {
  const localName = getLocalName(element);

  switch (localName) {
    case 't':
      return parseText(element);
    case 'br':
      return parseBreak(element);
    case 'tab':
      return parseTabChar(element);
    case 'cr':
      return parseCarriageReturn(element);
    case 'softHyphen':
      return parseSoftHyphen(element);
    case 'noBreakHyphen':
      return parseNoBreakHyphen(element);
    case 'sym':
      return parseSymbol(element);
    case 'fldChar':
      return parseFieldChar(element);
    case 'instrText':
      return parseInstrText(element);
    case 'footnoteReference':
      return parseFootnoteReference(element);
    case 'endnoteReference':
      return parseEndnoteReference(element);
    case 'drawing': {
      const drawing = parseDrawing(element);
      if (drawing === null) {
        return null;
      }
      return {
        type: 'drawing',
        drawing,
      };
    }
    default:
      return null;
  }
}
