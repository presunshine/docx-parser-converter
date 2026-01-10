/**
 * Latent styles parser.
 *
 * Matches Python: parsers/styles/latent_styles_parser.py
 */

import type { LatentStyleException, LatentStyles } from '../../models/styles/latent-styles';
import { getAttribute, getIntAttribute, findAllChildren } from '../utils';

/**
 * Parse a latent style exception element.
 *
 * @param element - XML element (<w:lsdException>)
 * @returns LatentStyleException model or null
 */
export function parseLatentStyleException(element: Element | null): LatentStyleException | null {
  if (!element) {
    return null;
  }

  const name = getAttribute(element, 'name');
  if (!name) {
    return null;
  }

  // Parse toggle-style attributes - presence means true
  const locked = getAttribute(element, 'locked') !== null ? true : null;
  const uiPriority = getIntAttribute(element, 'uiPriority');
  const semiHidden = getAttribute(element, 'semiHidden') !== null ? true : null;
  const unhideWhenUsed = getAttribute(element, 'unhideWhenUsed') !== null ? true : null;
  const qFormat = getAttribute(element, 'qFormat') !== null ? true : null;

  return {
    name,
    locked,
    uiPriority: uiPriority ?? null,
    semiHidden,
    unhideWhenUsed,
    qFormat,
  };
}

/**
 * Parse a latent styles element.
 *
 * @param element - XML element (<w:latentStyles>)
 * @returns LatentStyles model or null
 */
export function parseLatentStyles(element: Element | null): LatentStyles | null {
  if (!element) {
    return null;
  }

  // Parse default values - presence means true
  const defLockedState = getAttribute(element, 'defLockedState') !== null ? true : null;
  const defUiPriority = getIntAttribute(element, 'defUIPriority');
  const defSemiHidden = getAttribute(element, 'defSemiHidden') !== null ? true : null;
  const defUnhideWhenUsed = getAttribute(element, 'defUnhideWhenUsed') !== null ? true : null;
  const defQFormat = getAttribute(element, 'defQFormat') !== null ? true : null;
  const count = getIntAttribute(element, 'count');

  const exceptions = findAllChildren(element, 'lsdException');
  const lsdException: LatentStyleException[] = [];
  for (const exc of exceptions) {
    const parsed = parseLatentStyleException(exc);
    if (parsed) {
      lsdException.push(parsed);
    }
  }

  return {
    defLockedState,
    defUIPriority: defUiPriority ?? null,
    defSemiHidden,
    defUnhideWhenUsed,
    defQFormat,
    count: count ?? null,
    lsdException,
  };
}
