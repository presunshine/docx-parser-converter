/**
 * Run properties parser.
 *
 * Matches Python: parsers/document/run_properties_parser.py
 */

import type { RunProperties, RunFonts, Language, Underline } from '../../models/document/run';
import type { UnderlineType, ThemeColorType, HighlightType, VertAlignType } from '../../models/types';
import { parseColor } from '../common/color-parser';
import { parseShading } from '../common/shading-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  parseToggle,
} from '../utils';

/**
 * Parse run fonts element.
 *
 * @param element - XML element (<w:rFonts>)
 * @returns RunFonts model or null
 */
export function parseRunFonts(element: Element | null): RunFonts | null {
  if (!element) {
    return null;
  }

  const ascii = getAttribute(element, 'ascii');
  const hAnsi = getAttribute(element, 'hAnsi');
  const eastAsia = getAttribute(element, 'eastAsia');
  const cs = getAttribute(element, 'cs');
  const asciiTheme = getAttribute(element, 'asciiTheme');
  const hAnsiTheme = getAttribute(element, 'hAnsiTheme');
  const eastAsiaTheme = getAttribute(element, 'eastAsiaTheme');
  const cstheme = getAttribute(element, 'cstheme');
  const hint = getAttribute(element, 'hint');

  // Cast to RunFonts - some properties may not be in the interface
  return {
    ascii: ascii ?? null,
    hAnsi: hAnsi ?? null,
    eastAsia: eastAsia ?? null,
    cs: cs ?? null,
    asciiTheme: asciiTheme ?? null,
    hAnsiTheme: hAnsiTheme ?? null,
    eastAsiaTheme: eastAsiaTheme ?? null,
    cstheme: cstheme ?? null,
    hint: hint ?? null,
  } as unknown as RunFonts;
}

/**
 * Parse language element.
 *
 * @param element - XML element (<w:lang>)
 * @returns Language model or null
 */
export function parseLanguage(element: Element | null): Language | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const eastAsia = getAttribute(element, 'eastAsia');
  const bidi = getAttribute(element, 'bidi');

  return {
    val: val ?? null,
    eastAsia: eastAsia ?? null,
    bidi: bidi ?? null,
  };
}

/**
 * Parse underline element.
 *
 * @param element - XML element (<w:u>)
 * @returns Underline model or null
 */
export function parseUnderline(element: Element | null): Underline | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const color = getAttribute(element, 'color');
  const themeColor = getAttribute(element, 'themeColor');
  const themeTint = getAttribute(element, 'themeTint');
  const themeShade = getAttribute(element, 'themeShade');

  // Cast to Underline - some properties may not be in the interface
  return {
    val: (val ?? null) as UnderlineType | null,
    color: color ?? null,
    themeColor: (themeColor ?? null) as ThemeColorType | null,
    themeTint: themeTint ?? null,
    themeShade: themeShade ?? null,
  } as unknown as Underline;
}

/**
 * Parse run properties element.
 *
 * @param element - XML element (<w:rPr>)
 * @returns RunProperties model or null
 */
