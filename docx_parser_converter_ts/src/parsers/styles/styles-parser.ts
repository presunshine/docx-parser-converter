/**
 * Styles parser (root element).
 *
 * Matches Python: parsers/styles/styles_parser.py
 */

import type { Styles } from '../../models/styles/styles';
import type { Style } from '../../models/styles/style';
import { findChild, findAllChildren } from '../utils';
import { parseDocumentDefaults } from './document-defaults-parser';
import { parseLatentStyles } from './latent-styles-parser';
import { parseStyle } from './style-parser';

/**
 * Parse <w:styles> root element.
 *
 * @param element - The <w:styles> element or null
 * @returns Styles model or null if element is null
 */
export function parseStyles(element: Element | null): Styles | null {
  if (element === null) {
    return null;
  }

  // Parse document defaults
  const docDefaults = parseDocumentDefaults(findChild(element, 'docDefaults'));

  // Parse latent styles
  const latentStyles = parseLatentStyles(findChild(element, 'latentStyles'));

  // Parse style definitions
  const styles: Style[] = [];
  for (const styleElem of findAllChildren(element, 'style')) {
    const style = parseStyle(styleElem);
    if (style !== null) {
      styles.push(style);
    }
  }

  return {
    docDefaults: docDefaults ?? null,
    latentStyles: latentStyles ?? null,
    style: styles,
  };
}
