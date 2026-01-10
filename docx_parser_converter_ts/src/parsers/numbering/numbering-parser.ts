/**
 * Numbering parser (root element).
 *
 * Matches Python: parsers/numbering/numbering_parser.py
 */

import type { Numbering } from '../../models/numbering/numbering';
import type { AbstractNumbering } from '../../models/numbering/abstract-numbering';
import type { NumberingInstance } from '../../models/numbering/numbering-instance';
import { parseAbstractNumbering } from './abstract-numbering-parser';
import { parseNumberingInstance } from './numbering-instance-parser';
import { findAllChildren } from '../utils';

/**
 * Parse <w:numbering> root element.
 *
 * @param element - The <w:numbering> element or null
 * @returns Numbering model or null if element is null
 */
export function parseNumbering(element: Element | null): Numbering | null {
  if (element === null) {
    return null;
  }

  // Parse abstract numbering definitions
  const abstractNums: AbstractNumbering[] = [];
  for (const abstractElem of findAllChildren(element, 'abstractNum')) {
    const abstractNum = parseAbstractNumbering(abstractElem);
    if (abstractNum !== null) {
      abstractNums.push(abstractNum);
    }
  }

  // Parse numbering instances
  const nums: NumberingInstance[] = [];
  for (const numElem of findAllChildren(element, 'num')) {
    const num = parseNumberingInstance(numElem);
    if (num !== null) {
      nums.push(num);
    }
  }

  return {
    abstractNum: abstractNums,
    num: nums,
  };
}
