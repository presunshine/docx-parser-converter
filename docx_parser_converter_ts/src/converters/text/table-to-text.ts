/**
 * Table to text converter.
 *
 * Converts Table elements to plain text in various modes (ASCII, tabs, plain).
 */

import type { Table, TableCell, TableRow } from '../../models/document/table';
import type { Paragraph } from '../../models/document/paragraph';
import type { Border } from '../../models/common/border';
import { paragraphToText } from './paragraph-to-text';

// =============================================================================
// Type Definitions
// =============================================================================

export type TableMode = 'ascii' | 'tabs' | 'plain' | 'auto';

/**
 * Information about which table borders are present.
 */
export interface BorderInfo {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  insideH: boolean;
  insideV: boolean;
}

/**
 * Create a BorderInfo with default values.
 */
export function createBorderInfo(overrides?: Partial<BorderInfo>): BorderInfo {
  return {
    top: false,
    bottom: false,
    left: false,
    right: false,
    insideH: false,
    insideV: false,
    ...overrides,
  };
}

/**
 * Check if any border is present.
 */
export function hasAnyBorder(info: BorderInfo): boolean {
  return info.top || info.bottom || info.left || info.right || info.insideH || info.insideV;
}

// =============================================================================
// Cell Content Extraction
// =============================================================================

/**
 * Extract text content from a table cell.
 *
 * @param cell - TableCell element or null
 * @returns Text content of the cell
 */
export function cellToText(cell: TableCell | null | undefined): string {
  if (!cell) {
    return '';
  }

  const parts: string[] = [];

  if (cell.content) {
    for (const content of cell.content) {
      if (content && typeof content === 'object' && ('pPr' in content || 'content' in content)) {
        const text = paragraphToText(content as Paragraph);
        if (text) {
          parts.push(text);
        }
      }
    }
  }

  return parts.join('\n');
}

/**
 * Extract text content from a table row.
 *
 * @param row - TableRow element or null
 * @param separator - Cell separator string
 * @returns Text content of the row
 */
export function rowToText(row: TableRow | null | undefined, separator = '\t'): string {
  if (!row) {
    return '';
  }

  const cells: string[] = [];

  if (row.tc) {
    for (const cell of row.tc) {
      const text = cellToText(cell);
      cells.push(text);
    }
  }

  return cells.join(separator);
}

// =============================================================================
// Border Detection
// =============================================================================

/**
 * Check if a single border is visible.
 */
function isBorderVisible(border: Border | null | undefined): boolean {
  return border !== null && border !== undefined &&
         border.val !== null && border.val !== undefined &&
         border.val !== 'none' && border.val !== 'nil';
}

/**
 * Check if a border is explicitly set to none/nil.
 */
function isBorderExplicitlyNone(border: Border | null | undefined): boolean {
  return border !== null && border !== undefined &&
         border.val !== null && border.val !== undefined &&
         (border.val === 'none' || border.val === 'nil');
}

/**
 * Detect which borders are present on the table.
 *
 * Cell-level borders override table-level borders in OOXML.
 * Checks cell borders first, then falls back to table borders.
 *
 * @param table - Table element
 * @returns BorderInfo with flags for each border type
 */
