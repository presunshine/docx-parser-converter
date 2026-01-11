/**
 * Table to HTML converter.
 *
 * Converts Table elements to HTML table structure.
 * Matches Python: converters/html/table_to_html.py
 */

import type { Table } from '../../models/document/table';
import type { TableRow } from '../../models/document/table';
import type { TableCell } from '../../models/document/table';
import type { TableBorders } from '../../models/common/border';
import type { Paragraph } from '../../models/document/paragraph';
import { tableCellPropertiesToCss, widthToCss, twipsToPt, borderToCss, formatPtValue } from './css-generator';
import { paragraphToHtml } from './paragraph-to-html';
import type { StyleResolver } from '../common/style-resolver';

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface TableToHTMLConverterOptions {
  useInlineStyles?: boolean;
  useClasses?: boolean;
  minimalOutput?: boolean;
  useSemanticTags?: boolean;
}

/**
 * Check if a cell is a merged cell (vMerge continuation).
 */
export function isMergedCell(cell: TableCell | null): boolean {
  if (!cell || !cell.tcPr) return false;
  const vMerge = cell.tcPr.vMerge;
  // vMerge is 'restart' for first cell, 'continue' or '' for continuation cells
  return vMerge !== null && vMerge !== undefined && vMerge !== 'restart';
}

/**
 * Calculate rowspans for vertically merged cells.
 * Returns a map of "row,col" -> rowspan value.
 */
export function calculateRowspans(table: Table | null): Map<string, number> {
  const rowspans = new Map<string, number>();

  if (!table || !table.tr) return rowspans;

  const rows = table.tr;
  const numRows = rows.length;

  // For each cell, track rowspan
  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const row = rows[rowIdx];
    if (!row.tc) continue;

    let colIdx = 0;
    for (const cell of row.tc) {
      // Skip this column position if it's covered by a rowspan from above
      while (rowspans.has(`${rowIdx},${colIdx}`) && rowspans.get(`${rowIdx},${colIdx}`)! < 0) {
        colIdx++;
      }

      const tcPr = cell.tcPr;
      const gridSpan = tcPr?.gridSpan ?? 1;

      if (tcPr?.vMerge === 'restart') {
        // Start counting rowspan
        let span = 1;
        for (let nextRow = rowIdx + 1; nextRow < numRows; nextRow++) {
          const nextRowCells = rows[nextRow].tc;
          if (!nextRowCells) break;

          // Find the cell at this column position
          let nextColIdx = 0;
          let found = false;
          for (const nextCell of nextRowCells) {
            if (nextColIdx === colIdx) {
              const nextVMerge = nextCell.tcPr?.vMerge;
              // vMerge is 'continue' for continuation cells, 'restart' starts a new span
              if (nextVMerge !== undefined && nextVMerge !== null && nextVMerge !== 'restart') {
                span++;
                found = true;
              }
              break;
            }
            nextColIdx += nextCell.tcPr?.gridSpan ?? 1;
          }
          if (!found) break;
        }
        rowspans.set(`${rowIdx},${colIdx}`, span);
      }

      colIdx += gridSpan;
    }
  }

  return rowspans;
}

/**
 * Calculate the number of columns in a table.
 */
function calculateNumCols(table: Table): number {
  if (table.tblGrid?.gridCol) {
    return table.tblGrid.gridCol.length;
  }
  // Fall back to counting cells in first row
  if (table.tr && table.tr.length > 0) {
    const firstRow = table.tr[0];
    if (firstRow.tc) {
      let cols = 0;
      for (const cell of firstRow.tc) {
        cols += cell.tcPr?.gridSpan ?? 1;
      }
      return cols;
    }
  }
  return 1;
}

/**
 * Converts a Table element to HTML.
 */
