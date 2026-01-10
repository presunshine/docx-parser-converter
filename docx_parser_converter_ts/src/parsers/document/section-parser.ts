/**
 * Parser for section properties elements.
 *
 * Matches Python: parsers/document/section_parser.py
 */

import { REL_NS_URI } from '../../core/constants';
import type {
  SectionProperties,
  PageSize,
  PageMargins,
  PageBorders,
  Columns,
  Column,
  DocumentGrid,
  HeaderFooterReference,
  PageNumberType,
  LineNumberType,
} from '../../models/document/section';
import type { SectionType, OrientType, VAlignType, NumFmtType } from '../../models/types';
import { parseBorder } from '../common/border-parser';
import {
  getAttribute,
  getIntAttribute,
  findChild,
  findAllChildren,
  parseToggle,
} from '../utils';

/**
 * Parse <w:pgSz> element.
 *
 * XML Example:
 *   <w:pgSz w:w="12240" w:h="15840" w:orient="portrait"/>
 *
 * @param element - The <w:pgSz> element or null
 * @returns PageSize model or null if element is null
 */
export function parsePageSize(element: Element | null): PageSize | null {
  if (!element) {
    return null;
  }

  return {
    w: getIntAttribute(element, 'w') ?? null,
    h: getIntAttribute(element, 'h') ?? null,
    orient: (getAttribute(element, 'orient') as OrientType) ?? null,
  };
}

/**
 * Parse <w:pgMar> element.
 *
 * XML Example:
 *   <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"
 *            w:header="720" w:footer="720" w:gutter="0"/>
 *
 * @param element - The <w:pgMar> element or null
 * @returns PageMargins model or null if element is null
 */
export function parsePageMargins(element: Element | null): PageMargins | null {
  if (!element) {
    return null;
  }

  return {
    top: getIntAttribute(element, 'top') ?? null,
    right: getIntAttribute(element, 'right') ?? null,
    bottom: getIntAttribute(element, 'bottom') ?? null,
    left: getIntAttribute(element, 'left') ?? null,
    header: getIntAttribute(element, 'header') ?? null,
    footer: getIntAttribute(element, 'footer') ?? null,
    gutter: getIntAttribute(element, 'gutter') ?? null,
  };
}

/**
 * Parse <w:col> element within <w:cols>.
 *
 * @param element - The <w:col> element or null
 * @returns Column model or null if element is null
 */
export function parseColumn(element: Element | null): Column | null {
  if (!element) {
    return null;
  }

  return {
    w: getIntAttribute(element, 'w') ?? null,
    space: getIntAttribute(element, 'space') ?? null,
  };
}

/**
 * Parse <w:cols> element.
 *
 * XML Example:
 *   <w:cols w:num="2" w:space="720" w:equalWidth="1"/>
 *
 * @param element - The <w:cols> element or null
 * @returns Columns model or null if element is null
 */
export function parseColumns(element: Element | null): Columns | null {
  if (!element) {
    return null;
  }

  // Parse individual columns if not equal width
  let colList: Column[] | null = null;
  const colElements = findAllChildren(element, 'col');
  if (colElements.length > 0) {
    colList = [];
    for (const colElem of colElements) {
      const col = parseColumn(colElem);
      if (col !== null) {
        colList.push(col);
      }
    }
  }

  return {
    num: getIntAttribute(element, 'num') ?? null,
    space: getIntAttribute(element, 'space') ?? null,
    equalWidth: parseToggle(element), // Check if equalWidth attribute exists
    sep: parseToggle(findChild(element, 'sep')),
    col: colList && colList.length > 0 ? colList : null,
  };
}

/**
 * Parse <w:docGrid> element.
 *
 * @param element - The <w:docGrid> element or null
 * @returns DocumentGrid model or null if element is null
 */
export function parseDocumentGrid(element: Element | null): DocumentGrid | null {
  if (!element) {
    return null;
  }

  return {
    type: getAttribute(element, 'type') ?? null,
    linePitch: getIntAttribute(element, 'linePitch') ?? null,
    charSpace: getIntAttribute(element, 'charSpace') ?? null,
  };
}

/**
 * Parse <w:headerReference> or <w:footerReference> element.
 *
 * XML Example:
 *   <w:headerReference w:type="default" r:id="rId1"/>
 *
 * @param element - The header/footer reference element or null
 * @returns HeaderFooterReference model or null if element is null
 */
export function parseHeaderFooterReference(element: Element | null): HeaderFooterReference | null {
  if (!element) {
    return null;
  }

  return {
    type: getAttribute(element, 'type') ?? null,
    rId: element.getAttributeNS(REL_NS_URI, 'id') || null,
  };
}

/**
 * Parse <w:pgBorders> element.
 *
 * @param element - The <w:pgBorders> element or null
 * @returns PageBorders model or null if element is null
 */