export function detectBorders(table: Table): BorderInfo {
  const info = createBorderInfo();

  if (!table.tr) {
    return info;
  }

  const numRows = table.tr.length;

  // Track whether all cells explicitly set borders to none
  let allCellsHaveNoTop = true;
  let allCellsHaveNoBottom = true;
  let allCellsHaveNoLeft = true;
  let allCellsHaveNoRight = true;
  let allCellsHaveNoInsideH = true;
  let allCellsHaveNoInsideV = true;

  // First pass: check all cell-level borders
  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const row = table.tr[rowIdx];
    if (!row.tc) continue;

    const numCols = row.tc.length;

    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      const cell = row.tc[colIdx];
      const cb = cell.tcPr?.tcBorders;

      if (cb) {
        // Check if cell has visible borders
        if (rowIdx === 0 && isBorderVisible(cb.top)) {
          info.top = true;
        }
        if (rowIdx === numRows - 1 && isBorderVisible(cb.bottom)) {
          info.bottom = true;
        }
        if (colIdx === 0 && isBorderVisible(cb.left)) {
          info.left = true;
        }
        if (colIdx === numCols - 1 && isBorderVisible(cb.right)) {
          info.right = true;
        }
        if (rowIdx < numRows - 1 && isBorderVisible(cb.bottom)) {
          info.insideH = true;
        }
        if (rowIdx > 0 && isBorderVisible(cb.top)) {
          info.insideH = true;
        }
        if (colIdx < numCols - 1 && isBorderVisible(cb.right)) {
          info.insideV = true;
        }
        if (colIdx > 0 && isBorderVisible(cb.left)) {
          info.insideV = true;
        }

        // Track if NOT explicitly none
        if (rowIdx === 0 && !isBorderExplicitlyNone(cb.top)) {
          allCellsHaveNoTop = false;
        }
        if (rowIdx === numRows - 1 && !isBorderExplicitlyNone(cb.bottom)) {
          allCellsHaveNoBottom = false;
        }
        if (colIdx === 0 && !isBorderExplicitlyNone(cb.left)) {
          allCellsHaveNoLeft = false;
        }
        if (colIdx === numCols - 1 && !isBorderExplicitlyNone(cb.right)) {
          allCellsHaveNoRight = false;
        }
        if (rowIdx < numRows - 1 && !isBorderExplicitlyNone(cb.bottom)) {
          allCellsHaveNoInsideH = false;
        }
        if (rowIdx > 0 && !isBorderExplicitlyNone(cb.top)) {
          allCellsHaveNoInsideH = false;
        }
        if (colIdx < numCols - 1 && !isBorderExplicitlyNone(cb.right)) {
          allCellsHaveNoInsideV = false;
        }
        if (colIdx > 0 && !isBorderExplicitlyNone(cb.left)) {
          allCellsHaveNoInsideV = false;
        }
      } else {
        // Cell doesn't define borders - can't override table borders
        if (rowIdx === 0) allCellsHaveNoTop = false;
        if (rowIdx === numRows - 1) allCellsHaveNoBottom = false;
        if (colIdx === 0) allCellsHaveNoLeft = false;
        if (colIdx === numCols - 1) allCellsHaveNoRight = false;
        allCellsHaveNoInsideH = false;
        allCellsHaveNoInsideV = false;
      }
    }
  }

  // If cells already detected visible borders, return early
  if (hasAnyBorder(info)) {
    return info;
  }

  // Fall back to table borders
  const borders = table.tblPr?.tblBorders;
  if (borders) {
    if (!allCellsHaveNoTop) info.top = isBorderVisible(borders.top);
    if (!allCellsHaveNoBottom) info.bottom = isBorderVisible(borders.bottom);
    if (!allCellsHaveNoLeft) info.left = isBorderVisible(borders.left);
    if (!allCellsHaveNoRight) info.right = isBorderVisible(borders.right);
    if (!allCellsHaveNoInsideH) info.insideH = isBorderVisible(borders.insideH);
    if (!allCellsHaveNoInsideV) info.insideV = isBorderVisible(borders.insideV);
  }

  return info;
}

/**
 * Check if table has visible borders.
 *
 * @param table - Table element
 * @returns True if table has visible borders
 */
export function hasVisibleBorders(table: Table): boolean {
  return hasAnyBorder(detectBorders(table));
}

// =============================================================================
// ASCII Box Mode
// =============================================================================

/**
 * Convert table to ASCII box format with partial border support.
 *
 * @param table - Table element
 * @param borderInfo - Optional border info (detected if not provided)
 * @returns ASCII box representation matching actual borders
 */
