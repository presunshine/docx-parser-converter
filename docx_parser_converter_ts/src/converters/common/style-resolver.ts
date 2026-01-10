/**
 * Style resolver for DOCX style inheritance.
 *
 * Resolves style inheritance chains, merges document defaults,
 * and handles direct formatting overrides.
 *
 * Matches Python: converters/common/style_resolver.py
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Styles } from '../../models/styles/styles';
import type { Style } from '../../models/styles/style';
import type { DocumentDefaults } from '../../models/styles/document-defaults';
import { mergeChain, deepMerge } from '../../core/model-utils';

/**
 * Resolves style inheritance and merges properties.
 *
 * Handles style chains (basedOn), document defaults, and direct
 * formatting to produce the final resolved properties.
 */
export class StyleResolver {
  private _styles: Styles | null | undefined;
  private _docDefaults: DocumentDefaults | null | undefined;

  // Maps: styleId -> Style
  private _styleMap: Map<string, Style> = new Map();

  // Cache for resolved styles
  private _cache: Map<string, Style> = new Map();

  // Cache for resolved properties
  private _pPrCache: Map<string, Record<string, any>> = new Map();
  private _rPrCache: Map<string, Record<string, any>> = new Map();
  private _tblPrCache: Map<string, Record<string, any>> = new Map();

  constructor(styles: Styles | null | undefined, documentDefaults: DocumentDefaults | null | undefined = null) {
    this._styles = styles;
    this._docDefaults = documentDefaults;
    this._buildStyleMap();
  }

  private _buildStyleMap(): void {
    if (!this._styles || !this._styles.style) {
      return;
    }

    for (const style of this._styles.style) {
      if (style.styleId !== null && style.styleId !== undefined) {
        this._styleMap.set(style.styleId, style);
      }
    }
  }

  /**
   * Resolve a style by ID, including inheritance.
   */
  resolveStyle(styleId: string | null): Style | null {
    if (styleId === null) {
      return null;
    }

    if (!this._styleMap.has(styleId)) {
      return null;
    }

    // Check cache
    if (this._cache.has(styleId)) {
      return this._cache.get(styleId)!;
    }

    const style = this._styleMap.get(styleId)!;

    // Store in cache
    this._cache.set(styleId, style);

    return style;
  }

  /**
   * Get the default paragraph style.
   */
  getDefaultParagraphStyle(): Style | null {
    for (const style of this._styleMap.values()) {
      if (style.type === 'paragraph' && style.default) {
        return style;
      }
    }
    return null;
  }

  /**
   * Resolve paragraph properties for a style.
   *
   * Includes inherited properties from basedOn chain and document defaults.
   */
  resolveParagraphProperties(styleId: string | null): Record<string, any> {
    if (styleId === null) {
      return this._getDefaultPPr();
    }

    // Check cache
    if (this._pPrCache.has(styleId)) {
      return { ...this._pPrCache.get(styleId)! };
    }

    // Get inheritance chain
    const chain = this._getStyleChain(styleId, 'paragraph');

    // Build properties from chain (defaults -> parent -> ... -> child)
    const pPrChain: (Record<string, any> | null)[] = [];
    const rPrChain: (Record<string, any> | null)[] = [];

    // Add document defaults first
    pPrChain.push(this._getDefaultPPr());
    rPrChain.push(this._getDefaultRPr());

    // Add each style in the chain (parent to child order)
    for (const style of [...chain].reverse()) {
      pPrChain.push(style.pPr || null);
      rPrChain.push(style.rPr || null);
    }

    // Merge the chain
    const pPr = mergeChain(pPrChain);
    const rPr = mergeChain(rPrChain);

    // Add run properties to the result
    if (Object.keys(rPr).length > 0) {
      pPr.rPr = rPr;
    }

    this._pPrCache.set(styleId, pPr);
    return { ...pPr };
  }

  /**
   * Resolve run properties for a style.
   *
   * Includes inherited properties from basedOn chain and document defaults.
   */
  resolveRunProperties(styleId: string | null): Record<string, any> {
    if (styleId === null) {
      return this._getDefaultRPr();
    }

    // Check cache
    if (this._rPrCache.has(styleId)) {
      return { ...this._rPrCache.get(styleId)! };
    }

    // Check if style exists
    if (!this._styleMap.has(styleId)) {
      return this._getDefaultRPr();
    }

    // Get inheritance chain
    const style = this._styleMap.get(styleId)!;
    let chain: Style[];
    if (style.type === 'character') {
      chain = this._getStyleChain(styleId, 'character');
    } else {
      chain = this._getStyleChain(styleId, 'paragraph');
    }

    // Build properties from chain
    const rPrChain: (Record<string, any> | null)[] = [];

    // Add document defaults first
    rPrChain.push(this._getDefaultRPr());

    // Add each style in the chain
    for (const s of [...chain].reverse()) {
      rPrChain.push(s.rPr || null);
    }

    // Merge the chain
    const rPr = mergeChain(rPrChain);

    this._rPrCache.set(styleId, rPr);
    return { ...rPr };
  }

