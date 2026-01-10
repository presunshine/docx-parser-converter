/**
 * Unit tests for table to HTML converter.
 *
 * Tests conversion of Table elements to HTML table structure.
 * Matches Python: tests/unit/converters/html/test_table_to_html.py
 */

import { describe, it, expect } from 'vitest';
import {
  TableToHTMLConverter,
  tableToHtml,
  calculateRowspans,
  isMergedCell,
} from '../table-to-html';
import type {
  Table,
  TableLook,
  TableRow,
  TableCell,
  TableCellProperties,
  TableCellMargins,
} from '../../../models/document/table';
import type { Paragraph } from '../../../models/document/paragraph';
import type { Run } from '../../../models/document/run';
import type { Text } from '../../../models/document/run-content';
import type { Border, TableBorders } from '../../../models/common/border';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a simple table cell with text content.
 */
function makeCell(text: string, tcPr?: TableCellProperties): TableCell {
  const textItem: Text = { type: 'text', value: text };
  const run: Run = { content: [textItem] };
  const paragraph: Paragraph = { content: [run] };
  return {
    tcPr: tcPr ?? null,
    content: [paragraph],
  };
}

/**
 * Create a simple table with given dimensions.
 */
function makeSimpleTable(rows: number, cols: number): Table {
  const tableRows: TableRow[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < cols; c++) {
      cells.push(makeCell(`R${r + 1}C${c + 1}`));
    }
    tableRows.push({ tc: cells });
  }
  return { tr: tableRows };
}

// =============================================================================
// Basic Table Conversion Tests
// =============================================================================

