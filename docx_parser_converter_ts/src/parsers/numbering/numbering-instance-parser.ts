/**
 * Numbering instance parser.
 *
 * Matches Python: parsers/numbering/numbering_instance_parser.py
 */

import type { LevelOverride } from '../../models/numbering/level-override';
import type { NumberingInstance } from '../../models/numbering/numbering-instance';
import { parseLevel } from './level-parser';
import {
  getIntAttribute,
  findChild,
  findAllChildren,
} from '../utils';

/**
 * Parse <w:lvlOverride> element.
 *
 * @param element - The <w:lvlOverride> element or null
 * @returns LevelOverride model or null if element is null or invalid
 */
export function parseLevelOverride(element: Element | null): LevelOverride | null {
  if (element === null) {
    return null;
  }

  // Required: level index
  const ilvl = getIntAttribute(element, 'ilvl');
  if (ilvl === null) {
    return null;
  }

  // Start override
  const startOverrideElem = findChild(element, 'startOverride');
  const startOverride = startOverrideElem !== null ? getIntAttribute(startOverrideElem, 'val') : null;

  // Level override (full level replacement)
  const lvl = parseLevel(findChild(element, 'lvl'));

  return {
    ilvl,
    startOverride: startOverride ?? null,
    lvl: lvl ?? null,
  };
}

/**
 * Parse <w:num> element.
 *
 * @param element - The <w:num> element or null
 * @returns NumberingInstance model or null if element is null or invalid
 */
export function parseNumberingInstance(element: Element | null): NumberingInstance | null {
  if (element === null) {
    return null;
  }

  // Required: numbering ID
  const numId = getIntAttribute(element, 'numId');
  if (numId === null) {
    return null;
  }

  // Reference to abstract numbering
  const abstractNumIdElem = findChild(element, 'abstractNumId');
  const abstractNumId = abstractNumIdElem !== null ? getIntAttribute(abstractNumIdElem, 'val') : null;

  // Level overrides
  let lvlOverrides: LevelOverride[] | null = null;
  const overrideElements = findAllChildren(element, 'lvlOverride');
  if (overrideElements.length > 0) {
    lvlOverrides = [];
    for (const overrideElem of overrideElements) {
      const override = parseLevelOverride(overrideElem);
      if (override !== null) {
        lvlOverrides.push(override);
      }
    }
  }

  return {
    numId,
    abstractNumId: abstractNumId ?? null,
    lvlOverride: lvlOverrides ?? null,
  };
}
