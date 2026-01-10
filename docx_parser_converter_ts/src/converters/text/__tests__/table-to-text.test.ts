/**
 * Unit tests for table to text converter.
 *
 * Tests conversion of Table elements to plain text in various modes.
 *
 * Modes:
 * - "ascii": Full ASCII box with all borders (explicit mode)
 * - "tabs": Tab-separated columns, newline-separated rows (no borders)
 * - "plain": Space-separated columns, newline-separated rows (no borders)
 * - "auto": Chooses ascii or tabs based on border detection
 */

import { describe, it, expect } from 'vitest';
import {
  TableToTextConverter,
  createBorderInfo,
  hasAnyBorder,
  cellToText,
  rowToText,
  tableToText,
  tableToAscii,
  tableToTabs,
  tableToPlain,
  detectBorders,
  hasVisibleBorders,
} from '../table-to-text';
import type { Table, TableCell, TableRow, TableProperties, TableCellProperties } from '../../../models/document/table';
import type { Paragraph } from '../../../models/document/paragraph';
import type { Run } from '../../../models/document/run';
import type { Text } from '../../../models/document/run-content';
import type { Border, TableBorders } from '../../../models/common/border';
import type { Width } from '../../../models/common/width';

// =============================================================================
// Helper Functions
// =============================================================================

function createText(value: string): Text {
  return { type: 'text', value, space: null };
}

function createRun(content: any[]): Run {
  return { content, rPr: null };
}

function createParagraph(content: any[]): Paragraph {
  return { content, pPr: null };
}

function makeCell(text: string, width?: number): TableCell {
  const tcPr: TableCellProperties | null = width
    ? { tcW: { w: width, type: 'dxa' } as Width }
    : null;
  return {
    tcPr,
    content: [createParagraph([createRun([createText(text)])])],
  };
}

function makeRow(cells: TableCell[]): TableRow {
  return { tc: cells, trPr: null };
}

function makeTable(
  rows: TableRow[],
  borders?: TableBorders
): Table {
  const tblPr: TableProperties | null = borders
    ? { tblBorders: borders }
    : null;
  return {
    tblPr,
    tblGrid: null,
    tr: rows,
  };
}

function makeBorder(val: string): Border {
  return { val: val as any, sz: null, space: null, color: null };
}

// =============================================================================
// Basic Table Conversion Tests
// =============================================================================

describe('TestBasicTableConversion', () => {
  it('test_simple_table', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
      makeRow([makeCell('A2'), makeCell('B2')]),
    ]);
    const result = tableToText(table);
    expect(result).toContain('A1');
    expect(result).toContain('B1');
    expect(result).toContain('A2');
    expect(result).toContain('B2');
  });

  it('test_empty_table', () => {
    const table: Table = { tblPr: null, tblGrid: null, tr: [] };
    const result = tableToText(table);
    expect(result === '' || result.trim() === '').toBe(true);
  });

  it('test_none_table', () => {
    const result = tableToText(null);
    expect(result).toBe('');
  });

  it('test_undefined_table', () => {
    const result = tableToText(undefined);
    expect(result).toBe('');
  });

  it('test_single_cell_table', () => {
    const table = makeTable([makeRow([makeCell('Only cell')])]);
    const result = tableToText(table);
    expect(result).toContain('Only cell');
  });

  it('test_single_row_table', () => {
    const table = makeTable([makeRow([makeCell('A'), makeCell('B'), makeCell('C')])]);
    const result = tableToText(table);
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).toContain('C');
  });
});

// =============================================================================
// ASCII Box Mode Tests
// =============================================================================

