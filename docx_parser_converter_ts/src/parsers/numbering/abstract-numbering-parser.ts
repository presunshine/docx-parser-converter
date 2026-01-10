/**
 * Abstract numbering parser.
 *
 * Matches Python: parsers/numbering/abstract_numbering_parser.py
 */

import type { AbstractNumbering } from '../../models/numbering/abstract-numbering';
import type { Level } from '../../models/numbering/level';
import type { MultiLevelType } from '../../models/types';
import { parseLevel } from './level-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  findAllChildren,
} from '../utils';

/**
 * Parse <w:abstractNum> element.
 *
 * @param element - The <w:abstractNum> element or null
 * @returns AbstractNumbering model or null if element is null or invalid
 */
export function parseAbstractNumbering(element: Element | null): AbstractNumbering | null {
  if (element === null) {
    return null;
  }

  // Required: abstract numbering ID
  const abstractNumId = getIntAttribute(element, 'abstractNumId');
  if (abstractNumId === null) {
    return null;
  }

  // NSID (number scheme ID)
  const nsidElem = findChild(element, 'nsid');
  const nsid = nsidElem !== null ? getAttribute(nsidElem, 'val') : null;

  // Multi-level type
  const multiLevelTypeElem = findChild(element, 'multiLevelType');
  const multiLevelType = multiLevelTypeElem !== null ? getAttribute(multiLevelTypeElem, 'val') : null;

  // Template ID
  const tmplElem = findChild(element, 'tmpl');
  const tmpl = tmplElem !== null ? getAttribute(tmplElem, 'val') : null;

  // Name
  const nameElem = findChild(element, 'name');
  const name = nameElem !== null ? getAttribute(nameElem, 'val') : null;

  // Style link (link to numbering style)
  const styleLinkElem = findChild(element, 'styleLink');
  const styleLink = styleLinkElem !== null ? getAttribute(styleLinkElem, 'val') : null;

  // Numbering style link (link from style)
  const numStyleLinkElem = findChild(element, 'numStyleLink');
  const numStyleLink = numStyleLinkElem !== null ? getAttribute(numStyleLinkElem, 'val') : null;

  // Parse levels
  const levels: Level[] = [];
  for (const lvlElem of findAllChildren(element, 'lvl')) {
    const level = parseLevel(lvlElem);
    if (level !== null) {
      levels.push(level);
    }
  }

  return {
    abstractNumId,
    nsid: nsid ?? null,
    multiLevelType: (multiLevelType as MultiLevelType) ?? null,
    tmpl: tmpl ?? null,
    name: name ?? null,
    styleLink: styleLink ?? null,
    numStyleLink: numStyleLink ?? null,
    lvl: levels,
  };
}
