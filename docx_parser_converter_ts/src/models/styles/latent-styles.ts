/**
 * Latent styles model definitions.
 *
 * Latent styles are built-in styles that are hidden until used.
 */

/**
 * Exception to default latent style settings.
 *
 * XML Element: <w:lsdException>
 */
export interface LatentStyleException {
  /** Style name */
  name?: string | null;
  /** Whether style is locked */
  locked?: boolean | null;
  /** UI sort priority */
  uiPriority?: number | null;
  /** Semi-hidden from UI */
  semiHidden?: boolean | null;
  /** Show when used */
  unhideWhenUsed?: boolean | null;
  /** Show in Quick Styles gallery */
  qFormat?: boolean | null;
}

/**
 * Latent styles container with defaults.
 *
 * XML Element: <w:latentStyles>
 */
export interface LatentStyles {
  /** Default locked state */
  defLockedState?: boolean | null;
  /** Default UI priority */
  defUIPriority?: number | null;
  /** Default semi-hidden state */
  defSemiHidden?: boolean | null;
  /** Default unhide when used */
  defUnhideWhenUsed?: boolean | null;
  /** Default quick format */
  defQFormat?: boolean | null;
  /** Number of latent styles */
  count?: number | null;
  /** List of style exceptions */
  lsdException?: LatentStyleException[] | null;
}