export function parseRunProperties(element: Element | null): RunProperties | null {
  if (!element) {
    return null;
  }

  // Text formatting toggles
  const b = parseToggle(findChild(element, 'b'));
  const bCs = parseToggle(findChild(element, 'bCs'));
  const i = parseToggle(findChild(element, 'i'));
  const iCs = parseToggle(findChild(element, 'iCs'));
  const caps = parseToggle(findChild(element, 'caps'));
  const smallCaps = parseToggle(findChild(element, 'smallCaps'));
  const strike = parseToggle(findChild(element, 'strike'));
  const dstrike = parseToggle(findChild(element, 'dstrike'));
  const outline = parseToggle(findChild(element, 'outline'));
  const shadow = parseToggle(findChild(element, 'shadow'));
  const emboss = parseToggle(findChild(element, 'emboss'));
  const imprint = parseToggle(findChild(element, 'imprint'));
  const noProof = parseToggle(findChild(element, 'noProof'));
  const snapToGrid = parseToggle(findChild(element, 'snapToGrid'));
  const vanish = parseToggle(findChild(element, 'vanish'));
  const webHidden = parseToggle(findChild(element, 'webHidden'));
  const specVanish = parseToggle(findChild(element, 'specVanish'));
  const oMath = parseToggle(findChild(element, 'oMath'));
  const rtl = parseToggle(findChild(element, 'rtl'));
  const cs = parseToggle(findChild(element, 'cs'));

  // Fonts
  const rFonts = parseRunFonts(findChild(element, 'rFonts'));

  // Font size
  const szElem = findChild(element, 'sz');
  const sz = szElem ? getIntAttribute(szElem, 'val') : null;

  const szCsElem = findChild(element, 'szCs');
  const szCs = szCsElem ? getIntAttribute(szCsElem, 'val') : null;

  // Color
  const color = parseColor(findChild(element, 'color'));

  // Highlight
  const highlightElem = findChild(element, 'highlight');
  const highlight = highlightElem ? getAttribute(highlightElem, 'val') : null;

  // Underline
  const u = parseUnderline(findChild(element, 'u'));

  // Shading
  const shd = parseShading(findChild(element, 'shd'));

  // Vertical alignment
  const vertAlignElem = findChild(element, 'vertAlign');
  const vertAlign = vertAlignElem ? getAttribute(vertAlignElem, 'val') : null;

  // Spacing
  const spacingElem = findChild(element, 'spacing');
  const spacing = spacingElem ? getIntAttribute(spacingElem, 'val') : null;

  // Width
  const wElem = findChild(element, 'w');
  const w = wElem ? getIntAttribute(wElem, 'val') : null;

  // Kerning
  const kernElem = findChild(element, 'kern');
  const kern = kernElem ? getIntAttribute(kernElem, 'val') : null;

  // Position
  const positionElem = findChild(element, 'position');
  const position = positionElem ? getIntAttribute(positionElem, 'val') : null;

  // Language
  const lang = parseLanguage(findChild(element, 'lang'));

  // Style reference
  const rStyleElem = findChild(element, 'rStyle');
  const rStyle = rStyleElem ? getAttribute(rStyleElem, 'val') : null;

  // Border
  // TODO: Parse border when border parser supports single borders

  // East Asian layout
  const emElem = findChild(element, 'em');
  const em = emElem ? getAttribute(emElem, 'val') : null;

  const eastAsianLayoutElem = findChild(element, 'eastAsianLayout');
  const _eastAsianLayout = eastAsianLayoutElem ? {
    id: getAttribute(eastAsianLayoutElem, 'id'),
    combine: parseToggle(eastAsianLayoutElem),
    combineBrackets: getAttribute(eastAsianLayoutElem, 'combineBrackets'),
    vert: parseToggle(eastAsianLayoutElem),
    vertCompress: parseToggle(eastAsianLayoutElem),
  } : null;
  // Suppress unused variable warning
  void _eastAsianLayout;

  // Effect
  const effectElem = findChild(element, 'effect');
  const effect = effectElem ? getAttribute(effectElem, 'val') : null;

  // Fit text
  const fitTextElem = findChild(element, 'fitText');
  const fitText = fitTextElem ? getIntAttribute(fitTextElem, 'val') : null;

  return {
    rStyle: rStyle ?? null,
    rFonts: rFonts ?? null,
    b: b ?? null,
    bCs: bCs ?? null,
    i: i ?? null,
    iCs: iCs ?? null,
    caps: caps ?? null,
    smallCaps: smallCaps ?? null,
    strike: strike ?? null,
    dstrike: dstrike ?? null,
    outline: outline ?? null,
    shadow: shadow ?? null,
    emboss: emboss ?? null,
    imprint: imprint ?? null,
    noProof: noProof ?? null,
    snapToGrid: snapToGrid ?? null,
    vanish: vanish ?? null,
    webHidden: webHidden ?? null,
    color: color ?? null,
    spacing: spacing ?? null,
    w: w ?? null,
    kern: kern ?? null,
    position: position ?? null,
    sz: sz ?? null,
    szCs: szCs ?? null,
    highlight: (highlight ?? null) as HighlightType | null,
    u: u ?? null,
    effect: effect ?? null,
    vertAlign: (vertAlign ?? null) as VertAlignType | null,
    rtl: rtl ?? null,
    cs: cs ?? null,
    em: em ?? null,
    lang: lang ?? null,
    specVanish: specVanish ?? null,
    oMath: oMath ?? null,
    shd: shd ?? null,
    fitText: fitText ?? null,
    // Cast - some properties may not be in the interface
  } as unknown as RunProperties;
}
