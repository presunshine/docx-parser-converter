/**
 * Indentation parser.
 *
 * Matches Python: parsers/common/indentation_parser.py
 */

import type { Indentation } from '../../models/common/indentation';
import { getIntAttribute } from '../utils';

/**
 * Parse an indentation element.
 *
 * @param element - XML element (<w:ind>)
 * @returns Indentation model or null
 */
export function parseIndentation(element: Element | null): Indentation | null {
  if (!element) {
    return null;
  }

  const left = getIntAttribute(element, 'left');
  const right = getIntAttribute(element, 'right');
  const start = getIntAttribute(element, 'start');
  const end = getIntAttribute(element, 'end');
  const firstLine = getIntAttribute(element, 'firstLine');
  const hanging = getIntAttribute(element, 'hanging');
  const startChars = getIntAttribute(element, 'startChars');
  const endChars = getIntAttribute(element, 'endChars');
  const firstLineChars = getIntAttribute(element, 'firstLineChars');
  const hangingChars = getIntAttribute(element, 'hangingChars');

  return {
    left: left ?? null,
    right: right ?? null,
    start: start ?? null,
    end: end ?? null,
    firstLine: firstLine ?? null,
    hanging: hanging ?? null,
    startChars: startChars ?? null,
    endChars: endChars ?? null,
    firstLineChars: firstLineChars ?? null,
    hangingChars: hangingChars ?? null,
  };
}
