/**
 * Centralized mapper for routing XML tags to parsers.
 *
 * Provides a ParserMapper class that routes XML elements to their
 * appropriate parser functions. Useful for parsing mixed content where
 * multiple element types can appear (e.g., run children, body children).
 *
 * Matches Python: parsers/mapper.py
 */

import { WORD_NS } from '../core/constants';
import { getLocalName } from './utils';

// Import parsers for factory functions
// These are imported at module level to avoid require() calls
import {
  parseText,
  parseBreak,
  parseTabChar,
  parseCarriageReturn,
  parseSoftHyphen,
  parseNoBreakHyphen,
  parseSymbol,
  parseFieldChar,
  parseInstrText,
  parseFootnoteReference,
  parseEndnoteReference,
} from './document/run-content-parser';
import { parseParagraph } from './document/paragraph-parser';
import { parseTable } from './document/table-parser';
import { parseSectionProperties } from './document/section-parser';
import { parseRun } from './document/run-parser';
import {
  parseHyperlink,
  parseBookmarkStart,
  parseBookmarkEnd,
} from './document/hyperlink-parser';

// Type alias for parser functions
type ParserFunc<T> = (element: Element) => T | null;

/**
 * Maps XML tag names to their parser functions.
 *
 * Use for mixed content parsing where multiple element types
 * can appear (e.g., run children, body children).
 */
export class ParserMapper<T = unknown> {
  private _parsers: Map<string, ParserFunc<T>> = new Map();

  /**
   * Register a parser for a tag name.
   *
   * @param tagName - Tag name without namespace prefix (e.g., "t", "br", "tab")
   * @param parser - Parser function that takes Element and returns model or null
   */
  register(tagName: string, parser: ParserFunc<T>): void {
    const fullTag = `${WORD_NS}${tagName}`;
    this._parsers.set(fullTag, parser);
  }

  /**
   * Register a parser with a custom namespace.
   *
   * @param namespace - Full namespace with curly braces (e.g., "{http://...}")
   * @param tagName - Tag name without namespace prefix
   * @param parser - Parser function that takes Element and returns model or null
   */
  registerWithNamespace(namespace: string, tagName: string, parser: ParserFunc<T>): void {
    const fullTag = `${namespace}${tagName}`;
    this._parsers.set(fullTag, parser);
  }

  /**
   * Get parser for an element.
   *
   * @param element - XML element to find parser for
   * @returns Parser function or undefined if not registered
   */
  getParser(element: Element): ParserFunc<T> | undefined {
    // Build the full tag name with namespace
    const ns = element.namespaceURI;
    const localName = getLocalName(element);
    const fullTag = ns ? `{${ns}}${localName}` : localName;
    return this._parsers.get(fullTag);
  }

  /**
   * Parse element using registered parser.
   *
   * @param element - XML element to parse
   * @returns Parsed model or null if no parser registered
   */
  parse(element: Element): T | null {
    const parser = this.getParser(element);
    if (parser === undefined) {
      return null;
    }
    return parser(element);
  }

  /**
   * Check if a tag has a registered parser.
   *
   * @param tagName - Tag name without namespace prefix
   * @returns True if the tag has a registered parser
   */
  isRegistered(tagName: string): boolean {
    const fullTag = `${WORD_NS}${tagName}`;
    return this._parsers.has(fullTag);
  }

  /**
   * Get list of registered tag names (without namespace).
   *
   * @returns List of tag names that have registered parsers
   */
  get registeredTags(): string[] {
    const prefixLen = WORD_NS.length;
    return Array.from(this._parsers.keys()).map((tag) =>
      tag.startsWith(WORD_NS) ? tag.slice(prefixLen) : tag
    );
  }

  /**
   * Return the number of registered parsers.
   */
  get size(): number {
    return this._parsers.size;
  }

  /**
   * Check if a tag is registered (for use with 'in' operator alternative).
   */
  has(tagName: string): boolean {
    return this.isRegistered(tagName);
  }
}

// =============================================================================
// Pre-configured Mapper Factory Functions
// =============================================================================
// These functions create mappers with parsers pre-registered for common use cases.

/**
 * Create mapper for run content elements (<w:r> children).
 *
 * Maps elements that can appear inside a run:
 * - w:t (text)
 * - w:br (break)
 * - w:tab (tab character)
 * - w:cr (carriage return)
 * - w:softHyphen
 * - w:noBreakHyphen
 * - w:sym (symbol)
 * - w:fldChar (field character)
 * - w:instrText (field instruction)
 * - w:footnoteReference
 * - w:endnoteReference
 *
 * @returns ParserMapper configured for run content elements
 */
export function createRunContentMapper(): ParserMapper {
  const mapper = new ParserMapper();
  mapper.register('t', parseText);
  mapper.register('br', parseBreak);
  mapper.register('tab', parseTabChar);
  mapper.register('cr', parseCarriageReturn);
  mapper.register('softHyphen', parseSoftHyphen);
  mapper.register('noBreakHyphen', parseNoBreakHyphen);
  mapper.register('sym', parseSymbol);
  mapper.register('fldChar', parseFieldChar);
  mapper.register('instrText', parseInstrText);
  mapper.register('footnoteReference', parseFootnoteReference);
  mapper.register('endnoteReference', parseEndnoteReference);
  return mapper;
}

/**
 * Create mapper for body content elements (<w:body> children).
 *
 * Maps elements that can appear in the document body:
 * - w:p (paragraph)
 * - w:tbl (table)
 * - w:sectPr (section properties)
 *
 * @returns ParserMapper configured for body content elements
 */
export function createBodyContentMapper(): ParserMapper {
  const mapper = new ParserMapper();
  mapper.register('p', parseParagraph);
  mapper.register('tbl', parseTable);
  mapper.register('sectPr', parseSectionProperties);
  return mapper;
}

/**
 * Create mapper for paragraph content elements (<w:p> children).
 *
 * Maps elements that can appear inside a paragraph:
 * - w:r (run)
 * - w:hyperlink
 * - w:bookmarkStart
 * - w:bookmarkEnd
 *
 * @returns ParserMapper configured for paragraph content elements
 */
export function createParagraphContentMapper(): ParserMapper {
  const mapper = new ParserMapper();
  mapper.register('r', parseRun);
  mapper.register('hyperlink', parseHyperlink);
  mapper.register('bookmarkStart', parseBookmarkStart);
  mapper.register('bookmarkEnd', parseBookmarkEnd);
  return mapper;
}

/**
 * Create mapper for table cell content elements (<w:tc> children).
 *
 * Maps elements that can appear inside a table cell:
 * - w:p (paragraph)
 * - w:tbl (nested table)
 *
 * @returns ParserMapper configured for table cell content elements
 */
export function createTableCellContentMapper(): ParserMapper {
  const mapper = new ParserMapper();
  mapper.register('p', parseParagraph);
  mapper.register('tbl', parseTable);
  return mapper;
}
