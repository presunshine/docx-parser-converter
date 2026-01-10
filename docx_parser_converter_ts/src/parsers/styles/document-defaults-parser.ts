/**
 * Document defaults parser.
 *
 * Matches Python: parsers/styles/document_defaults_parser.py
 */

import type {
  DocumentDefaults,
  ParagraphPropertiesDefault,
  RunPropertiesDefault,
} from '../../models/styles/document-defaults';
import type { RunProperties } from '../../models/document/run';
import type { ParagraphProperties } from '../../models/document/paragraph';
import { parseRunProperties } from '../document/run-properties-parser';
import { parseParagraphProperties } from '../document/paragraph-properties-parser';
import { findChild } from '../utils';

/**
 * Remove null values from an object (shallow).
 */
function removeNulls<T>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Parse <w:rPrDefault> element.
 *
 * @param element - The <w:rPrDefault> element or null
 * @returns RunPropertiesDefault model or null if element is null
 */
export function parseRunPropertiesDefault(element: Element | null): RunPropertiesDefault | null {
  if (element === null) {
    return null;
  }

  const rPrElem = findChild(element, 'rPr');
  let rPr: Partial<RunProperties> | null = null;
  if (rPrElem !== null) {
    const parsedRPr = parseRunProperties(rPrElem);
    if (parsedRPr !== null) {
      rPr = removeNulls(parsedRPr) as Partial<RunProperties>;
    }
  }

  return {
    rPr: rPr ?? null,
  };
}

/**
 * Parse <w:pPrDefault> element.
 *
 * @param element - The <w:pPrDefault> element or null
 * @returns ParagraphPropertiesDefault model or null if element is null
 */
export function parseParagraphPropertiesDefault(
  element: Element | null
): ParagraphPropertiesDefault | null {
  if (element === null) {
    return null;
  }

  const pPrElem = findChild(element, 'pPr');
  let pPr: Partial<ParagraphProperties> | null = null;
  if (pPrElem !== null) {
    const parsedPPr = parseParagraphProperties(pPrElem);
    if (parsedPPr !== null) {
      pPr = removeNulls(parsedPPr) as Partial<ParagraphProperties>;
    }
  }

  return {
    pPr: pPr ?? null,
  };
}

/**
 * Parse <w:docDefaults> element.
 *
 * @param element - The <w:docDefaults> element or null
 * @returns DocumentDefaults model or null if element is null
 */
export function parseDocumentDefaults(element: Element | null): DocumentDefaults | null {
  if (element === null) {
    return null;
  }

  const rPrDefault = parseRunPropertiesDefault(findChild(element, 'rPrDefault'));
  const pPrDefault = parseParagraphPropertiesDefault(findChild(element, 'pPrDefault'));

  return {
    rPrDefault: rPrDefault ?? null,
    pPrDefault: pPrDefault ?? null,
  };
}