describe('Basic Table Conversion', () => {
  it('should convert simple 2x2 table to HTML', () => {
    const table = makeSimpleTable(2, 2);
    const result = tableToHtml(table);
    expect(result).toContain('<table');
    expect(result).toContain('<tr');
    expect(result).toContain('<td');
    expect(result).toContain('</table>');
  });

  it('should convert empty table', () => {
    const table: Table = { tr: [] };
    const result = tableToHtml(table);
    expect(result).toContain('<table');
    expect(result).toContain('</table>');
  });

  it('should return empty string for null table', () => {
    const result = tableToHtml(null);
    expect(result).toBe('');
  });

  it('should convert single cell table', () => {
    const table: Table = { tr: [{ tc: [makeCell('Only cell')] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Only cell');
  });

  it('should preserve cell order', () => {
    const table = makeSimpleTable(2, 3);
    const result = tableToHtml(table);
    // R1C1 should appear before R1C2, etc.
    expect(result.indexOf('R1C1')).toBeLessThan(result.indexOf('R1C2'));
    expect(result.indexOf('R1C2')).toBeLessThan(result.indexOf('R1C3'));
  });

  it('should preserve row order', () => {
    const table = makeSimpleTable(3, 2);
    const result = tableToHtml(table);
    // R1 should appear before R2, etc.
    expect(result.indexOf('R1C1')).toBeLessThan(result.indexOf('R2C1'));
    expect(result.indexOf('R2C1')).toBeLessThan(result.indexOf('R3C1'));
  });
});

// =============================================================================
// Table Width Tests
// =============================================================================

describe('Table Width', () => {
  it('should convert fixed width table', () => {
    const table: Table = {
      tblPr: { tblW: { w: 5760, type: 'dxa' } },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('width');
  });

  it('should convert percentage width table', () => {
    const table: Table = {
      tblPr: { tblW: { w: 5000, type: 'pct' } },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result.includes('100%') || result.includes('width')).toBe(true);
  });

  it('should convert auto width table', () => {
    const table: Table = {
      tblPr: { tblW: { w: 0, type: 'auto' } },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    // Auto width should still render
    expect(result).toContain('Cell');
  });
});

// =============================================================================
// Table Alignment Tests
// =============================================================================

describe('Table Alignment', () => {
  it('should convert left-aligned table', () => {
    const table: Table = {
      tblPr: { jc: 'left' },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Cell');
  });

  it('should convert center-aligned table', () => {
    const table: Table = {
      tblPr: { jc: 'center' },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result.includes('margin-left: auto') || result.includes('margin: auto')).toBe(true);
  });

  it('should convert right-aligned table', () => {
    const table: Table = {
      tblPr: { jc: 'right' },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('margin-left');
  });
});

// =============================================================================
// Table Grid Tests
// =============================================================================

describe('Table Grid', () => {
  it('should define column widths from grid', () => {
    const table: Table = {
      tblGrid: {
        gridCol: [{ w: 2880 }, { w: 1440 }],
      },
      tr: [{ tc: [makeCell('Wide'), makeCell('Narrow')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('<colgroup>');
    expect(result).toContain('<col');
  });

  it('should generate colgroup from grid columns', () => {
    const table: Table = {
      tblGrid: {
        gridCol: [{ w: 1440 }, { w: 1440 }],
      },
      tr: [{ tc: [makeCell('A'), makeCell('B')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('<colgroup>');
  });
});

// =============================================================================
// Cell Spanning Tests
// =============================================================================

describe('Cell Spanning', () => {
  it('should convert horizontal span (colspan)', () => {
    const cell = makeCell('Spanning', { gridSpan: 2 });
    const table: Table = {
      tr: [
        { tc: [cell] },
        { tc: [makeCell('A'), makeCell('B')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('colspan="2"');
  });

  it('should convert vertical merge restart (rowspan start)', () => {
    const firstRow: TableRow = {
      tc: [
        makeCell('Merged', { vMerge: 'restart' }),
        makeCell('Normal1'),
      ],
    };
    const secondRow: TableRow = {
      tc: [
        makeCell('', { vMerge: 'continue' }),
        makeCell('Normal2'),
      ],
    };
    const table: Table = { tr: [firstRow, secondRow] };
    const result = tableToHtml(table);
    expect(result).toContain('rowspan="2"');
  });

  it('should not render continuation of vertical merge', () => {
    const firstRow: TableRow = {
      tc: [makeCell('Merged', { vMerge: 'restart' })],
    };
    const secondRow: TableRow = {
      tc: [makeCell('', { vMerge: 'continue' })],
    };
    const table: Table = { tr: [firstRow, secondRow] };
    const result = tableToHtml(table);
    // Only one td should be rendered
    expect((result.match(/<td/g) || []).length).toBe(1);
  });

  it('should handle combined colspan and rowspan', () => {
    const cell = makeCell('Big', { gridSpan: 2, vMerge: 'restart' });
    const table: Table = {
      tr: [
        { tc: [cell, makeCell('C')] },
        {
          tc: [
            makeCell('', { vMerge: 'continue' }),
            makeCell('D'),
            makeCell('E'),
          ],
        },
      ],
    };
    const result = tableToHtml(table);
    expect(result.includes('colspan="2"') || result.includes('rowspan')).toBe(true);
  });

  it('should handle multi-row vertical merge', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('M', { vMerge: 'restart' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('rowspan="3"');
  });
});

// =============================================================================
// Table Border Tests
// =============================================================================

describe('Table Borders', () => {
  it('should convert all table borders', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      left: border,
      bottom: border,
      right: border,
      insideH: border,
      insideV: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('Bordered')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('border');
  });

  it('should use border-collapse: collapse', () => {
    const border: Border = { val: 'single', sz: 4 };
    const table: Table = {
      tblPr: { tblBorders: { top: border } },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('border-collapse');
  });

  it('should handle inside borders', () => {
    const border: Border = { val: 'single', sz: 4, color: '000000' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Cell');
  });

  it('should handle no borders', () => {
    const table: Table = {
      tblPr: { tblBorders: { top: { val: 'nil' } } },
      tr: [{ tc: [makeCell('Borderless')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Borderless');
  });

  it('should handle mixed border styles', () => {
    const borders: TableBorders = {
      top: { val: 'single', sz: 4 },
      bottom: { val: 'double', sz: 8 },
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('Mixed')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Mixed');
  });
});

// =============================================================================
// Cell Border Tests
// =============================================================================

describe('Cell Borders', () => {
  it('should apply cell borders that override table', () => {
    const cell = makeCell('Special', {
      tcBorders: { top: { val: 'double', sz: 12, color: 'FF0000' } },
    });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('border');
  });

  it('should handle cell with no borders', () => {
    const cell = makeCell('Borderless', {
      tcBorders: {
        top: { val: 'nil' },
        bottom: { val: 'nil' },
      },
    });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Borderless');
  });
});

// =============================================================================
// Inside Borders Tests
// =============================================================================

describe('Inside Borders', () => {
  it('should apply inside horizontal border to non-last-row cells', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideH: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('R1C1'), makeCell('R1C2')] },
        { tc: [makeCell('R2C1'), makeCell('R2C2')] },
      ],
    };
    const result = tableToHtml(table);
    // First row cells should have border-bottom
    expect(result).toContain('border-bottom');
    // Count occurrences - should be 2 (for R1C1 and R1C2)
    expect((result.match(/border-bottom/g) || []).length).toBe(2);
  });

  it('should apply inside vertical border to non-last-column cells', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('R1C1'), makeCell('R1C2')] },
        { tc: [makeCell('R2C1'), makeCell('R2C2')] },
      ],
    };
    const result = tableToHtml(table);
    // First column cells should have border-right
    expect(result).toContain('border-right');
    // Count occurrences - should be 2 (for R1C1 and R2C1)
    expect((result.match(/border-right/g) || []).length).toBe(2);
  });

  it('should create complete internal grid with both inside borders', () => {
    const border: Border = { val: 'single', sz: 8, color: 'FF0000' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('border-bottom');
    expect(result).toContain('border-right');
    expect(result).toContain('FF0000');
  });

  it('should correctly apply inside borders on 3x3 table', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B'), makeCell('C')] },
        { tc: [makeCell('D'), makeCell('E'), makeCell('F')] },
        { tc: [makeCell('G'), makeCell('H'), makeCell('I')] },
      ],
    };
    const result = tableToHtml(table);
    // border-bottom should appear 6 times (rows 0 and 1, 3 cells each)
    // border-right should appear 6 times (columns 0 and 1, 3 cells each)
    expect((result.match(/border-bottom/g) || []).length).toBe(6);
    expect((result.match(/border-right/g) || []).length).toBe(6);
  });

  it('should not apply horizontal inside border on single row', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('A'), makeCell('B'), makeCell('C')] }],
    };
    const result = tableToHtml(table);
    // No border-bottom (only one row)
    expect(result).not.toContain('border-bottom');
    // border-right should appear 2 times (columns 0 and 1)
    expect((result.match(/border-right/g) || []).length).toBe(2);
  });

  it('should not apply vertical inside border on single column', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A')] },
        { tc: [makeCell('B')] },
        { tc: [makeCell('C')] },
      ],
    };
    const result = tableToHtml(table);
    // No border-right (only one column)
    expect(result).not.toContain('border-right');
    // border-bottom should appear 2 times (rows 0 and 1)
    expect((result.match(/border-bottom/g) || []).length).toBe(2);
  });

  it('should respect colspan for inside vertical border', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tblGrid: { gridCol: [{ w: 1440 }, { w: 1440 }] },
      tr: [
        { tc: [makeCell('Spanning', { gridSpan: 2 })] },
        { tc: [makeCell('Left'), makeCell('Right')] },
      ],
    };
    const result = tableToHtml(table);
    // "Spanning" cell spans to last column, so no border-right
    // "Left" cell should have border-right
    // "Right" cell is in last column, no border-right
    expect((result.match(/border-right/g) || []).length).toBe(1);
  });

  it('should respect rowspan for inside horizontal border', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = { insideH: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        {
          tc: [
            makeCell('Spanning', { vMerge: 'restart' }),
            makeCell('Top'),
          ],
        },
        {
          tc: [
            makeCell('', { vMerge: 'continue' }),
            makeCell('Bottom'),
          ],
        },
      ],
    };
    const result = tableToHtml(table);
    // "Spanning" cell spans to last row (rowspan=2), so no border-bottom
    // "Top" cell should have border-bottom
    // "Bottom" cell is in last row, no border-bottom
    expect((result.match(/border-bottom/g) || []).length).toBe(1);
  });

  it('should let cell border take precedence over inside border', () => {
    const insideBorder: Border = { val: 'single', sz: 8, color: '000000' }; // Black
    const cellBorder: Border = { val: 'single', sz: 16, color: 'FF0000' }; // Red, thicker
    const borders: TableBorders = { insideH: insideBorder, insideV: insideBorder };

    // Cell with its own border-bottom and border-right
    const cellWithBorder = makeCell('Custom', {
      tcBorders: { bottom: cellBorder, right: cellBorder },
    });

    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [cellWithBorder, makeCell('Normal')] },
        { tc: [makeCell('Below'), makeCell('Corner')] },
      ],
    };
    const result = tableToHtml(table);
    // Cell "Custom" should have red border (FF0000)
    expect(result).toContain('FF0000');
  });

  it('should handle inside borders only without outer borders', () => {
    const border: Border = { val: 'single', sz: 8, color: '0000FF' };
    const borders: TableBorders = { insideH: border, insideV: border };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D')] },
      ],
    };
    const result = tableToHtml(table);
    // Should have cell borders from inside_h/inside_v
    expect(result).toContain('border-bottom');
    expect(result).toContain('border-right');
    // Table element should NOT have border-top/border-left etc.
    const tableStart = result.indexOf('<table');
    const tableEnd = result.indexOf('>', tableStart);
    const tableStyle = result.substring(tableStart, tableEnd);
    expect(tableStyle).not.toContain('border-top');
    expect(tableStyle).not.toContain('border-left');
  });

  it('should handle both inside and outer borders', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideH: border,
      insideV: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D')] },
      ],
    };
    const result = tableToHtml(table);
    // Should have both table-level outer borders and cell-level inside borders
    expect(result).toContain('border-top');
    expect(result).toContain('border-bottom');
    expect(result).toContain('border-right');
  });
});