export function tableToAscii(table: Table, borderInfo?: BorderInfo): string {
  if (!table.tr || table.tr.length === 0) {
    return '';
  }

  // Detect borders if not provided
  const borders = borderInfo ?? detectBorders(table);

  // Extract all cell contents and calculate column widths
  const rowsData: string[][] = [];
  let maxCols = 0;

  for (const row of table.tr) {
    const cells: string[] = [];
    if (row.tc) {
      for (const cell of row.tc) {
        let text = cellToText(cell);
        // Replace newlines in cell with space for single-line cells
        text = text.replace(/\n/g, ' ');
        cells.push(text);
      }
    }
    rowsData.push(cells);
    maxCols = Math.max(maxCols, cells.length);
  }

  if (rowsData.length === 0) {
    return '';
  }

  // Pad rows to have same number of columns
  for (const row of rowsData) {
    while (row.length < maxCols) {
      row.push('');
    }
  }

  // Calculate column widths
  const colWidths: number[] = [];
  for (let colIdx = 0; colIdx < maxCols; colIdx++) {
    let maxWidth = 1; // Minimum width
    for (const row of rowsData) {
      if (colIdx < row.length) {
        maxWidth = Math.max(maxWidth, row[colIdx].length);
      }
    }
    colWidths.push(maxWidth);
  }

  // Build ASCII table with partial borders
  const lines: string[] = [];

  const hChar = '-';
  const corner = '+';

  // Helper to build horizontal line
  const buildHLine = (left: boolean, right: boolean, insideV: boolean): string => {
    let inner: string;
    if (insideV) {
      inner = colWidths.map(w => hChar.repeat(w + 2)).join(corner);
    } else {
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + 3 * (maxCols - 1) + 2;
      inner = hChar.repeat(totalWidth);
    }
    const leftChar = left ? corner : hChar;
    const rightChar = right ? corner : hChar;
    return leftChar + inner + rightChar;
  };

  // Helper to build data row
  const buildDataRow = (row: string[], left: boolean, right: boolean, insideV: boolean): string => {
    const cells: string[] = [];
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const width = colWidths[colIdx];
      cells.push(` ${row[colIdx].padEnd(width)} `);
    }

    let inner: string;
    if (insideV) {
      inner = cells.join('|');
    } else {
      inner = cells.join(' ');
    }

    const leftChar = left ? '|' : ' ';
    const rightChar = right ? '|' : ' ';
    return leftChar + inner + rightChar;
  };

  // Top border (only if has top border)
  if (borders.top) {
    lines.push(buildHLine(borders.left, borders.right, borders.insideV));
  }

  // Data rows
  for (let rowIdx = 0; rowIdx < rowsData.length; rowIdx++) {
    const row = rowsData[rowIdx];

    // Row content
    lines.push(buildDataRow(row, borders.left, borders.right, borders.insideV));

    // Row separator (between rows) - only if has insideH border
    if (rowIdx < rowsData.length - 1 && borders.insideH) {
      lines.push(buildHLine(borders.left, borders.right, borders.insideV));
    }
  }

  // Bottom border (only if has bottom border)
  if (borders.bottom) {
    lines.push(buildHLine(borders.left, borders.right, borders.insideV));
  }

  return lines.join('\n');
}

// =============================================================================
// Tab-Separated Mode
// =============================================================================

/**
 * Convert table to tab-separated format.
 *
 * @param table - Table element
 * @returns Tab-separated representation
 */
export function tableToTabs(table: Table): string {
  if (!table.tr || table.tr.length === 0) {
    return '';
  }

  const lines: string[] = [];
  for (const row of table.tr) {
    const line = rowToText(row, '\t');
    lines.push(line);
  }

  return lines.join('\n');
}

// =============================================================================
// Plain Text Mode
// =============================================================================

/**
 * Convert table to plain text format.
 *
 * @param table - Table element
 * @returns Plain text representation
 */
export function tableToPlain(table: Table): string {
  if (!table.tr || table.tr.length === 0) {
    return '';
  }

  const lines: string[] = [];
  for (const row of table.tr) {
    const line = rowToText(row, '  ');
    lines.push(line);
  }

  return lines.join('\n');
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Convert a Table to text.
 *
 * @param table - Table element or null
 * @param mode - Table rendering mode (ascii, tabs, plain, auto)
 * @returns Text representation of the table
 */
export function tableToText(table: Table | null | undefined, mode: TableMode = 'auto'): string {
  if (!table || !table.tr || table.tr.length === 0) {
    return '';
  }

  // Determine actual mode for auto
  let actualMode: TableMode = mode;
  if (mode === 'auto') {
    actualMode = hasVisibleBorders(table) ? 'ascii' : 'tabs';
  }

  // Convert based on mode
  if (actualMode === 'ascii') {
    if (mode === 'ascii') {
      // Explicit ascii mode: use full borders
      const fullBorders = createBorderInfo({
        top: true,
        bottom: true,
        left: true,
        right: true,
        insideH: true,
        insideV: true,
      });
      return tableToAscii(table, fullBorders);
    } else {
      // Auto mode with borders: use detected partial borders
      return tableToAscii(table);
    }
  } else if (actualMode === 'tabs') {
    return tableToTabs(table);
  } else {
    return tableToPlain(table);
  }
}

// =============================================================================
// Table to Text Converter Class
// =============================================================================

/**
 * Converter for Table elements to plain text.
 */
export class TableToTextConverter {
  mode: TableMode;

  constructor(options?: { mode?: TableMode }) {
    this.mode = options?.mode ?? 'auto';
  }

  /**
   * Convert a Table to text.
   *
   * @param table - Table element or null
   * @returns Text representation
   */
  convert(table: Table | null | undefined): string {
    return tableToText(table, this.mode);
  }
}
