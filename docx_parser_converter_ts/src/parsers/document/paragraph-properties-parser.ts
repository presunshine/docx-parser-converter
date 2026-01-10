/**
 * Paragraph properties parser.
 *
 * Matches Python: parsers/document/paragraph_properties_parser.py
 */

import type { ParagraphProperties, NumberingProperties, TabStop, FrameProperties } from '../../models/document/paragraph';
import type { TabType, TabLeaderType, DropCapType, FrameWrapType, FrameAnchorType, TextDirectionType, JustificationType } from '../../models/types';
import { parseSpacing } from '../common/spacing-parser';
import { parseIndentation } from '../common/indentation-parser';
import { parseShading } from '../common/shading-parser';
import { parseParagraphBorders } from '../common/border-parser';
import { parseRunProperties } from './run-properties-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  findAllChildren,
  parseToggle,
} from '../utils';

/**
 * Parse tab stop element.
 *
 * @param element - XML element (<w:tab>)
 * @returns TabStop model or null
 */
export function parseTabStop(element: Element | null): TabStop | null {
  if (!element) {
    return null;
  }

  const val = getAttribute(element, 'val');
  const pos = getIntAttribute(element, 'pos');
  const leader = getAttribute(element, 'leader');

  return {
    val: (val ?? null) as TabType | null,
    pos: pos ?? null,
    leader: (leader ?? null) as TabLeaderType | null,
  };
}

/**
 * Parse numbering properties element.
 *
 * @param element - XML element (<w:numPr>)
 * @returns NumberingProperties model or null
 */
export function parseNumberingProperties(element: Element | null): NumberingProperties | null {
  if (!element) {
    return null;
  }

  const ilvlElem = findChild(element, 'ilvl');
  const ilvl = ilvlElem ? getIntAttribute(ilvlElem, 'val') : null;

  const numIdElem = findChild(element, 'numId');
  const numId = numIdElem ? getIntAttribute(numIdElem, 'val') : null;

  return {
    ilvl: ilvl ?? null,
    numId: numId ?? null,
  };
}

/**
 * Parse frame properties element.
 *
 * @param element - XML element (<w:framePr>)
 * @returns FrameProperties model or null
 */
export function parseFrameProperties(element: Element | null): FrameProperties | null {
  if (!element) {
    return null;
  }

  return {
    dropCap: (getAttribute(element, 'dropCap') ?? null) as DropCapType | null,
    lines: getIntAttribute(element, 'lines') ?? null,
    w: getIntAttribute(element, 'w') ?? null,
    h: getIntAttribute(element, 'h') ?? null,
    vSpace: getIntAttribute(element, 'vSpace') ?? null,
    hSpace: getIntAttribute(element, 'hSpace') ?? null,
    wrap: (getAttribute(element, 'wrap') ?? null) as FrameWrapType | null,
    hAnchor: (getAttribute(element, 'hAnchor') ?? null) as FrameAnchorType | null,
    vAnchor: (getAttribute(element, 'vAnchor') ?? null) as FrameAnchorType | null,
    x: getIntAttribute(element, 'x') ?? null,
    xAlign: getAttribute(element, 'xAlign') ?? null,
    y: getIntAttribute(element, 'y') ?? null,
    yAlign: getAttribute(element, 'yAlign') ?? null,
    hRule: getAttribute(element, 'hRule') ?? null,
    anchorLock: parseToggle(element) ?? null,
    // Cast - some properties may not be in the interface
  } as unknown as FrameProperties;
}

/**
 * Parse paragraph properties element.
 *
 * @param element - XML element (<w:pPr>)
 * @returns ParagraphProperties model or null
 */