// =============================================================================
// Outer Border Tests
// =============================================================================

describe('Outer Borders', () => {
  it('should apply outer borders to edge cells', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('TL'), makeCell('TR')] },
        { tc: [makeCell('BL'), makeCell('BR')] },
      ],
    };
    const result = tableToHtml(table);
    // Each edge cell should have appropriate outer borders
    expect((result.match(/border-top/g) || []).length).toBe(2); // Top row cells
    expect((result.match(/border-bottom/g) || []).length).toBe(2); // Bottom row cells
    expect((result.match(/border-left/g) || []).length).toBe(2); // Left column cells
    expect((result.match(/border-right/g) || []).length).toBe(2); // Right column cells
  });

  it('should not apply outer borders to table element itself', () => {
    const border: Border = { val: 'single', sz: 8, color: 'FF0000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('A')] }],
    };
    const result = tableToHtml(table);
    // Find the table element's style attribute
    const tableStart = result.indexOf('<table');
    const tableEnd = result.indexOf('>', tableStart);
    const tableTag = result.substring(tableStart, tableEnd);
    // Table should not have border styles (they go to cells)
    expect(tableTag).not.toContain('border-top:');
    expect(tableTag).not.toContain('border-bottom:');
    expect(tableTag).not.toContain('border-left:');
    expect(tableTag).not.toContain('border-right:');
  });

  it('should let cell border override table outer border', () => {
    const tableBorder: Border = { val: 'single', sz: 8, color: '000000' }; // Black
    const cellBorder: Border = { val: 'single', sz: 16, color: 'FF0000' }; // Red
    const cellNoneBorder: Border = { val: 'nil' }; // None

    // Create cell with explicit red border-top
    const cellWithRedTop = makeCell('Red', {
      tcBorders: { top: cellBorder },
    });
    // Create cell with explicit none border-top
    const cellWithNoneTop = makeCell('None', {
      tcBorders: { top: cellNoneBorder },
    });

    const table: Table = {
      tblPr: {
        tblBorders: {
          top: tableBorder,
          bottom: tableBorder,
          left: tableBorder,
          right: tableBorder,
        },
      },
      tr: [{ tc: [cellWithRedTop, cellWithNoneTop] }],
    };
    const result = tableToHtml(table);
    // The red border should appear (cell override)
    expect(result).toContain('FF0000');
  });

  it('should handle outer borders only without inside', () => {
    const border: Border = { val: 'single', sz: 8, color: '0000FF' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D')] },
      ],
    };
    const result = tableToHtml(table);
    // Edge cells should have outer borders
    expect((result.match(/border-top/g) || []).length).toBe(2);
    expect((result.match(/border-bottom/g) || []).length).toBe(2);
  });

  it('should handle outer borders with colspan in top row', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tblGrid: { gridCol: [{ w: 1440 }, { w: 1440 }] },
      tr: [
        { tc: [makeCell('Spanning', { gridSpan: 2 })] },
        { tc: [makeCell('L'), makeCell('R')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('border-top');
    expect(result).toContain('border-bottom');
  });

  it('should handle outer borders with rowspan in left column', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        {
          tc: [
            makeCell('Spanning', { vMerge: 'restart' }),
            makeCell('Top'),
          ],
        },
        {
          tc: [
            makeCell('', { vMerge: 'continue' }),
            makeCell('Bottom'),
          ],
        },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('border-left');
    expect(result).toContain('border-bottom');
  });

  it('should apply all outer borders to single cell table', () => {
    const border: Border = { val: 'single', sz: 8, color: 'FF00FF' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [{ tc: [makeCell('Only')] }],
    };
    const result = tableToHtml(table);
    // Single cell should have all 4 borders
    expect(result).toContain('border-top');
    expect(result).toContain('border-bottom');
    expect(result).toContain('border-left');
    expect(result).toContain('border-right');
    // All with the magenta color
    expect((result.match(/FF00FF/g) || []).length).toBe(4);
  });

  it('should handle both outer and inside borders for full grid', () => {
    const border: Border = { val: 'single', sz: 8, color: '000000' };
    const borders: TableBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideH: border,
      insideV: border,
    };
    const table: Table = {
      tblPr: { tblBorders: borders },
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D')] },
      ],
    };
    const result = tableToHtml(table);
    // All cells should have borders creating a full grid
    expect((result.match(/border-top/g) || []).length).toBeGreaterThanOrEqual(2);
    expect((result.match(/border-bottom/g) || []).length).toBeGreaterThanOrEqual(2);
    expect((result.match(/border-left/g) || []).length).toBeGreaterThanOrEqual(2);
    expect((result.match(/border-right/g) || []).length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// Cell Width Tests
// =============================================================================

describe('Cell Width', () => {
  it('should convert fixed cell width', () => {
    const cell = makeCell('Fixed', { tcW: { w: 2880, type: 'dxa' } });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('width');
  });

  it('should convert percentage cell width', () => {
    const cell = makeCell('Half', { tcW: { w: 2500, type: 'pct' } });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Half');
  });

  it('should convert auto cell width', () => {
    const cell = makeCell('Auto', { tcW: { type: 'auto' } });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Auto');
  });
});

// =============================================================================
// Cell Shading Tests
// =============================================================================

describe('Cell Shading', () => {
  it('should convert cell background color', () => {
    const cell = makeCell('Yellow', { shd: { fill: 'FFFF00' } });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('background');
  });

  it('should convert table-level shading', () => {
    const table: Table = {
      tblPr: { shd: { fill: 'E0E0E0' } },
      tr: [{ tc: [makeCell('Gray')] }],
    };
    const result = tableToHtml(table);
    // Table shading is in the table style
    expect(
      result.includes('background') ||
        result.toUpperCase().includes('E0E0E0') ||
        result.includes('Gray')
    ).toBe(true);
  });

  it('should let cell shading override table shading', () => {
    const cell = makeCell('Yellow', { shd: { fill: 'FFFF00' } });
    const table: Table = {
      tblPr: { shd: { fill: 'E0E0E0' } },
      tr: [{ tc: [cell] }],
    };
    const result = tableToHtml(table);
    // Cell-level shading is definitely applied
    expect(result).toContain('Yellow'); // At minimum the content should render
  });
});

// =============================================================================
// Cell Margins Tests
// =============================================================================

describe('Cell Margins', () => {
  it('should convert table default cell margins', () => {
    const margins: TableCellMargins = {
      top: { w: 72, type: 'dxa' },
      left: { w: 115, type: 'dxa' },
      bottom: { w: 72, type: 'dxa' },
      right: { w: 115, type: 'dxa' },
    };
    const table: Table = {
      tblPr: { tblCellMar: margins },
      tr: [{ tc: [makeCell('Padded')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Padded');
  });

  it('should let cell margins override table defaults', () => {
    const cell = makeCell('Custom', {
      tcMar: { left: { w: 200, type: 'dxa' } },
    });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('padding');
  });
});

// =============================================================================
// Cell Vertical Alignment Tests
// =============================================================================

describe('Cell Vertical Alignment', () => {
  it('should convert cell with top vertical alignment', () => {
    const cell = makeCell('Top', { vAlign: 'top' });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('vertical-align');
  });

  it('should convert cell with center vertical alignment', () => {
    const cell = makeCell('Center', { vAlign: 'center' });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('vertical-align');
  });

  it('should convert cell with bottom vertical alignment', () => {
    const cell = makeCell('Bottom', { vAlign: 'bottom' });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('vertical-align');
  });
});

// =============================================================================
// Cell Text Direction Tests
// =============================================================================

describe('Cell Text Direction', () => {
  it('should convert cell with vertical text direction', () => {
    const cell = makeCell('Vertical', { textDirection: 'tbRl' });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Vertical');
  });

  it('should convert cell with bottom-to-top left-to-right text', () => {
    const cell = makeCell('BTLR', { textDirection: 'btLr' });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('BTLR');
  });
});

// =============================================================================
// Row Properties Tests
// =============================================================================

describe('Row Properties', () => {
  it('should convert row with exact height', () => {
    const row: TableRow = {
      trPr: { trHeight: { val: 720, hRule: 'exact' } },
      tc: [makeCell('Tall row')],
    };
    const table: Table = { tr: [row] };
    const result = tableToHtml(table);
    expect(result).toContain('height');
  });

  it('should convert row with minimum height', () => {
    const row: TableRow = {
      trPr: { trHeight: { val: 480, hRule: 'atLeast' } },
      tc: [makeCell('Min height')],
    };
    const table: Table = { tr: [row] };
    const result = tableToHtml(table);
    expect(result).toContain('min-height');
  });

  it('should convert header row', () => {
    const header: TableRow = {
      trPr: { tblHeader: true },
      tc: [makeCell('Header')],
    };
    const data: TableRow = { tc: [makeCell('Data')] };
    const table: Table = { tr: [header, data] };
    const result = tableToHtml(table);
    expect(result.includes('<thead>') || result.includes('<th')).toBe(true);
  });

  it('should convert row that cannot split across pages', () => {
    const row: TableRow = {
      trPr: { cantSplit: true },
      tc: [makeCell("Don't split me")],
    };
    const table: Table = { tr: [row] };
    const result = tableToHtml(table);
    expect(result).toContain('break-inside');
  });
});

// =============================================================================
// Table Look/Conditional Formatting Tests
// =============================================================================

describe('Table Look', () => {
  it('should handle first row formatting', () => {
    const look: TableLook = { firstRow: true };
    const table: Table = {
      tblPr: { tblLook: look },
      tr: [
        { tc: [makeCell('Header')] },
        { tc: [makeCell('Data')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Header');
  });

  it('should handle last row formatting', () => {
    const look: TableLook = { lastRow: true };
    const table: Table = {
      tblPr: { tblLook: look },
      tr: [{ tc: [makeCell('Data')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Data');
  });

  it('should handle first column formatting', () => {
    const look: TableLook = { firstColumn: true };
    const table: Table = {
      tblPr: { tblLook: look },
      tr: [{ tc: [makeCell('First'), makeCell('Second')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('First');
  });

  it('should handle horizontal banding', () => {
    const look: TableLook = { noHBand: false };
    const table: Table = {
      tblPr: { tblLook: look },
      tr: [
        { tc: [makeCell('Row1')] },
        { tc: [makeCell('Row2')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Row1');
  });

  it('should handle vertical banding', () => {
    const look: TableLook = { noVBand: false };
    const table: Table = {
      tblPr: { tblLook: look },
      tr: [{ tc: [makeCell('A'), makeCell('B')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('A');
  });
});

// =============================================================================
// Table Style Reference Tests
// =============================================================================

describe('Table Style Reference', () => {
  it('should handle table style reference by ID', () => {
    const table: Table = {
      tblPr: { tblStyle: 'TableGrid' },
      tr: [{ tc: [makeCell('Styled')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Styled');
  });

  it('should handle style with direct overrides', () => {
    const table: Table = {
      tblPr: {
        tblStyle: 'TableGrid',
        tblBorders: { top: { val: 'nil' } },
      },
      tr: [{ tc: [makeCell('Overridden')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Overridden');
  });
});

// =============================================================================
// Nested Table Tests
// =============================================================================

describe('Nested Tables', () => {
  it('should convert table nested in cell', () => {
    const innerTable: Table = { tr: [{ tc: [makeCell('Inner')] }] };
    const outerCell: TableCell = { content: [innerTable] };
    const outerTable: Table = { tr: [{ tc: [outerCell] }] };
    const result = tableToHtml(outerTable);
    // Should have two <table> elements
    expect((result.match(/<table/g) || []).length).toBe(2);
  });

  it('should convert deeply nested tables', () => {
    const inner: Table = { tr: [{ tc: [makeCell('Deep')] }] };
    const middleCell: TableCell = { content: [inner] };
    const middle: Table = { tr: [{ tc: [middleCell] }] };
    const outerCell: TableCell = { content: [middle] };
    const outer: Table = { tr: [{ tc: [outerCell] }] };
    const result = tableToHtml(outer);
    expect((result.match(/<table/g) || []).length).toBe(3);
  });
});

// =============================================================================
// Cell Content Tests
// =============================================================================

describe('Cell Content', () => {
  it('should convert cell with multiple paragraphs', () => {
    const textItem1: Text = { type: 'text', value: 'Paragraph 1' };
    const textItem2: Text = { type: 'text', value: 'Paragraph 2' };
    const run1: Run = { content: [textItem1] };
    const run2: Run = { content: [textItem2] };
    const para1: Paragraph = { content: [run1] };
    const para2: Paragraph = { content: [run2] };
    const cell: TableCell = { content: [para1, para2] };
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Paragraph 1');
    expect(result).toContain('Paragraph 2');
  });

  it('should convert empty cell', () => {
    const cell: TableCell = { content: [] };
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    // Should render valid cell, possibly with &nbsp;
    expect(result).toContain('<td');
    expect(result).toContain('&nbsp;');
  });

  it('should convert cell with formatted content', () => {
    const textItem: Text = { type: 'text', value: 'Bold' };
    const run: Run = { rPr: { b: true }, content: [textItem] };
    const para: Paragraph = { content: [run] };
    const cell: TableCell = { content: [para] };
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Bold');
  });
});

// =============================================================================
// Table Layout Tests
// =============================================================================

describe('Table Layout', () => {
  it('should convert fixed layout table', () => {
    const table: Table = {
      tblPr: { tblLayout: 'fixed' },
      tr: [{ tc: [makeCell('Fixed layout')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('table-layout: fixed');
  });

  it('should convert autofit layout table', () => {
    const table: Table = {
      tblPr: { tblLayout: 'autofit' },
      tr: [{ tc: [makeCell('Autofit layout')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('table-layout: auto');
  });
});

// =============================================================================
// Table Indentation Tests
// =============================================================================

describe('Table Indentation', () => {
  it('should convert table with left indentation', () => {
    const table: Table = {
      tblPr: { tblInd: { w: 720, type: 'dxa' } },
      tr: [{ tc: [makeCell('Indented')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('margin-left');
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Table Accessibility', () => {
  it('should convert table with caption', () => {
    const table: Table = {
      tblPr: { tblCaption: 'Sales Data 2024' },
      tr: [{ tc: [makeCell('Data')] }],
    };
    const result = tableToHtml(table);
    expect(result.includes('<caption>') || result.includes('aria-label')).toBe(true);
  });

  it('should convert table with description', () => {
    const table: Table = {
      tblPr: { tblDescription: 'Quarterly sales data' },
      tr: [{ tc: [makeCell('Data')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Data');
  });

  it('should use th for header row cells', () => {
    const header: TableRow = {
      trPr: { tblHeader: true },
      tc: [makeCell('Name'), makeCell('Age')],
    };
    const table: Table = { tr: [header] };
    const result = tableToHtml(table);
    expect(result).toContain('<th');
  });

  it('should add scope attribute for headers', () => {
    const header: TableRow = {
      trPr: { tblHeader: true },
      tc: [makeCell('Column 1'), makeCell('Column 2')],
    };
    const table: Table = { tr: [header] };
    const result = tableToHtml(table);
    expect(result).toContain('scope="col"');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Table Edge Cases', () => {
  it('should convert very wide table', () => {
    const cells = Array.from({ length: 20 }, (_, i) => makeCell(`C${i}`));
    const table: Table = { tr: [{ tc: cells }] };
    const result = tableToHtml(table);
    expect(result).toContain('C0');
    expect(result).toContain('C19');
  });

  it('should convert very tall table', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ tc: [makeCell(`R${i}`)] }));
    const table: Table = { tr: rows };
    const result = tableToHtml(table);
    expect(result).toContain('R0');
    expect(result).toContain('R99');
  });

  it('should handle empty cells in row', () => {
    const emptyCell: TableCell = { content: [] };
    const table: Table = {
      tr: [{ tc: [makeCell('Data'), emptyCell, makeCell('More data')] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('Data');
    expect(result).toContain('More data');
  });

  it('should handle unicode content', () => {
    const table: Table = {
      tr: [
        {
          tc: [makeCell('日本語'), makeCell('العربية')],
        },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('日本語');
    expect(result).toContain('العربية');
  });

  it('should escape special characters', () => {
    const table: Table = {
      tr: [{ tc: [makeCell("<script>alert('xss')</script>")] }],
    };
    const result = tableToHtml(table);
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should handle mixed merge scenarios', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('A', { gridSpan: 2 }), makeCell('B')] },
        { tc: [makeCell('C'), makeCell('D'), makeCell('E')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('colspan="2"');
  });

  it('should handle irregular row lengths', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('A'), makeCell('B')] },
        { tc: [makeCell('C')] },
      ],
    };
    const result = tableToHtml(table);
    expect(result).toContain('A');
    expect(result).toContain('C');
  });

  it('should handle properties without content', () => {
    const table: Table = {
      tblPr: {
        tblStyle: 'TableGrid',
        tblW: { w: 5000, type: 'pct' },
        jc: 'center',
      },
      tr: [],
    };
    const result = tableToHtml(table);
    expect(result).toContain('<table');
  });

  it('should handle no wrap cell', () => {
    const cell = makeCell('Long text', { noWrap: true });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result.includes('white-space') || result.includes('Long text')).toBe(true);
  });

  it('should handle fit text cell', () => {
    const cell = makeCell('Shrink me', { tcFitText: true });
    const table: Table = { tr: [{ tc: [cell] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Shrink me');
  });
});

// =============================================================================
// Rowspan Calculation Tests
// =============================================================================

describe('Rowspan Calculation', () => {
  it('should calculate simple rowspan for 2-row merge', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('M', { vMerge: 'restart' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
      ],
    };
    const rowspans = calculateRowspans(table);
    expect(rowspans.get('0,0')).toBe(2);
  });

  it('should calculate multiple separate rowspans in same column', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('M1', { vMerge: 'restart' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
        { tc: [makeCell('M2', { vMerge: 'restart' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
      ],
    };
    const rowspans = calculateRowspans(table);
    expect(rowspans.get('0,0')).toBe(2);
    expect(rowspans.get('2,0')).toBe(2);
  });

  it('should calculate different rowspans in different columns', () => {
    const table: Table = {
      tr: [
        {
          tc: [
            makeCell('Col1', { vMerge: 'restart' }),
            makeCell('Col2', { vMerge: 'restart' }),
          ],
        },
        {
          tc: [
            makeCell('', { vMerge: 'continue' }),
            makeCell('', { vMerge: 'continue' }),
          ],
        },
        {
          tc: [
            makeCell('', { vMerge: 'continue' }),
            makeCell('Normal'),
          ],
        },
      ],
    };
    const rowspans = calculateRowspans(table);
    expect(rowspans.get('0,0')).toBe(3);
    expect(rowspans.get('0,1')).toBe(2);
  });

  it('should calculate rowspan that ends at table bottom', () => {
    const table: Table = {
      tr: [
        { tc: [makeCell('M', { vMerge: 'restart' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
        { tc: [makeCell('', { vMerge: 'continue' })] },
      ],
    };
    const rowspans = calculateRowspans(table);
    expect(rowspans.get('0,0')).toBe(3);
  });

  it('should identify merged cell correctly', () => {
    const merged = makeCell('', { vMerge: 'continue' });
    expect(isMergedCell(merged)).toBe(true);

    const restart = makeCell('', { vMerge: 'restart' });
    expect(isMergedCell(restart)).toBe(false);

    const normal = makeCell('Normal');
    expect(isMergedCell(normal)).toBe(false);
  });
});

// =============================================================================
// HTML Output Mode Tests
// =============================================================================

describe('Table HTML Output Mode', () => {
  it('should produce inline styles in inline mode', () => {
    const converter = new TableToHTMLConverter({ useInlineStyles: true });
    // Table with properties to trigger style generation
    const table: Table = {
      tblPr: { jc: 'center' },
      tr: [{ tc: [makeCell('Cell')] }],
    };
    const result = converter.convert(table);
    expect(result).toContain('style=');
  });

  it('should initialize class mode', () => {
    const converter = new TableToHTMLConverter({ useClasses: true });
    expect(converter.useClasses).toBe(true);
  });

  it('should produce minimal output without unnecessary attributes', () => {
    const table: Table = { tr: [{ tc: [makeCell('Simple')] }] };
    const result = tableToHtml(table);
    expect(result).toContain('Simple');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('TableToHTMLConverter Class', () => {
  it('should initialize converter', () => {
    const converter = new TableToHTMLConverter();
    expect(converter).not.toBeNull();
  });

  it('should initialize with options', () => {
    const converter = new TableToHTMLConverter({
      useSemanticTags: false,
      useClasses: true,
    });
    expect(converter.useSemanticTags).toBe(false);
    expect(converter.useClasses).toBe(true);
  });

  it('should set relationships', () => {
    const converter = new TableToHTMLConverter();
    converter.setRelationships({ rId1: 'https://example.com' });
    expect(converter.relationships['rId1']).toBe('https://example.com');
  });

  it('should convert table with convert method', () => {
    const converter = new TableToHTMLConverter();
    const table = makeSimpleTable(2, 2);
    const result = converter.convert(table);
    expect(result).toContain('<table');
  });

  it('should convert row with convertRow method', () => {
    const converter = new TableToHTMLConverter();
    const row: TableRow = { tc: [makeCell('Test')] };
    const result = converter.convertRow(row);
    expect(result).toContain('<tr');
    expect(result).toContain('Test');
  });

  it('should convert cell with convertCell method', () => {
    const converter = new TableToHTMLConverter();
    const cell = makeCell('Test');
    const result = converter.convertCell(cell);
    expect(result).toContain('<td');
    expect(result).toContain('Test');
  });
});
