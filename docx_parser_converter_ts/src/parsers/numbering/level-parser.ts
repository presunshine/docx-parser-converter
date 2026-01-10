/**
 * Level parser.
 *
 * Matches Python: parsers/numbering/level_parser.py
 */

import type { Level } from '../../models/numbering/level';
import type { Indentation } from '../../models/common/indentation';
import type { RunProperties } from '../../models/document/run';
import type { ParagraphProperties } from '../../models/document/paragraph';
import type { NumFmtType, LevelSuffixType, JustificationType } from '../../models/types';
import { parseIndentation } from '../common/indentation-parser';
import { parseRunProperties } from '../document/run-properties-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  parseToggle,
} from '../utils';

/**
 * Remove null values from an object (shallow).
 */
function removeNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

/**
 * Parse <w:lvl> element.
 *
 * @param element - The <w:lvl> element or null
 * @returns Level model or null if element is null or invalid
 */
export function parseLevel(element: Element | null): Level | null {
  if (element === null) {
    return null;
  }

  // Required: level index
  const ilvl = getIntAttribute(element, 'ilvl');
  if (ilvl === null) {
    return null;
  }

  // Template code
  const tplc = getAttribute(element, 'tplc');

  // Tentative
  const tentative = parseToggle(findChild(element, 'tentative'));

  // Start value
  const startElem = findChild(element, 'start');
  const start = startElem !== null ? getIntAttribute(startElem, 'val') : null;

  // Number format
  const numFmtElem = findChild(element, 'numFmt');
  const numFmt = numFmtElem !== null ? getAttribute(numFmtElem, 'val') : null;

  // Level restart
  const lvlRestartElem = findChild(element, 'lvlRestart');
  const lvlRestart = lvlRestartElem !== null ? getIntAttribute(lvlRestartElem, 'val') : null;

  // Associated paragraph style
  const pStyleElem = findChild(element, 'pStyle');
  const pStyle = pStyleElem !== null ? getAttribute(pStyleElem, 'val') : null;

  // Legal numbering style
  const isLgl = parseToggle(findChild(element, 'isLgl'));

  // Suffix (tab, space, nothing)
  const suffElem = findChild(element, 'suff');
  const suff = suffElem !== null ? getAttribute(suffElem, 'val') : null;

  // Level text template
  const lvlTextElem = findChild(element, 'lvlText');
  const lvlText = lvlTextElem !== null ? getAttribute(lvlTextElem, 'val') : null;

  // Picture bullet ID
  const lvlPicBulletIdElem = findChild(element, 'lvlPicBulletId');
  const lvlPicBulletId = lvlPicBulletIdElem !== null ? getIntAttribute(lvlPicBulletIdElem, 'val') : null;

  // Level justification
  const lvlJcElem = findChild(element, 'lvlJc');
  const lvlJc = lvlJcElem !== null ? getAttribute(lvlJcElem, 'val') : null;

  // Paragraph properties (mainly for indentation)
  const pPrElem = findChild(element, 'pPr');
  let pPr: ParagraphProperties | null = null;
  if (pPrElem !== null) {
    const ind = parseIndentation(findChild(pPrElem, 'ind'));
    if (ind !== null) {
      // Store indentation as ind property of pPr
      pPr = { ind: removeNulls(ind as unknown as Record<string, unknown>) as unknown as Indentation } as ParagraphProperties;
    }
  }

  // Run properties (for bullet/number formatting)
  const rPrElem = findChild(element, 'rPr');
  let rPr: RunProperties | null = null;
  if (rPrElem !== null) {
    const parsedRPr = parseRunProperties(rPrElem);
    if (parsedRPr !== null) {
      rPr = removeNulls(parsedRPr as unknown as Record<string, unknown>) as unknown as RunProperties;
    }
  }

  return {
    ilvl,
    tplc: tplc ?? null,
    tentative: tentative ?? null,
    start: start ?? null,
    numFmt: (numFmt as NumFmtType) ?? null,
    lvlRestart: lvlRestart ?? null,
    pStyle: pStyle ?? null,
    isLgl: isLgl ?? null,
    suff: (suff as LevelSuffixType) ?? null,
    lvlText: lvlText ?? null,
    lvlPicBulletId: lvlPicBulletId ?? null,
    lvlJc: (lvlJc as JustificationType) ?? null,
    pPr: pPr ?? null,
    rPr: rPr ?? null,
  };
}
