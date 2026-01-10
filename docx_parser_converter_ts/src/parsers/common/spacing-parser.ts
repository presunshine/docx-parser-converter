/**
 * Spacing parser.
 *
 * Matches Python: parsers/common/spacing_parser.py
 */

import type { Spacing } from '../../models/common/spacing';
import type { LineRuleType } from '../../models/types';
import { getAttribute, getIntAttribute, getBoolAttribute } from '../utils';

/**
 * Parse a spacing element.
 *
 * @param element - XML element (<w:spacing>)
 * @returns Spacing model or null
 */
export function parseSpacing(element: Element | null): Spacing | null {
  if (!element) {
    return null;
  }

  const before = getIntAttribute(element, 'before');
  const after = getIntAttribute(element, 'after');
  const line = getIntAttribute(element, 'line');
  const lineRule = getAttribute(element, 'lineRule');
  const beforeLines = getIntAttribute(element, 'beforeLines');
  const afterLines = getIntAttribute(element, 'afterLines');
  const beforeAutospacing = getBoolAttribute(element, 'beforeAutospacing');
  const afterAutospacing = getBoolAttribute(element, 'afterAutospacing');

  return {
    before: before ?? null,
    after: after ?? null,
    line: line ?? null,
    lineRule: (lineRule ?? null) as LineRuleType | null,
    beforeLines: beforeLines ?? null,
    afterLines: afterLines ?? null,
    beforeAutospacing: beforeAutospacing ?? null,
    afterAutospacing: afterAutospacing ?? null,
  };
}