export function tableToHtml(
  table: Table | null | undefined,
  options?: {
    relationships?: Record<string, string>;
    styleResolver?: StyleResolver | null;
    useInlineStyles?: boolean;
    useClasses?: boolean;
    minimalOutput?: boolean;
  }
): string {
  if (!table) return '';

  const tblPr = table.tblPr;
  const tblGrid = table.tblGrid;
  const useInlineStyles = options?.useInlineStyles ?? true;

  // Calculate rowspans
  const rowspans = calculateRowspans(table);

  // Calculate dimensions for border positioning
  const numRows = table.tr?.length ?? 0;
  const numCols = calculateNumCols(table);

  // Build table CSS - order matches Python: width, margin, table-layout, border-collapse
  const tableCss: Record<string, string> = {};

  // Table width
  if (tblPr?.tblW) {
    const width = widthToCss(tblPr.tblW);
    if (width) {
      tableCss['width'] = width;
    }
  }

  // Table alignment
  if (tblPr?.jc) {
    if (tblPr.jc === 'center') {
      tableCss['margin-left'] = 'auto';
      tableCss['margin-right'] = 'auto';
    } else if (tblPr.jc === 'right') {
      tableCss['margin-left'] = 'auto';
    }
  }

  // Table indentation
  if (tblPr?.tblInd) {
    const indent = widthToCss(tblPr.tblInd);
    if (indent) {
      tableCss['margin-left'] = indent;
    }
  }

  // Table layout
  if (tblPr?.tblLayout) {
    if (tblPr.tblLayout === 'fixed') {
      tableCss['table-layout'] = 'fixed';
    } else {
      tableCss['table-layout'] = 'auto';
    }
  }

  // Border collapse (always use for DOCX tables) - added last to match Python order
  tableCss['border-collapse'] = 'collapse';

  // Note: Table borders are NOT applied to the table element.
  // They are applied to edge cells instead (in cellToHtml).

  // Build table attributes
  const tableAttrs: string[] = [];
  if (useInlineStyles && Object.keys(tableCss).length > 0) {
    const styleStr = Object.entries(tableCss)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    tableAttrs.push(`style="${styleStr}"`);
  }

  const tableAttrStr = tableAttrs.length > 0 ? ' ' + tableAttrs.join(' ') : '';

  // Build caption if present
  let captionHtml = '';
  if (tblPr?.tblCaption) {
    captionHtml = `<caption>${escapeHtml(tblPr.tblCaption)}</caption>`;
  }

  // Build colgroup
  let colgroupHtml = '';
  if (tblGrid?.gridCol && tblGrid.gridCol.length > 0) {
    const colsHtml = tblGrid.gridCol
      .map((col) => {
        if (col.w) {
          const widthPt = twipsToPt(col.w);
          // Format with .0 suffix for integer values to match Python
          const widthStr = widthPt !== null ? formatPtValue(widthPt) : '0pt';
          return `<col style="width: ${widthStr}">`;
        }
        return '<col>';
      })
      .join('');
    colgroupHtml = `<colgroup>${colsHtml}</colgroup>`;
  }

  // Extract table borders for cell-level application
  const tblBorders = tblPr?.tblBorders;

  // Build rows - separate header rows and body rows
  let theadHtml = '';
  let tbodyHtml = '';

  if (table.tr) {
    const headerRowsHtml: string[] = [];
    const bodyRowsHtml: string[] = [];

    table.tr.forEach((row, rowIdx) => {
      const isHeader = row.trPr?.tblHeader === true;
      const rowHtml = rowToHtml(row, rowIdx, rowspans, table, {
        ...options,
        numRows,
        numCols,
        tblBorders,
        isHeader,
      });

      if (isHeader) {
        headerRowsHtml.push(rowHtml);
      } else {
        bodyRowsHtml.push(rowHtml);
      }
    });

    if (headerRowsHtml.length > 0) {
      theadHtml = `<thead>${headerRowsHtml.join('')}</thead>`;
    }

    // Match Python: only use tbody if there are header rows
    if (bodyRowsHtml.length > 0) {
      if (headerRowsHtml.length > 0) {
        tbodyHtml = `<tbody>${bodyRowsHtml.join('')}</tbody>`;
      } else {
        // No header rows - output body rows directly without tbody wrapper
        tbodyHtml = bodyRowsHtml.join('');
      }
    }
  }

  return `<table${tableAttrStr}>${captionHtml}${colgroupHtml}${theadHtml}${tbodyHtml}</table>`;
}

/**
 * Converts a table row to HTML.
 */
