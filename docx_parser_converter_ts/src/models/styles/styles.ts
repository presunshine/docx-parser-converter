/**
 * Styles root model definitions.
 *
 * The Styles model is the root container for all style definitions.
 */

import type { DocumentDefaults } from './document-defaults';
import type { LatentStyles } from './latent-styles';
import type { Style } from './style';

/**
 * Root container for all style definitions.
 *
 * XML Element: <w:styles>
 */
export interface Styles {
  /** Document defaults (base formatting) */
  docDefaults?: DocumentDefaults | null;
  /** Latent styles settings */
  latentStyles?: LatentStyles | null;
  /** List of style definitions */
  style?: Style[] | null;
}
