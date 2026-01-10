/**
 * Style parser.
 *
 * Matches Python: parsers/styles/style_parser.py
 */

import type { Style } from '../../models/styles/style';
import type { TableStyleProperties } from '../../models/styles/table-style';
import type { RunProperties } from '../../models/document/run';
import type { ParagraphProperties } from '../../models/document/paragraph';
import type { TableProperties, TableRowProperties, TableCellProperties } from '../../models/document/table';
import type { TableStyleConditionType, StyleType } from '../../models/types';
import { parseRunProperties } from '../document/run-properties-parser';
import { parseParagraphProperties } from '../document/paragraph-properties-parser';
import { parseTableProperties } from '../document/table-properties-parser';
import { parseTableRowProperties } from '../document/table-row-properties-parser';
import { parseTableCellProperties } from '../document/table-cell-properties-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  findAllChildren,
  parseToggle,
} from '../utils';

/**
 * Remove null values from an object (shallow).
 */
function removeNulls<T>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Parse <w:tblStylePr> element.
 *
 * @param element - The <w:tblStylePr> element or null
 * @returns TableStyleProperties model or null
 */
export function parseTableStyleProperties(element: Element | null): TableStyleProperties | null {
  if (element === null) {
    return null;
  }

  // Required: condition type
  const conditionType = getAttribute(element, 'type');
  if (conditionType === null) {
    return null;
  }

  // Paragraph properties
  const pPrElem = findChild(element, 'pPr');
  let pPr: Partial<ParagraphProperties> | null = null;
  if (pPrElem !== null) {
    const parsed = parseParagraphProperties(pPrElem);
    if (parsed !== null) {
      pPr = removeNulls(parsed);
    }
  }

  // Run properties
  const rPrElem = findChild(element, 'rPr');
  let rPr: Partial<RunProperties> | null = null;
  if (rPrElem !== null) {
    const parsed = parseRunProperties(rPrElem);
    if (parsed !== null) {
      rPr = removeNulls(parsed);
    }
  }

  // Table properties
  const tblPrElem = findChild(element, 'tblPr');
  let tblPr: Partial<TableProperties> | null = null;
  if (tblPrElem !== null) {
    const parsed = parseTableProperties(tblPrElem);
    if (parsed !== null) {
      tblPr = removeNulls(parsed);
    }
  }

  // Table row properties
  const trPrElem = findChild(element, 'trPr');
  let trPr: Partial<TableRowProperties> | null = null;
  if (trPrElem !== null) {
    const parsed = parseTableRowProperties(trPrElem);
    if (parsed !== null) {
      trPr = removeNulls(parsed);
    }
  }

  // Table cell properties
  const tcPrElem = findChild(element, 'tcPr');
  let tcPr: Partial<TableCellProperties> | null = null;
  if (tcPrElem !== null) {
    const parsed = parseTableCellProperties(tcPrElem);
    if (parsed !== null) {
      tcPr = removeNulls(parsed);
    }
  }

  return {
    type: conditionType as TableStyleConditionType,
    pPr: pPr ?? null,
    rPr: rPr ?? null,
    tblPr: tblPr ?? null,
    trPr: trPr ?? null,
    tcPr: tcPr ?? null,
  };
}

/**
 * Parse <w:style> element.
 *
 * @param element - The <w:style> element or null
 * @returns Style model or null
 */