function rowToHtml(
  row: TableRow | null,
  rowIdx: number,
  rowspans: Map<string, number>,
  table: Table,
  options?: {
    relationships?: Record<string, string>;
    styleResolver?: StyleResolver | null;
    useInlineStyles?: boolean;
    numRows?: number;
    numCols?: number;
    tblBorders?: TableBorders | null;
    isHeader?: boolean;
  }
): string {
  if (!row) return '';

  const trPr = row.trPr;
  const useInlineStyles = options?.useInlineStyles ?? true;
  const numRows = options?.numRows ?? table.tr?.length ?? 0;
  const numCols = options?.numCols ?? calculateNumCols(table);
  const tblBorders = options?.tblBorders;

  // Build row CSS
  const rowCss: Record<string, string> = {};

  // Row height
  if (trPr?.trHeight) {
    const height = trPr.trHeight;
    if (height.val) {
      const heightPt = twipsToPt(height.val);
      if (height.hRule === 'exact') {
        rowCss['height'] = `${heightPt}pt`;
      } else {
        rowCss['min-height'] = `${heightPt}pt`;
      }
    }
  }

  // Row can't split across pages
  if (trPr?.cantSplit) {
    rowCss['break-inside'] = 'avoid';
  }

  // Build row attributes
  const rowAttrs: string[] = [];
  if (useInlineStyles && Object.keys(rowCss).length > 0) {
    const styleStr = Object.entries(rowCss)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    rowAttrs.push(`style="${styleStr}"`);
  }

  const rowAttrStr = rowAttrs.length > 0 ? ' ' + rowAttrs.join(' ') : '';

  // Build cells
  let cellsHtml = '';
  if (row.tc) {
    let colIdx = 0;
    for (const cell of row.tc) {
      // Skip merged cells (vMerge continuation)
      if (isMergedCell(cell)) {
        colIdx += cell.tcPr?.gridSpan ?? 1;
        continue;
      }

      cellsHtml += cellToHtml(cell, rowIdx, colIdx, rowspans, table, {
        ...options,
        numRows,
        numCols,
        tblBorders,
      });
      colIdx += cell.tcPr?.gridSpan ?? 1;
    }
  }

  return `<tr${rowAttrStr}>${cellsHtml}</tr>`;
}

/**
 * Converts a table cell to HTML.
 */
function cellToHtml(
  cell: TableCell | null,
  rowIdx: number,
  colIdx: number,
  rowspans: Map<string, number>,
  table: Table,
  options?: {
    relationships?: Record<string, string>;
    styleResolver?: StyleResolver | null;
    useInlineStyles?: boolean;
    numRows?: number;
    numCols?: number;
    tblBorders?: TableBorders | null;
    isHeader?: boolean;
  }
): string {
  const isHeader = options?.isHeader ?? false;
  const cellTag = isHeader ? 'th' : 'td';

  if (!cell) return `<${cellTag}></${cellTag}>`;

  const tcPr = cell.tcPr;
  const useInlineStyles = options?.useInlineStyles ?? true;
  const numRows = options?.numRows ?? table.tr?.length ?? 0;
  const numCols = options?.numCols ?? calculateNumCols(table);
  const tblBorders = options?.tblBorders;

  // Build cell CSS from cell properties
  const cellCss = tableCellPropertiesToCss(tcPr);

  // Calculate effective spans for border position logic
  const gridSpan = tcPr?.gridSpan ?? 1;
  const rowspan = rowspans.get(`${rowIdx},${colIdx}`) ?? 1;

  // Apply outer borders to edge cells (from table-level tblBorders)
  // Only apply if cell doesn't already have that border defined (tcBorders override)
  // This matches Word behavior where cell-level tcBorders can override tblBorders

  // Top border: apply to cells in the first row
  if (tblBorders?.top && rowIdx === 0) {
    if (!cellCss['border-top']) {
      const borderCss = borderToCss(tblBorders.top);
      if (borderCss) {
        cellCss['border-top'] = borderCss;
      }
    }
  }

  // Bottom border: apply to cells that reach the last row
  if (tblBorders?.bottom && (rowIdx + rowspan) === numRows) {
    if (!cellCss['border-bottom']) {
      const borderCss = borderToCss(tblBorders.bottom);
      if (borderCss) {
        cellCss['border-bottom'] = borderCss;
      }
    }
  }

  // Left border: apply to cells in the first column
  if (tblBorders?.left && colIdx === 0) {
    if (!cellCss['border-left']) {
      const borderCss = borderToCss(tblBorders.left);
      if (borderCss) {
        cellCss['border-left'] = borderCss;
      }
    }
  }

  // Right border: apply to cells that reach the last column
  if (tblBorders?.right && (colIdx + gridSpan) === numCols) {
    if (!cellCss['border-right']) {
      const borderCss = borderToCss(tblBorders.right);
      if (borderCss) {
        cellCss['border-right'] = borderCss;
      }
    }
  }

  // Apply inside borders based on cell position
  // Only apply if cell doesn't already have that border defined

  // Inside horizontal border: apply as bottom border to cells not in the last row
  // Account for rowspan - a cell spanning to the last row shouldn't get insideH
  if (tblBorders?.insideH && (rowIdx + rowspan) < numRows) {
    if (!cellCss['border-bottom']) {
      const borderCss = borderToCss(tblBorders.insideH);
      if (borderCss) {
        cellCss['border-bottom'] = borderCss;
      }
    }
  }

  // Inside vertical border: apply as right border to cells not in the last column
  // Account for colspan - a cell spanning to the last column shouldn't get insideV
  if (tblBorders?.insideV && (colIdx + gridSpan) < numCols) {
    if (!cellCss['border-right']) {
      const borderCss = borderToCss(tblBorders.insideV);
      if (borderCss) {
        cellCss['border-right'] = borderCss;
      }
    }
  }

  // Build cell attributes
  const cellAttrs: string[] = [];

  // Add scope for header cells
  if (isHeader) {
    cellAttrs.push('scope="col"');
  }

  // Colspan
  if (gridSpan > 1) {
    cellAttrs.push(`colspan="${gridSpan}"`);
  }

  // Rowspan
  const cellRowspan = rowspans.get(`${rowIdx},${colIdx}`);
  if (cellRowspan && cellRowspan > 1) {
    cellAttrs.push(`rowspan="${cellRowspan}"`);
  }

  // Inline styles
  if (useInlineStyles && Object.keys(cellCss).length > 0) {
    const styleStr = Object.entries(cellCss)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    cellAttrs.push(`style="${styleStr}"`);
  }

  const cellAttrStr = cellAttrs.length > 0 ? ' ' + cellAttrs.join(' ') : '';

  // Convert cell content
  let contentHtml = '';
  if (cell.content && cell.content.length > 0) {
    contentHtml = cell.content
      .map((item) => {
        if ('pPr' in item || 'content' in item) {
          return paragraphToHtml(item as Paragraph, {
            relationships: options?.relationships,
            styleResolver: options?.styleResolver,
            useInlineStyles,
          });
        }
        if ('tblPr' in item || 'tr' in item) {
          // Nested table
          return tableToHtml(item as Table, options);
        }
        return '';
      })
      .join('');
  }

  // If cell is empty, add non-breaking space for proper rendering
  if (!contentHtml || !contentHtml.trim()) {
    contentHtml = '&nbsp;';
  }

  return `<${cellTag}${cellAttrStr}>${contentHtml}</${cellTag}>`;
}