export function parseParagraphProperties(element: Element | null): ParagraphProperties | null {
  if (!element) {
    return null;
  }

  // Style reference
  const pStyleElem = findChild(element, 'pStyle');
  const pStyle = pStyleElem ? getAttribute(pStyleElem, 'val') : null;

  // Keep properties
  const keepNext = parseToggle(findChild(element, 'keepNext'));
  const keepLines = parseToggle(findChild(element, 'keepLines'));
  const pageBreakBefore = parseToggle(findChild(element, 'pageBreakBefore'));
  const widowControl = parseToggle(findChild(element, 'widowControl'));

  // Numbering
  const numPr = parseNumberingProperties(findChild(element, 'numPr'));

  // Suppression
  const suppressLineNumbers = parseToggle(findChild(element, 'suppressLineNumbers'));
  const suppressAutoHyphens = parseToggle(findChild(element, 'suppressAutoHyphens'));

  // Borders
  const pBdr = parseParagraphBorders(findChild(element, 'pBdr'));

  // Shading
  const shd = parseShading(findChild(element, 'shd'));

  // Tabs
  const tabsElem = findChild(element, 'tabs');
  let tabs: TabStop[] | null = null;
  if (tabsElem) {
    const tabElems = findAllChildren(tabsElem, 'tab');
    tabs = tabElems.map(parseTabStop).filter((t): t is TabStop => t !== null);
  }

  // Spacing
  const spacing = parseSpacing(findChild(element, 'spacing'));

  // Indentation
  const ind = parseIndentation(findChild(element, 'ind'));

  // Context mark
  const contextualSpacing = parseToggle(findChild(element, 'contextualSpacing'));

  // Mirror indents
  const mirrorIndents = parseToggle(findChild(element, 'mirrorIndents'));

  // Text direction
  const textDirectionElem = findChild(element, 'textDirection');
  const textDirection = textDirectionElem ? getAttribute(textDirectionElem, 'val') : null;

  // Text alignment
  const textAlignmentElem = findChild(element, 'textAlignment');
  const textAlignment = textAlignmentElem ? getAttribute(textAlignmentElem, 'val') : null;

  // Text box tightWrap
  const textboxTightWrapElem = findChild(element, 'textboxTightWrap');
  const textboxTightWrap = textboxTightWrapElem ? getAttribute(textboxTightWrapElem, 'val') : null;

  // Outline level
  const outlineLvlElem = findChild(element, 'outlineLvl');
  const outlineLvl = outlineLvlElem ? getIntAttribute(outlineLvlElem, 'val') : null;

  // Div id
  const divIdElem = findChild(element, 'divId');
  const divId = divIdElem ? getIntAttribute(divIdElem, 'val') : null;

  // Justification
  const jcElem = findChild(element, 'jc');
  const jc = jcElem ? getAttribute(jcElem, 'val') : null;

  // Bidirectional
  const bidi = parseToggle(findChild(element, 'bidi'));

  // Frame properties
  const framePr = parseFrameProperties(findChild(element, 'framePr'));

  // Adjustments
  const adjustRightInd = parseToggle(findChild(element, 'adjustRightInd'));
  const snapToGrid = parseToggle(findChild(element, 'snapToGrid'));

  // Kinsoku
  const kinsoku = parseToggle(findChild(element, 'kinsoku'));
  const wordWrap = parseToggle(findChild(element, 'wordWrap'));
  const overflowPunct = parseToggle(findChild(element, 'overflowPunct'));
  const topLinePunct = parseToggle(findChild(element, 'topLinePunct'));
  const autoSpaceDE = parseToggle(findChild(element, 'autoSpaceDE'));
  const autoSpaceDN = parseToggle(findChild(element, 'autoSpaceDN'));

  // Run properties (for paragraph mark)
  const rPr = parseRunProperties(findChild(element, 'rPr'));

  // Section properties reference
  const sectPr = findChild(element, 'sectPr') !== null;

  // Conditional formatting
  const cnfStyleElem = findChild(element, 'cnfStyle');
  const cnfStyle = cnfStyleElem ? getAttribute(cnfStyleElem, 'val') : null;

  return {
    pStyle: pStyle ?? null,
    keepNext: keepNext ?? null,
    keepLines: keepLines ?? null,
    pageBreakBefore: pageBreakBefore ?? null,
    framePr: framePr ?? null,
    widowControl: widowControl ?? null,
    numPr: numPr ?? null,
    suppressLineNumbers: suppressLineNumbers ?? null,
    pBdr: pBdr ?? null,
    shd: shd ?? null,
    tabs: tabs ?? null,
    suppressAutoHyphens: suppressAutoHyphens ?? null,
    kinsoku: kinsoku ?? null,
    wordWrap: wordWrap ?? null,
    overflowPunct: overflowPunct ?? null,
    topLinePunct: topLinePunct ?? null,
    autoSpaceDE: autoSpaceDE ?? null,
    autoSpaceDN: autoSpaceDN ?? null,
    bidi: bidi ?? null,
    adjustRightInd: adjustRightInd ?? null,
    snapToGrid: snapToGrid ?? null,
    spacing: spacing ?? null,
    ind: ind ?? null,
    contextualSpacing: contextualSpacing ?? null,
    mirrorIndents: mirrorIndents ?? null,
    textDirection: (textDirection ?? null) as TextDirectionType | null,
    textAlignment: textAlignment ?? null,
    textboxTightWrap: textboxTightWrap ?? null,
    outlineLvl: outlineLvl ?? null,
    divId: divId ?? null,
    cnfStyle: cnfStyle ?? null,
    rPr: rPr ?? null,
    sectPr: sectPr ? {} : null,
    jc: (jc ?? null) as JustificationType | null,
    // Cast - some properties may not be in the interface
  } as unknown as ParagraphProperties;
}