export function parseStyle(element: Element | null): Style | null {
  if (element === null) {
    return null;
  }

  // Required: type and styleId
  const styleType = getAttribute(element, 'type');
  const styleId = getAttribute(element, 'styleId');
  if (styleType === null || styleId === null) {
    return null;
  }

  // Default style flag
  const defaultAttr = getAttribute(element, 'default');
  const defaultVal = defaultAttr !== null ? (defaultAttr === '1' || defaultAttr === 'true') : null;

  // Custom style flag
  const customStyleAttr = getAttribute(element, 'customStyle');
  const customStyle = customStyleAttr !== null ? (customStyleAttr === '1' || customStyleAttr === 'true') : null;

  // Name
  const nameElem = findChild(element, 'name');
  const name = nameElem !== null ? getAttribute(nameElem, 'val') : null;

  // Aliases
  const aliasesElem = findChild(element, 'aliases');
  const aliases = aliasesElem !== null ? getAttribute(aliasesElem, 'val') : null;

  // Based on
  const basedOnElem = findChild(element, 'basedOn');
  const basedOn = basedOnElem !== null ? getAttribute(basedOnElem, 'val') : null;

  // Next style
  const nextElem = findChild(element, 'next');
  const nextStyle = nextElem !== null ? getAttribute(nextElem, 'val') : null;

  // Linked style
  const linkElem = findChild(element, 'link');
  const link = linkElem !== null ? getAttribute(linkElem, 'val') : null;

  // Auto-redefine
  const autoRedefine = parseToggle(findChild(element, 'autoRedefine'));

  // Hidden
  const hidden = parseToggle(findChild(element, 'hidden'));

  // UI priority
  const uiPriorityElem = findChild(element, 'uiPriority');
  const uiPriority = uiPriorityElem !== null ? getIntAttribute(uiPriorityElem, 'val') : null;

  // Semi-hidden
  const semiHidden = parseToggle(findChild(element, 'semiHidden'));

  // Unhide when used
  const unhideWhenUsed = parseToggle(findChild(element, 'unhideWhenUsed'));

  // Quick format
  const qFormat = parseToggle(findChild(element, 'qFormat'));

  // Locked
  const locked = parseToggle(findChild(element, 'locked'));

  // Personal styles
  const personal = parseToggle(findChild(element, 'personal'));
  const personalCompose = parseToggle(findChild(element, 'personalCompose'));
  const personalReply = parseToggle(findChild(element, 'personalReply'));

  // RSID
  const rsidElem = findChild(element, 'rsid');
  const rsid = rsidElem !== null ? getAttribute(rsidElem, 'val') : null;

  // Paragraph properties
  const pPrElem = findChild(element, 'pPr');
  let pPr: Partial<ParagraphProperties> | null = null;
  if (pPrElem !== null) {
    const parsed = parseParagraphProperties(pPrElem);
    if (parsed !== null) {
      pPr = removeNulls(parsed);
    }
  }

  // Run properties
  const rPrElem = findChild(element, 'rPr');
  let rPr: Partial<RunProperties> | null = null;
  if (rPrElem !== null) {
    const parsed = parseRunProperties(rPrElem);
    if (parsed !== null) {
      rPr = removeNulls(parsed);
    }
  }

  // Table properties (for table styles)
  const tblPrElem = findChild(element, 'tblPr');
  let tblPr: Partial<TableProperties> | null = null;
  if (tblPrElem !== null) {
    const parsed = parseTableProperties(tblPrElem);
    if (parsed !== null) {
      tblPr = removeNulls(parsed);
    }
  }

  // Table row properties
  const trPrElem = findChild(element, 'trPr');
  let trPr: Partial<TableRowProperties> | null = null;
  if (trPrElem !== null) {
    const parsed = parseTableRowProperties(trPrElem);
    if (parsed !== null) {
      trPr = removeNulls(parsed);
    }
  }

  // Table cell properties
  const tcPrElem = findChild(element, 'tcPr');
  let tcPr: Partial<TableCellProperties> | null = null;
  if (tcPrElem !== null) {
    const parsed = parseTableCellProperties(tcPrElem);
    if (parsed !== null) {
      tcPr = removeNulls(parsed);
    }
  }

  // Table style conditional formatting
  let tblStylePr: TableStyleProperties[] | null = null;
  const tblStylePrElements = findAllChildren(element, 'tblStylePr');
  if (tblStylePrElements.length > 0) {
    tblStylePr = [];
    for (const tspElem of tblStylePrElements) {
      const tsp = parseTableStyleProperties(tspElem);
      if (tsp !== null) {
        tblStylePr.push(tsp);
      }
    }
  }

  return {
    type: styleType as StyleType,
    styleId,
    default: defaultVal,
    customStyle: customStyle ?? null,
    name: name ?? null,
    aliases: aliases ?? null,
    basedOn: basedOn ?? null,
    next: nextStyle ?? null,
    link: link ?? null,
    autoRedefine: autoRedefine ?? null,
    hidden: hidden ?? null,
    uiPriority: uiPriority ?? null,
    semiHidden: semiHidden ?? null,
    unhideWhenUsed: unhideWhenUsed ?? null,
    qFormat: qFormat ?? null,
    locked: locked ?? null,
    personal: personal ?? null,
    personalCompose: personalCompose ?? null,
    personalReply: personalReply ?? null,
    rsid: rsid ?? null,
    pPr: pPr ?? null,
    rPr: rPr ?? null,
    tblPr: tblPr ?? null,
    trPr: trPr ?? null,
    tcPr: tcPr ?? null,
    tblStylePr: tblStylePr ?? null,
  };
}