/**
 * Converter class for converting tables to HTML.
 */
export class TableToHTMLConverter {
  useInlineStyles: boolean;
  useClasses: boolean;
  minimalOutput: boolean;
  useSemanticTags: boolean;
  relationships: Record<string, string>;
  styleResolver: StyleResolver | null;

  constructor(options?: TableToHTMLConverterOptions) {
    this.useInlineStyles = options?.useInlineStyles ?? true;
    this.useClasses = options?.useClasses ?? false;
    this.minimalOutput = options?.minimalOutput ?? false;
    this.useSemanticTags = options?.useSemanticTags ?? false;
    this.relationships = {};
    this.styleResolver = null;
  }

  /**
   * Set relationships for hyperlink resolution.
   */
  setRelationships(relationships: Record<string, string>): void {
    this.relationships = relationships;
  }

  /**
   * Set style resolver for style resolution.
   */
  setStyleResolver(styleResolver: StyleResolver | null): void {
    this.styleResolver = styleResolver;
  }

  /**
   * Convert a table to HTML.
   */
  convert(table: Table | null): string {
    return tableToHtml(table, {
      relationships: this.relationships,
      styleResolver: this.styleResolver,
      useInlineStyles: this.useInlineStyles,
      useClasses: this.useClasses,
      minimalOutput: this.minimalOutput,
    });
  }

  /**
   * Convert a single row to HTML.
   */
  convertRow(row: TableRow | null): string {
    if (!row) return '<tr></tr>';

    // Build a minimal table context for standalone row conversion
    const table: Table = { tr: [row] };
    const rowspans = calculateRowspans(table);

    return rowToHtml(row, 0, rowspans, table, {
      relationships: this.relationships,
      styleResolver: this.styleResolver,
      useInlineStyles: this.useInlineStyles,
      numRows: 1,
      numCols: row.tc ? row.tc.reduce((sum, c) => sum + (c.tcPr?.gridSpan ?? 1), 0) : 1,
    });
  }

  /**
   * Convert a single cell to HTML.
   */
  convertCell(cell: TableCell | null): string {
    if (!cell) return '<td></td>';

    // Build a minimal table context for standalone cell conversion
    const table: Table = { tr: [{ tc: [cell] }] };
    const rowspans = calculateRowspans(table);

    return cellToHtml(cell, 0, 0, rowspans, table, {
      relationships: this.relationships,
      styleResolver: this.styleResolver,
      useInlineStyles: this.useInlineStyles,
      numRows: 1,
      numCols: cell.tcPr?.gridSpan ?? 1,
    });
  }
}