export function parsePageBorders(element: Element | null): PageBorders | null {
  if (!element) {
    return null;
  }

  return {
    top: parseBorder(findChild(element, 'top')),
    left: parseBorder(findChild(element, 'left')),
    bottom: parseBorder(findChild(element, 'bottom')),
    right: parseBorder(findChild(element, 'right')),
    offsetFrom: getAttribute(element, 'offsetFrom') ?? null,
    zOrder: getAttribute(element, 'zOrder') ?? null,
    display: getAttribute(element, 'display') ?? null,
  };
}

/**
 * Parse <w:pgNumType> element.
 *
 * XML Example:
 *   <w:pgNumType w:fmt="decimal" w:start="1"/>
 *
 * @param element - The <w:pgNumType> element or null
 * @returns PageNumberType model or null if element is null
 */
export function parsePageNumberType(element: Element | null): PageNumberType | null {
  if (!element) {
    return null;
  }

  return {
    fmt: (getAttribute(element, 'fmt') as NumFmtType) ?? null,
    start: getIntAttribute(element, 'start') ?? null,
    chapterStyle: getAttribute(element, 'chapStyle') ?? null,
    chapterSep: getAttribute(element, 'chapSep') ?? null,
  };
}

/**
 * Parse <w:lnNumType> element.
 *
 * @param element - The <w:lnNumType> element or null
 * @returns LineNumberType model or null if element is null
 */
export function parseLineNumberType(element: Element | null): LineNumberType | null {
  if (!element) {
    return null;
  }

  return {
    countBy: getIntAttribute(element, 'countBy') ?? null,
    start: getIntAttribute(element, 'start') ?? null,
    restart: getAttribute(element, 'restart') ?? null,
    distance: getIntAttribute(element, 'distance') ?? null,
  };
}

/**
 * Parse <w:sectPr> element.
 *
 * XML Example:
 *   <w:sectPr>
 *     <w:pgSz w:w="12240" w:h="15840"/>
 *     <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
 *     <w:cols w:space="720"/>
 *   </w:sectPr>
 *
 * @param element - The <w:sectPr> element or null
 * @returns SectionProperties model or null if element is null
 */
export function parseSectionProperties(element: Element | null): SectionProperties | null {
  if (!element) {
    return null;
  }

  // Page size and margins
  const pgSz = parsePageSize(findChild(element, 'pgSz'));
  const pgMar = parsePageMargins(findChild(element, 'pgMar'));

  // Columns
  const cols = parseColumns(findChild(element, 'cols'));

  // Document grid
  const docGrid = parseDocumentGrid(findChild(element, 'docGrid'));

  // Header references
  let headerRefs: HeaderFooterReference[] | null = null;
  const headerElements = findAllChildren(element, 'headerReference');
  if (headerElements.length > 0) {
    headerRefs = [];
    for (const hElem of headerElements) {
      const ref = parseHeaderFooterReference(hElem);
      if (ref !== null) {
        headerRefs.push(ref);
      }
    }
  }

  // Footer references
  let footerRefs: HeaderFooterReference[] | null = null;
  const footerElements = findAllChildren(element, 'footerReference');
  if (footerElements.length > 0) {
    footerRefs = [];
    for (const fElem of footerElements) {
      const ref = parseHeaderFooterReference(fElem);
      if (ref !== null) {
        footerRefs.push(ref);
      }
    }
  }

  // Page borders
  const pgBorders = parsePageBorders(findChild(element, 'pgBorders'));

  // Page numbering
  const pgNumType = parsePageNumberType(findChild(element, 'pgNumType'));

  // Section type
  const typeElem = findChild(element, 'type');
  const sectionType = typeElem ? (getAttribute(typeElem, 'val') as SectionType) : null;

  // Title page (different first page)
  const titlePg = parseToggle(findChild(element, 'titlePg'));

  // Line numbering
  const lnNumType = parseLineNumberType(findChild(element, 'lnNumType'));

  // Bidirectional
  const bidi = parseToggle(findChild(element, 'bidi'));

  // RTL gutter
  const rtlGutter = parseToggle(findChild(element, 'rtlGutter'));

  // Form protection
  const formProt = parseToggle(findChild(element, 'formProt'));

  // Vertical alignment
  const vAlignElem = findChild(element, 'vAlign');
  const vAlign = vAlignElem ? (getAttribute(vAlignElem, 'val') as VAlignType) : null;

  return {
    pgSz: pgSz ?? null,
    pgMar: pgMar ?? null,
    cols: cols ?? null,
    docGrid: docGrid ?? null,
    headerRefs: headerRefs && headerRefs.length > 0 ? headerRefs : null,
    footerRefs: footerRefs && footerRefs.length > 0 ? footerRefs : null,
    pgBorders: pgBorders ?? null,
    pgNumType: pgNumType ?? null,
    type: sectionType ?? null,
    titlePg: titlePg ?? null,
    lnNumType: lnNumType ?? null,
    bidi: bidi ?? null,
    rtlGutter: rtlGutter ?? null,
    formProt: formProt ?? null,
    vAlign: vAlign ?? null,
  };
}