  /**
   * Resolve table properties for a style.
   *
   * Includes inherited properties from basedOn chain.
   */
  resolveTableProperties(styleId: string | null): Record<string, any> {
    if (styleId === null) {
      return {};
    }

    // Check cache
    if (this._tblPrCache.has(styleId)) {
      return { ...this._tblPrCache.get(styleId)! };
    }

    // Get inheritance chain
    const chain = this._getStyleChain(styleId, 'table');

    // Build properties from chain
    const tblPrChain: (Record<string, any> | null)[] = [];

    for (const style of [...chain].reverse()) {
      tblPrChain.push(style.tblPr || null);
    }

    // Merge the chain
    const tblPr = mergeChain(tblPrChain);

    this._tblPrCache.set(styleId, tblPr);
    return { ...tblPr };
  }

  /**
   * Resolve full paragraph style properties.
   *
   * @returns Tuple of [paragraphProperties, runProperties]
   */
  resolveParagraphStyleFull(styleId: string | null): { pPr: Record<string, any>; rPr: Record<string, any> } {
    const pPr = this.resolveParagraphProperties(styleId);

    // Extract rPr if it was included in pPr
    const rPr = pPr.rPr || {};
    delete pPr.rPr;

    return { pPr, rPr };
  }

  /**
   * Merge style properties with direct formatting.
   *
   * Direct formatting takes precedence over style properties.
   */
  mergeWithDirect(
    styleProps: Record<string, any>,
    directProps: Record<string, any> | null
  ): Record<string, any> {
    if (directProps === null) {
      return { ...styleProps };
    }

    // Filter out null values from directProps (null doesn't override)
    const filteredDirect: Record<string, any> = {};
    for (const [key, value] of Object.entries(directProps)) {
      if (value !== null) {
        filteredDirect[key] = value;
      }
    }

    const result = deepMerge(styleProps, filteredDirect);
    return result;
  }

  /**
   * Resolve style then merge with direct formatting.
   */
  resolveWithDirect(
    styleId: string | null,
    directProps: Record<string, any> | null
  ): Record<string, any> {
    const styleProps = this.resolveParagraphProperties(styleId);
    return this.mergeWithDirect(styleProps, directProps);
  }

  /**
   * Clear all cached resolutions.
   */
  clearCache(): void {
    this._cache.clear();
    this._pPrCache.clear();
    this._rPrCache.clear();
    this._tblPrCache.clear();
  }

  /**
   * Get the inheritance chain for a style.
   *
   * @returns List of styles from child to parent
   */
  private _getStyleChain(
    styleId: string,
    styleType: string,
    visited: Set<string> | null = null
  ): Style[] {
    if (visited === null) {
      visited = new Set();
    }

    const chain: Style[] = [];

    if (!this._styleMap.has(styleId)) {
      return chain;
    }

    // Check for circular reference
    if (visited.has(styleId)) {
      console.warn(`Circular style reference detected: ${styleId}`);
      return chain;
    }

    visited.add(styleId);
    const style = this._styleMap.get(styleId)!;
    chain.push(style);

    // Follow basedOn chain
    if (style.basedOn) {
      if (!this._styleMap.has(style.basedOn)) {
        console.warn(`Style '${styleId}' references missing style '${style.basedOn}'`);
      } else {
        const parentChain = this._getStyleChain(style.basedOn, styleType, visited);
        chain.push(...parentChain);
      }
    }

    return chain;
  }

  /**
   * Get default paragraph properties from document defaults.
   */
  private _getDefaultPPr(): Record<string, any> {
    if (
      !this._docDefaults ||
      !this._docDefaults.pPrDefault ||
      !this._docDefaults.pPrDefault.pPr
    ) {
      return {};
    }
    return { ...this._docDefaults.pPrDefault.pPr };
  }

  /**
   * Get default run properties from document defaults.
   */
  private _getDefaultRPr(): Record<string, any> {
    if (
      !this._docDefaults ||
      !this._docDefaults.rPrDefault ||
      !this._docDefaults.rPrDefault.rPr
    ) {
      return {};
    }
    return { ...this._docDefaults.rPrDefault.rPr };
  }

  // Public accessors for testing
  getStyleMap(): Map<string, Style> {
    return this._styleMap;
  }

  getDocDefaults(): DocumentDefaults | null {
    return this._docDefaults ?? null;
  }

  getCacheSize(): number {
    return this._cache.size;
  }
}
