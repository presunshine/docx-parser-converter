/**
 * Hyperlink model definition.
 *
 * Represents a hyperlink in the document.
 */

import type { Run } from './run';

/**
 * A hyperlink in the document.
 *
 * Can link to external URLs or internal bookmarks.
 */
export interface Hyperlink {
  type: 'hyperlink';
  /** Relationship ID for external URL */
  rId?: string | null;
  /** Bookmark name for internal links */
  anchor?: string | null;
  /** Tooltip text */
  tooltip?: string | null;
  /** Hyperlink content (runs of text) */
  content: Run[];
}