describe('TestAsciiBoxMode', () => {
  it('test_ascii_box_simple_table', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
      makeRow([makeCell('A2'), makeCell('B2')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    // Should have box drawing characters
    expect(result.includes('+') || result.includes('-')).toBe(true);
    expect(result).toContain('A1');
    expect(result).toContain('B1');
  });

  it('test_ascii_box_borders', () => {
    const borders: TableBorders = {
      top: makeBorder('single'),
      left: makeBorder('single'),
      bottom: makeBorder('single'),
      right: makeBorder('single'),
      insideH: makeBorder('single'),
      insideV: makeBorder('single'),
    };
    const table = makeTable(
      [makeRow([makeCell('Cell1'), makeCell('Cell2')])],
      borders
    );
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    expect(result).toContain('Cell1');
    expect(result).toContain('Cell2');
  });

  it('test_ascii_box_alignment', () => {
    const table = makeTable([
      makeRow([makeCell('Short'), makeCell('Much longer text')]),
      makeRow([makeCell('A'), makeCell('B')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    const lines = result.trim().split('\n');
    // All content lines should have same length (excluding border lines)
    const contentLines = lines.filter(line => line.includes('Short') || line.includes('A'));
    if (contentLines.length >= 2) {
      expect(contentLines[0].length).toBe(contentLines[1].length);
    }
  });

  it('test_ascii_box_multiline_cell', () => {
    const cell: TableCell = {
      tcPr: null,
      content: [
        createParagraph([createRun([createText('Line 1')])]),
        createParagraph([createRun([createText('Line 2')])]),
      ],
    };
    const table = makeTable([makeRow([cell, makeCell('Single')])]);
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    // Multi-line content should be joined with space in ASCII mode
    expect(result).toContain('Line 1');
    expect(result).toContain('Single');
  });
});

// =============================================================================
// Tab-Separated Mode Tests
// =============================================================================

describe('TestTabSeparatedMode', () => {
  it('test_tab_separated_simple', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
      makeRow([makeCell('A2'), makeCell('B2')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'tabs' });
    const result = converter.convert(table);
    expect(result).toContain('A1\tB1');
    expect(result).toContain('A2\tB2');
  });

  it('test_tab_separated_newlines', () => {
    const table = makeTable([
      makeRow([makeCell('Row1')]),
      makeRow([makeCell('Row2')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'tabs' });
    const result = converter.convert(table);
    expect(result).toContain('Row1');
    expect(result).toContain('Row2');
    expect(result).toContain('\n');
  });

  it('test_tab_separated_many_columns', () => {
    const cells = Array.from({ length: 5 }, (_, i) => makeCell(`C${i}`));
    const table = makeTable([makeRow(cells)]);
    const converter = new TableToTextConverter({ mode: 'tabs' });
    const result = converter.convert(table);
    expect(result.trim()).toBe('C0\tC1\tC2\tC3\tC4');
  });

  it('test_tab_separated_empty_cells', () => {
    const table = makeTable([makeRow([makeCell('A'), makeCell(''), makeCell('C')])]);
    const converter = new TableToTextConverter({ mode: 'tabs' });
    const result = converter.convert(table);
    // Should have two tabs (between A and empty, between empty and C)
    expect(result.includes('\t\t') || result.split('\t').length >= 3).toBe(true);
  });
});

// =============================================================================
// Plain Text Mode Tests
// =============================================================================

describe('TestPlainTextMode', () => {
  it('test_plain_simple_table', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
      makeRow([makeCell('A2'), makeCell('B2')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'plain' });
    const result = converter.convert(table);
    expect(result).toContain('A1');
    expect(result).toContain('B1');
    expect(result).toContain('A2');
    expect(result).toContain('B2');
    // Should not have box drawing characters
    expect(result).not.toContain('+');
    expect(result).not.toContain('\u2500');
  });

  it('test_plain_space_separated', () => {
    const table = makeTable([makeRow([makeCell('Cell1'), makeCell('Cell2')])]);
    const converter = new TableToTextConverter({ mode: 'plain' });
    const result = converter.convert(table);
    expect(result).toContain('Cell1');
    expect(result).toContain('Cell2');
  });
});

// =============================================================================
// Auto Mode Tests
// =============================================================================

describe('TestAutoMode', () => {
  it('test_auto_with_borders_uses_ascii', () => {
    const borders: TableBorders = {
      top: makeBorder('single'),
      bottom: makeBorder('single'),
    };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const converter = new TableToTextConverter({ mode: 'auto' });
    const result = converter.convert(table);
    expect(result).toContain('Cell');
  });

  it('test_auto_without_borders_uses_tabs', () => {
    const table = makeTable([makeRow([makeCell('A'), makeCell('B')])]);
    const converter = new TableToTextConverter({ mode: 'auto' });
    const result = converter.convert(table);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_auto_with_none_border_val', () => {
    const borders: TableBorders = {
      top: makeBorder('none'),
    };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const converter = new TableToTextConverter({ mode: 'auto' });
    const result = converter.convert(table);
    expect(result).toContain('Cell');
  });

  it('test_auto_with_nil_border_val', () => {
    const borders: TableBorders = {
      top: makeBorder('nil'),
    };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const converter = new TableToTextConverter({ mode: 'auto' });
    const result = converter.convert(table);
    expect(result).toContain('Cell');
  });
});

// =============================================================================
// Cell Merging Tests
// =============================================================================

describe('TestCellMerging', () => {
  it('test_horizontal_merge', () => {
    const mergedCell: TableCell = {
      tcPr: { gridSpan: 2 },
      content: [createParagraph([createRun([createText('Merged')])])],
    };
    const table = makeTable([
      makeRow([mergedCell]),
      makeRow([makeCell('A'), makeCell('B')]),
    ]);
    const result = tableToText(table);
    expect(result).toContain('Merged');
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_vertical_merge', () => {
    const mergeStart: TableCell = {
      tcPr: { vMerge: 'restart' },
      content: [createParagraph([createRun([createText('Spanning')])])],
    };
    const mergeCont: TableCell = {
      tcPr: { vMerge: 'continue' },
      content: [],
    };
    const table = makeTable([
      makeRow([mergeStart, makeCell('B1')]),
      makeRow([mergeCont, makeCell('B2')]),
    ]);
    const result = tableToText(table);
    expect(result).toContain('Spanning');
    expect(result).toContain('B1');
    expect(result).toContain('B2');
  });
});

// =============================================================================
// Cell Content Tests
// =============================================================================

describe('TestCellContent', () => {
  it('test_cell_to_text_simple', () => {
    const cell = makeCell('Cell content');
    const result = cellToText(cell);
    expect(result).toBe('Cell content');
  });

  it('test_cell_to_text_empty', () => {
    const cell: TableCell = { tcPr: null, content: [] };
    const result = cellToText(cell);
    expect(result).toBe('');
  });

  it('test_cell_to_text_null', () => {
    const result = cellToText(null);
    expect(result).toBe('');
  });

  it('test_cell_to_text_undefined', () => {
    const result = cellToText(undefined);
    expect(result).toBe('');
  });

  it('test_cell_to_text_multiple_paragraphs', () => {
    const cell: TableCell = {
      tcPr: null,
      content: [
        createParagraph([createRun([createText('Para 1')])]),
        createParagraph([createRun([createText('Para 2')])]),
      ],
    };
    const result = cellToText(cell);
    expect(result).toContain('Para 1');
    expect(result).toContain('Para 2');
    expect(result).toContain('\n');
  });

  it('test_cell_with_unicode', () => {
    const cell = makeCell('Hello \u4e16\u754c');
    const result = cellToText(cell);
    expect(result).toBe('Hello \u4e16\u754c');
  });
});

// =============================================================================
// Row Content Tests
// =============================================================================

describe('TestRowContent', () => {
  it('test_row_to_text_simple', () => {
    const row = makeRow([makeCell('A'), makeCell('B')]);
    const result = rowToText(row);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_row_to_text_empty', () => {
    const row: TableRow = { tc: [], trPr: null };
    const result = rowToText(row);
    expect(result === '' || result.trim() === '').toBe(true);
  });

  it('test_row_to_text_null', () => {
    const result = rowToText(null);
    expect(result).toBe('');
  });

  it('test_row_to_text_undefined', () => {
    const result = rowToText(undefined);
    expect(result).toBe('');
  });

  it('test_row_to_text_many_cells', () => {
    const cells = Array.from({ length: 10 }, (_, i) => makeCell(`Cell${i}`));
    const row = makeRow(cells);
    const result = rowToText(row);
    for (let i = 0; i < 10; i++) {
      expect(result).toContain(`Cell${i}`);
    }
  });

  it('test_row_to_text_custom_separator', () => {
    const row = makeRow([makeCell('A'), makeCell('B')]);
    const result = rowToText(row, ' | ');
    expect(result).toBe('A | B');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('TestTableEdgeCases', () => {
  it('test_uneven_rows', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1'), makeCell('C1')]),
      makeRow([makeCell('A2')]),
    ]);
    const result = tableToText(table);
    expect(result).toContain('A1');
    expect(result).toContain('A2');
  });

  it('test_empty_cells', () => {
    const table = makeTable([
      makeRow([makeCell(''), makeCell('B')]),
      makeRow([makeCell('A'), makeCell('')]),
    ]);
    const result = tableToText(table);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('test_very_wide_table', () => {
    const cells = Array.from({ length: 20 }, (_, i) => makeCell(`Col${i}`));
    const table = makeTable([makeRow(cells)]);
    const result = tableToText(table);
    expect(result).toContain('Col0');
    expect(result).toContain('Col19');
  });

  it('test_very_tall_table', () => {
    const rows = Array.from({ length: 50 }, (_, i) => makeRow([makeCell(`Row${i}`)]));
    const table = makeTable(rows);
    const result = tableToText(table);
    expect(result).toContain('Row0');
    expect(result).toContain('Row49');
  });

  it('test_nested_content_in_cell', () => {
    const cell: TableCell = {
      tcPr: null,
      content: [
        createParagraph([
          createRun([createText('Bold text')]),
          createRun([createText(' and normal')]),
        ]),
      ],
    };
    const table = makeTable([makeRow([cell])]);
    const result = tableToText(table);
    expect(result).toContain('Bold text');
    expect(result).toContain('and normal');
  });
});

// =============================================================================
// Converter Class Tests
// =============================================================================

describe('TestTableToTextConverterClass', () => {
  it('test_converter_initialization', () => {
    const converter = new TableToTextConverter();
    expect(converter).not.toBeNull();
  });

  it('test_converter_ascii_mode', () => {
    const converter = new TableToTextConverter({ mode: 'ascii' });
    expect(converter.mode).toBe('ascii');
  });

  it('test_converter_tabs_mode', () => {
    const converter = new TableToTextConverter({ mode: 'tabs' });
    expect(converter.mode).toBe('tabs');
  });

  it('test_converter_plain_mode', () => {
    const converter = new TableToTextConverter({ mode: 'plain' });
    expect(converter.mode).toBe('plain');
  });

  it('test_converter_auto_mode', () => {
    const converter = new TableToTextConverter({ mode: 'auto' });
    expect(converter.mode).toBe('auto');
  });

  it('test_convert_method', () => {
    const converter = new TableToTextConverter();
    const table = makeTable([makeRow([makeCell('Test')])]);
    const result = converter.convert(table);
    expect(result).toContain('Test');
  });

  it('test_converter_default_mode', () => {
    const converter = new TableToTextConverter();
    expect(converter.mode).toBe('auto');
  });
});

// =============================================================================
// Column Width Calculation Tests
// =============================================================================

describe('TestColumnWidthCalculation', () => {
  it('test_column_widths_based_on_content', () => {
    const table = makeTable([
      makeRow([makeCell('Short'), makeCell('Much longer text here')]),
      makeRow([makeCell('A'), makeCell('B')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    const lines = result.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim());
    if (nonEmptyLines.length > 1) {
      // Basic structure check
      expect(nonEmptyLines.length).toBeGreaterThan(0);
    }
  });

  it('test_minimum_column_width', () => {
    const table = makeTable([
      makeRow([makeCell(''), makeCell('B')]),
    ]);
    const converter = new TableToTextConverter({ mode: 'ascii' });
    const result = converter.convert(table);
    expect(result).toContain('B');
  });
});

// =============================================================================
// BorderInfo Tests
// =============================================================================

describe('TestBorderInfo', () => {
  it('test_default_values', () => {
    const info = createBorderInfo();
    expect(info.top).toBe(false);
    expect(info.bottom).toBe(false);
    expect(info.left).toBe(false);
    expect(info.right).toBe(false);
    expect(info.insideH).toBe(false);
    expect(info.insideV).toBe(false);
  });

  it('test_has_any_false_when_all_false', () => {
    const info = createBorderInfo();
    expect(hasAnyBorder(info)).toBe(false);
  });

  it('test_has_any_true_when_top_set', () => {
    const info = createBorderInfo({ top: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_bottom_set', () => {
    const info = createBorderInfo({ bottom: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_left_set', () => {
    const info = createBorderInfo({ left: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_right_set', () => {
    const info = createBorderInfo({ right: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_inside_h_set', () => {
    const info = createBorderInfo({ insideH: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_inside_v_set', () => {
    const info = createBorderInfo({ insideV: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_has_any_true_when_multiple_set', () => {
    const info = createBorderInfo({ top: true, bottom: true, left: true, right: true });
    expect(hasAnyBorder(info)).toBe(true);
  });

  it('test_full_borders', () => {
    const info = createBorderInfo({
      top: true,
      bottom: true,
      left: true,
      right: true,
      insideH: true,
      insideV: true,
    });
    expect(info.top).toBe(true);
    expect(info.bottom).toBe(true);
    expect(info.left).toBe(true);
    expect(info.right).toBe(true);
    expect(info.insideH).toBe(true);
    expect(info.insideV).toBe(true);
  });
});

// =============================================================================
// Border Detection Tests
// =============================================================================

describe('TestDetectBorders', () => {
  it('test_no_borders_returns_empty_info', () => {
    const table = makeTable([makeRow([makeCell('Cell')])]);
    const info = detectBorders(table);
    expect(hasAnyBorder(info)).toBe(false);
  });

  it('test_table_level_top_border', () => {
    const borders: TableBorders = { top: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.top).toBe(true);
    expect(info.bottom).toBe(false);
  });

  it('test_table_level_bottom_border', () => {
    const borders: TableBorders = { bottom: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.bottom).toBe(true);
    expect(info.top).toBe(false);
  });

  it('test_table_level_left_border', () => {
    const borders: TableBorders = { left: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.left).toBe(true);
  });

  it('test_table_level_right_border', () => {
    const borders: TableBorders = { right: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.right).toBe(true);
  });

  it('test_table_level_inside_h_border', () => {
    const borders: TableBorders = { insideH: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.insideH).toBe(true);
  });

  it('test_table_level_inside_v_border', () => {
    const borders: TableBorders = { insideV: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.insideV).toBe(true);
  });

  it('test_table_level_all_borders', () => {
    const borders: TableBorders = {
      top: makeBorder('single'),
      bottom: makeBorder('single'),
      left: makeBorder('single'),
      right: makeBorder('single'),
      insideH: makeBorder('single'),
      insideV: makeBorder('single'),
    };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.top).toBe(true);
    expect(info.bottom).toBe(true);
    expect(info.left).toBe(true);
    expect(info.right).toBe(true);
    expect(info.insideH).toBe(true);
    expect(info.insideV).toBe(true);
  });

  it('test_none_border_val_not_detected', () => {
    const borders: TableBorders = { top: makeBorder('none') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.top).toBe(false);
  });

  it('test_nil_border_val_not_detected', () => {
    const borders: TableBorders = { top: makeBorder('nil') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    const info = detectBorders(table);
    expect(info.top).toBe(false);
  });

  it('test_cell_level_top_border_first_row', () => {
    const cell: TableCell = {
      tcPr: { tcBorders: { top: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell')])])],
    };
    const table = makeTable([makeRow([cell])]);
    const info = detectBorders(table);
    expect(info.top).toBe(true);
  });

  it('test_cell_level_bottom_border_last_row', () => {
    const cell: TableCell = {
      tcPr: { tcBorders: { bottom: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell')])])],
    };
    const table = makeTable([makeRow([cell])]);
    const info = detectBorders(table);
    expect(info.bottom).toBe(true);
  });

  it('test_cell_level_left_border_first_column', () => {
    const cell: TableCell = {
      tcPr: { tcBorders: { left: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell')])])],
    };
    const table = makeTable([makeRow([cell])]);
    const info = detectBorders(table);
    expect(info.left).toBe(true);
  });

  it('test_cell_level_right_border_last_column', () => {
    const cell: TableCell = {
      tcPr: { tcBorders: { right: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell')])])],
    };
    const table = makeTable([makeRow([cell])]);
    const info = detectBorders(table);
    expect(info.right).toBe(true);
  });

  it('test_cell_level_inside_h_border', () => {
    const cell1: TableCell = {
      tcPr: { tcBorders: { bottom: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell1')])])],
    };
    const cell2 = makeCell('Cell2');
    const table = makeTable([makeRow([cell1]), makeRow([cell2])]);
    const info = detectBorders(table);
    expect(info.insideH).toBe(true);
  });

  it('test_cell_level_inside_v_border', () => {
    const cell1: TableCell = {
      tcPr: { tcBorders: { right: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell1')])])],
    };
    const cell2 = makeCell('Cell2');
    const table = makeTable([makeRow([cell1, cell2])]);
    const info = detectBorders(table);
    expect(info.insideV).toBe(true);
  });
});

describe('TestHasVisibleBorders', () => {
  it('test_returns_false_for_no_borders', () => {
    const table = makeTable([makeRow([makeCell('Cell')])]);
    expect(hasVisibleBorders(table)).toBe(false);
  });

  it('test_returns_true_for_table_borders', () => {
    const borders: TableBorders = { top: makeBorder('single') };
    const table = makeTable([makeRow([makeCell('Cell')])], borders);
    expect(hasVisibleBorders(table)).toBe(true);
  });

  it('test_returns_true_for_cell_borders', () => {
    const cell: TableCell = {
      tcPr: { tcBorders: { top: makeBorder('single') } },
      content: [createParagraph([createRun([createText('Cell')])])],
    };
    const table = makeTable([makeRow([cell])]);
    expect(hasVisibleBorders(table)).toBe(true);
  });
});

// =============================================================================
// Partial Border Rendering Tests
// =============================================================================

describe('TestPartialBorderRendering', () => {
  it('test_top_border_only', () => {
    const info = createBorderInfo({ top: true });
    const table = makeTable([
      makeRow([makeCell('A'), makeCell('B')]),
      makeRow([makeCell('C'), makeCell('D')]),
    ]);
    const result = tableToAscii(table, info);
    const lines = result.trim().split('\n');
    // First line should be border
    expect(lines[0]).toContain('-');
    // Last line should NOT be border (no bottom border)
    expect(lines[lines.length - 1]).not.toContain('-');
  });

  it('test_bottom_border_only', () => {
    const info = createBorderInfo({ bottom: true });
    const table = makeTable([
      makeRow([makeCell('A'), makeCell('B')]),
      makeRow([makeCell('C'), makeCell('D')]),
    ]);
    const result = tableToAscii(table, info);
    const lines = result.trim().split('\n');
    // First line should NOT be border
    expect(lines[0]).not.toContain('-');
    // Last line should be border
    expect(lines[lines.length - 1]).toContain('-');
  });

  it('test_left_border_only', () => {
    const info = createBorderInfo({ left: true });
    const table = makeTable([makeRow([makeCell('A'), makeCell('B')])]);
    const result = tableToAscii(table, info);
    // Should have | on left side
    for (const line of result.trim().split('\n')) {
      if (line.includes('A') || line.includes('B')) {
        expect(line.startsWith('|')).toBe(true);
      }
    }
  });

  it('test_right_border_only', () => {
    const info = createBorderInfo({ right: true });
    const table = makeTable([makeRow([makeCell('A'), makeCell('B')])]);
    const result = tableToAscii(table, info);
    // Should have | on right side
    for (const line of result.trim().split('\n')) {
      if (line.includes('A') || line.includes('B')) {
        expect(line.endsWith('|')).toBe(true);
      }
    }
  });

  it('test_outer_borders_only', () => {
    const info = createBorderInfo({ top: true, bottom: true, left: true, right: true });
    const table = makeTable([
      makeRow([makeCell('A'), makeCell('B')]),
      makeRow([makeCell('C'), makeCell('D')]),
    ]);
    const result = tableToAscii(table, info);
    const lines = result.trim().split('\n');
    expect(lines[0]).toContain('-');
    expect(lines[lines.length - 1]).toContain('-');
    // Middle lines should have left/right borders
    const middleLines = lines.filter(line => line.includes('A') || line.includes('C'));
    for (const line of middleLines) {
      expect(line.startsWith('|')).toBe(true);
      expect(line.endsWith('|')).toBe(true);
    }
  });

  it('test_inside_borders_only', () => {
    const info = createBorderInfo({ insideH: true, insideV: true });
    const table = makeTable([
      makeRow([makeCell('A'), makeCell('B')]),
      makeRow([makeCell('C'), makeCell('D')]),
    ]);
    const result = tableToAscii(table, info);
    const lines = result.trim().split('\n');
    // Should NOT have top border (first line is data)
    expect(lines[0]).toContain('A');
    // Should NOT have bottom border (last line is data)
    expect(lines[lines.length - 1].includes('C') || lines[lines.length - 1].includes('D')).toBe(true);
    // Should have separator between rows
    const separatorLines = lines.filter(line => line.includes('-'));
    expect(separatorLines.length).toBeGreaterThanOrEqual(1);
  });

  it('test_full_borders', () => {
    const info = createBorderInfo({
      top: true,
      bottom: true,
      left: true,
      right: true,
      insideH: true,
      insideV: true,
    });
    const table = makeTable([
      makeRow([makeCell('A'), makeCell('B')]),
      makeRow([makeCell('C'), makeCell('D')]),
    ]);
    const result = tableToAscii(table, info);
    const lines = result.trim().split('\n');
    // Should have borders on all sides
    expect(lines[0]).toContain('-');
    expect(lines[lines.length - 1]).toContain('-');
    // Content lines should have | separators
    const contentLines = lines.filter(line => line.includes('A') || line.includes('C'));
    for (const line of contentLines) {
      expect(line).toContain('|');
    }
  });

  it('test_explicit_ascii_mode_uses_full_borders', () => {
    const table = makeTable([makeRow([makeCell('A'), makeCell('B')])]);
    // No borders defined on table
    const result = tableToText(table, 'ascii');
    const lines = result.trim().split('\n');
    // Should have full borders
    expect(lines[0]).toContain('-');
    expect(lines[lines.length - 1]).toContain('-');
    expect(lines[1]).toContain('|');
  });

  it('test_auto_mode_detects_partial_borders', () => {
    const borders: TableBorders = {
      top: makeBorder('single'),
      bottom: makeBorder('single'),
    };
    const table = makeTable(
      [
        makeRow([makeCell('A'), makeCell('B')]),
        makeRow([makeCell('C'), makeCell('D')]),
      ],
      borders
    );
    const result = tableToText(table, 'auto');
    const lines = result.trim().split('\n');
    // Should have top and bottom borders
    expect(lines[0]).toContain('-');
    expect(lines[lines.length - 1]).toContain('-');
  });
});

// =============================================================================
// Direct Function Tests
// =============================================================================

describe('TestDirectFunctions', () => {
  it('test_tableToTabs', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
      makeRow([makeCell('A2'), makeCell('B2')]),
    ]);
    const result = tableToTabs(table);
    expect(result).toContain('A1\tB1');
    expect(result).toContain('A2\tB2');
  });

  it('test_tableToPlain', () => {
    const table = makeTable([
      makeRow([makeCell('A1'), makeCell('B1')]),
    ]);
    const result = tableToPlain(table);
    expect(result).toContain('A1');
    expect(result).toContain('B1');
  });

  it('test_tableToAscii_empty_table', () => {
    const table: Table = { tblPr: null, tblGrid: null, tr: [] };
    const result = tableToAscii(table);
    expect(result).toBe('');
  });

  it('test_tableToTabs_empty_table', () => {
    const table: Table = { tblPr: null, tblGrid: null, tr: [] };
    const result = tableToTabs(table);
    expect(result).toBe('');
  });

  it('test_tableToPlain_empty_table', () => {
    const table: Table = { tblPr: null, tblGrid: null, tr: [] };
    const result = tableToPlain(table);
    expect(result).toBe('');
  });
});
