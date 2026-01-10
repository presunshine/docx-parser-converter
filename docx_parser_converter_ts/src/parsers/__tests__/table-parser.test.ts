/**
 * Unit tests for table parsers.
 *
 * Tests cover:
 * - Table grid and grid columns
 * - Table cell margins and properties
 * - Table row height and properties
 * - Table look and properties
 * - Complete table parsing
 */

import { describe, it, expect } from 'vitest';
import { makeElement } from '../../__tests__/helpers';
import { parseTableGridColumn, parseTableGrid } from '../document/table-grid-parser';
import { parseTableCellMargins, parseTableCellProperties } from '../document/table-cell-properties-parser';
import { parseTableCell } from '../document/table-cell-parser';
import { parseTableRowHeight, parseTableRowProperties } from '../document/table-row-properties-parser';
import { parseTableRow } from '../document/table-row-parser';
import { parseTableLook, parseTableProperties } from '../document/table-properties-parser';
import { parseTable } from '../document/table-parser';

// =============================================================================
// Table Grid Parser Tests (<w:tblGrid>, <w:gridCol>)
// =============================================================================

describe('parseTableGridColumn', () => {
  it('should return null for null input', () => {
    const result = parseTableGridColumn(null);
    expect(result).toBeNull();
  });

  it('should parse grid column with width', () => {
    const elem = makeElement('<w:gridCol w:w="2880"/>');
    const result = parseTableGridColumn(elem);
    expect(result).not.toBeNull();
    expect(result!.w).toBe(2880);
  });

  it('should parse grid column without width', () => {
    const elem = makeElement('<w:gridCol/>');
    const result = parseTableGridColumn(elem);
    expect(result).not.toBeNull();
    expect(result!.w).toBeNull();
  });
});

describe('parseTableGrid', () => {
  it('should return null for null input', () => {
    const result = parseTableGrid(null);
    expect(result).toBeNull();
  });

  it('should parse empty table grid', () => {
    const elem = makeElement('<w:tblGrid/>');
    const result = parseTableGrid(elem);
    expect(result).not.toBeNull();
    expect(result!.gridCol.length).toBe(0);
  });

  it('should parse table grid with multiple columns', () => {
    const elem = makeElement(`
      <w:tblGrid>
        <w:gridCol w:w="2880"/>
        <w:gridCol w:w="2880"/>
        <w:gridCol w:w="2880"/>
      </w:tblGrid>
    `);
    const result = parseTableGrid(elem);
    expect(result).not.toBeNull();
    expect(result!.gridCol.length).toBe(3);
    expect(result!.gridCol[0].w).toBe(2880);
  });

  it('should parse table grid with varied widths', () => {
    const elem = makeElement(`
      <w:tblGrid>
        <w:gridCol w:w="1440"/>
        <w:gridCol w:w="4320"/>
        <w:gridCol w:w="2880"/>
      </w:tblGrid>
    `);
    const result = parseTableGrid(elem);
    expect(result).not.toBeNull();
    expect(result!.gridCol[0].w).toBe(1440);
    expect(result!.gridCol[1].w).toBe(4320);
    expect(result!.gridCol[2].w).toBe(2880);
  });
});

// =============================================================================
// Table Cell Margins Parser Tests (<w:tcMar>, <w:tblCellMar>)
// =============================================================================

describe('parseTableCellMargins', () => {
  it('should return null for null input', () => {
    const result = parseTableCellMargins(null);
    expect(result).toBeNull();
  });

  it('should parse empty cell margins', () => {
    const elem = makeElement('<w:tcMar/>');
    const result = parseTableCellMargins(elem);
    expect(result).not.toBeNull();
    expect(result!.top).toBeNull();
    expect(result!.left).toBeNull();
  });

  it('should parse cell margins with all sides', () => {
    const elem = makeElement(`
      <w:tcMar>
        <w:top w:w="72" w:type="dxa"/>
        <w:left w:w="115" w:type="dxa"/>
        <w:bottom w:w="72" w:type="dxa"/>
        <w:right w:w="115" w:type="dxa"/>
      </w:tcMar>
    `);
    const result = parseTableCellMargins(elem);
    expect(result).not.toBeNull();
    expect(result!.top).not.toBeNull();
    expect(result!.top!.w).toBe(72);
    expect(result!.left).not.toBeNull();
    expect(result!.left!.w).toBe(115);
    expect(result!.bottom).not.toBeNull();
    expect(result!.bottom!.w).toBe(72);
    expect(result!.right).not.toBeNull();
    expect(result!.right!.w).toBe(115);
  });
});

// =============================================================================
// Table Cell Properties Parser Tests (<w:tcPr>)
// =============================================================================

describe('parseTableCellProperties', () => {
  it('should return null for null input', () => {
    const result = parseTableCellProperties(null);
    expect(result).toBeNull();
  });

  it('should parse empty cell properties', () => {
    const elem = makeElement('<w:tcPr/>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcW).toBeNull();
    expect(result!.vAlign).toBeNull();
  });

  it('should parse cell width', () => {
    const elem = makeElement(`
      <w:tcPr>
        <w:tcW w:w="2880" w:type="dxa"/>
      </w:tcPr>
    `);
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcW).not.toBeNull();
    expect(result!.tcW!.w).toBe(2880);
    expect(result!.tcW!.type).toBe('dxa');
  });

  it('should parse cell shading', () => {
    const elem = makeElement(`
      <w:tcPr>
        <w:shd w:val="clear" w:fill="FFFF00"/>
      </w:tcPr>
    `);
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.shd).not.toBeNull();
    expect(result!.shd!.fill).toBe('FFFF00');
  });

  it('should parse vertical alignment', () => {
    const elem = makeElement('<w:tcPr><w:vAlign w:val="center"/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.vAlign).toBe('center');
  });

  it('should parse all vertical alignment values', () => {
    const alignments = ['top', 'center', 'bottom'];
    for (const align of alignments) {
      const elem = makeElement(`<w:tcPr><w:vAlign w:val="${align}"/></w:tcPr>`);
      const result = parseTableCellProperties(elem);
      expect(result).not.toBeNull();
      expect(result!.vAlign).toBe(align);
    }
  });

  it('should parse text direction', () => {
    const elem = makeElement('<w:tcPr><w:textDirection w:val="tbRl"/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.textDirection).toBe('tbRl');
  });

  it('should parse grid span', () => {
    const elem = makeElement('<w:tcPr><w:gridSpan w:val="3"/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.gridSpan).toBe(3);
  });

  it('should parse vertical merge restart', () => {
    const elem = makeElement('<w:tcPr><w:vMerge w:val="restart"/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.vMerge).toBe('restart');
  });

  it('should parse vertical merge continue', () => {
    const elem = makeElement('<w:tcPr><w:vMerge/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.vMerge).toBe('continue');
  });

  it('should parse no wrap', () => {
    const elem = makeElement('<w:tcPr><w:noWrap/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.noWrap).toBe(true);
  });

  it('should parse fit text', () => {
    const elem = makeElement('<w:tcPr><w:tcFitText/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcFitText).toBe(true);
  });

  it('should parse hide mark', () => {
    const elem = makeElement('<w:tcPr><w:hideMark/></w:tcPr>');
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.hideMark).toBe(true);
  });

  it('should parse cell borders', () => {
    const elem = makeElement(`
      <w:tcPr>
        <w:tcBorders>
          <w:top w:val="single" w:sz="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:color="000000"/>
        </w:tcBorders>
      </w:tcPr>
    `);
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcBorders).not.toBeNull();
    expect(result!.tcBorders!.top).not.toBeNull();
  });

  it('should parse cell margins', () => {
    const elem = makeElement(`
      <w:tcPr>
        <w:tcMar>
          <w:top w:w="72" w:type="dxa"/>
          <w:left w:w="115" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
    `);
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcMar).not.toBeNull();
    expect(result!.tcMar!.top).not.toBeNull();
    expect(result!.tcMar!.top!.w).toBe(72);
  });

  it('should parse comprehensive cell properties', () => {
    const elem = makeElement(`
      <w:tcPr>
        <w:tcW w:w="2880" w:type="dxa"/>
        <w:gridSpan w:val="2"/>
        <w:vMerge w:val="restart"/>
        <w:shd w:val="clear" w:fill="E0E0E0"/>
        <w:vAlign w:val="center"/>
        <w:noWrap/>
      </w:tcPr>
    `);
    const result = parseTableCellProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tcW).not.toBeNull();
    expect(result!.tcW!.w).toBe(2880);
    expect(result!.gridSpan).toBe(2);
    expect(result!.vMerge).toBe('restart');
    expect(result!.shd).not.toBeNull();
    expect(result!.shd!.fill).toBe('E0E0E0');
    expect(result!.vAlign).toBe('center');
    expect(result!.noWrap).toBe(true);
  });
});

// =============================================================================
// Table Cell Parser Tests (<w:tc>)
// =============================================================================

describe('parseTableCell', () => {
  it('should return null for null input', () => {
    const result = parseTableCell(null);
    expect(result).toBeNull();
  });

  it('should parse empty table cell', () => {
    const elem = makeElement('<w:tc/>');
    const result = parseTableCell(elem);
    expect(result).not.toBeNull();
    expect(result!.tcPr).toBeNull();
    expect(result!.content.length).toBe(0);
  });

  it('should parse simple table cell with text', () => {
    const elem = makeElement(`
      <w:tc>
        <w:p>
          <w:r>
            <w:t>Cell content</w:t>
          </w:r>
        </w:p>
      </w:tc>
    `);
    const result = parseTableCell(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(1);
  });

  it('should parse table cell with properties', () => {
    const elem = makeElement(`
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="2880" w:type="dxa"/>
          <w:shd w:val="clear" w:fill="FFFF00"/>
        </w:tcPr>
        <w:p>
          <w:r><w:t>Highlighted cell</w:t></w:r>
        </w:p>
      </w:tc>
    `);
    const result = parseTableCell(elem);
    expect(result).not.toBeNull();
    expect(result!.tcPr).not.toBeNull();
    expect(result!.tcPr!.tcW).not.toBeNull();
    expect(result!.tcPr!.tcW!.w).toBe(2880);
    expect(result!.tcPr!.shd).not.toBeNull();
    expect(result!.tcPr!.shd!.fill).toBe('FFFF00');
  });

  it('should parse table cell with multiple paragraphs', () => {
    const elem = makeElement(`
      <w:tc>
        <w:p><w:r><w:t>First paragraph</w:t></w:r></w:p>
        <w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>
      </w:tc>
    `);
    const result = parseTableCell(elem);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBe(2);
  });
});

// =============================================================================
// Table Row Height Parser Tests (<w:trHeight>)
// =============================================================================

describe('parseTableRowHeight', () => {
  it('should return null for null input', () => {
    const result = parseTableRowHeight(null);
    expect(result).toBeNull();
  });

  it('should parse auto row height', () => {
    const elem = makeElement('<w:trHeight w:val="720" w:hRule="auto"/>');
    const result = parseTableRowHeight(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe(720);
    expect(result!.hRule).toBe('auto');
  });

  it('should parse exact row height', () => {
    const elem = makeElement('<w:trHeight w:val="720" w:hRule="exact"/>');
    const result = parseTableRowHeight(elem);
    expect(result).not.toBeNull();
    expect(result!.hRule).toBe('exact');
  });

  it('should parse atLeast row height', () => {
    const elem = makeElement('<w:trHeight w:val="360" w:hRule="atLeast"/>');
    const result = parseTableRowHeight(elem);
    expect(result).not.toBeNull();
    expect(result!.hRule).toBe('atLeast');
  });

  it('should parse row height without rule', () => {
    const elem = makeElement('<w:trHeight w:val="720"/>');
    const result = parseTableRowHeight(elem);
    expect(result).not.toBeNull();
    expect(result!.val).toBe(720);
    expect(result!.hRule).toBeNull();
  });
});

// =============================================================================
// Table Row Properties Parser Tests (<w:trPr>)
// =============================================================================

describe('parseTableRowProperties', () => {
  it('should return null for null input', () => {
    const result = parseTableRowProperties(null);
    expect(result).toBeNull();
  });

  it('should parse empty row properties', () => {
    const elem = makeElement('<w:trPr/>');
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.trHeight).toBeNull();
    expect(result!.tblHeader).toBeNull();
  });

  it('should parse row with height', () => {
    const elem = makeElement(`
      <w:trPr>
        <w:trHeight w:val="720" w:hRule="exact"/>
      </w:trPr>
    `);
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.trHeight).not.toBeNull();
    expect(result!.trHeight!.val).toBe(720);
    expect(result!.trHeight!.hRule).toBe('exact');
  });

  it('should parse header row', () => {
    const elem = makeElement('<w:trPr><w:tblHeader/></w:trPr>');
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblHeader).toBe(true);
  });

  it('should parse cant split row', () => {
    const elem = makeElement('<w:trPr><w:cantSplit/></w:trPr>');
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.cantSplit).toBe(true);
  });

  it('should parse row justification', () => {
    const elem = makeElement('<w:trPr><w:jc w:val="center"/></w:trPr>');
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.jc).toBe('center');
  });

  it('should parse row cell spacing', () => {
    const elem = makeElement(`
      <w:trPr>
        <w:tblCellSpacing w:w="72" w:type="dxa"/>
      </w:trPr>
    `);
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblCellSpacing).not.toBeNull();
    expect(result!.tblCellSpacing!.w).toBe(72);
  });

  it('should parse comprehensive row properties', () => {
    const elem = makeElement(`
      <w:trPr>
        <w:trHeight w:val="720" w:hRule="exact"/>
        <w:tblHeader/>
        <w:cantSplit/>
        <w:jc w:val="center"/>
      </w:trPr>
    `);
    const result = parseTableRowProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.trHeight).not.toBeNull();
    expect(result!.trHeight!.val).toBe(720);
    expect(result!.tblHeader).toBe(true);
    expect(result!.cantSplit).toBe(true);
    expect(result!.jc).toBe('center');
  });
});

// =============================================================================
// Table Row Parser Tests (<w:tr>)
// =============================================================================

describe('parseTableRow', () => {
  it('should return null for null input', () => {
    const result = parseTableRow(null);
    expect(result).toBeNull();
  });

  it('should parse empty table row', () => {
    const elem = makeElement('<w:tr/>');
    const result = parseTableRow(elem);
    expect(result).not.toBeNull();
    expect(result!.trPr).toBeNull();
    expect(result!.tc.length).toBe(0);
  });

  it('should parse row with single cell', () => {
    const elem = makeElement(`
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Cell</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    `);
    const result = parseTableRow(elem);
    expect(result).not.toBeNull();
    expect(result!.tc.length).toBe(1);
  });

  it('should parse row with multiple cells', () => {
    const elem = makeElement(`
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 3</w:t></w:r></w:p></w:tc>
      </w:tr>
    `);
    const result = parseTableRow(elem);
    expect(result).not.toBeNull();
    expect(result!.tc.length).toBe(3);
  });

  it('should parse row with properties', () => {
    const elem = makeElement(`
      <w:tr>
        <w:trPr>
          <w:tblHeader/>
        </w:trPr>
        <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
      </w:tr>
    `);
    const result = parseTableRow(elem);
    expect(result).not.toBeNull();
    expect(result!.trPr).not.toBeNull();
    expect(result!.trPr!.tblHeader).toBe(true);
  });
});

// =============================================================================
// Table Look Parser Tests (<w:tblLook>)
// =============================================================================

describe('parseTableLook', () => {
  it('should return null for null input', () => {
    const result = parseTableLook(null);
    expect(result).toBeNull();
  });

  it('should parse table look with all features on', () => {
    const elem = makeElement(
      '<w:tblLook w:firstRow="1" w:lastRow="1" w:firstColumn="1" ' +
      'w:lastColumn="1" w:noHBand="0" w:noVBand="0"/>'
    );
    const result = parseTableLook(elem);
    expect(result).not.toBeNull();
    expect(result!.firstRow).toBe(true);
    expect(result!.lastRow).toBe(true);
    expect(result!.firstColumn).toBe(true);
    expect(result!.lastColumn).toBe(true);
    expect(result!.noHBand).toBe(false);
    expect(result!.noVBand).toBe(false);
  });

  it('should parse typical table look', () => {
    const elem = makeElement(
      '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" ' +
      'w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
    );
    const result = parseTableLook(elem);
    expect(result).not.toBeNull();
    expect(result!.firstRow).toBe(true);
    expect(result!.lastRow).toBe(false);
    expect(result!.firstColumn).toBe(true);
    expect(result!.noVBand).toBe(true);
  });
});

// =============================================================================
// Table Properties Parser Tests (<w:tblPr>)
// =============================================================================

describe('parseTableProperties', () => {
  it('should return null for null input', () => {
    const result = parseTableProperties(null);
    expect(result).toBeNull();
  });

  it('should parse empty table properties', () => {
    const elem = makeElement('<w:tblPr/>');
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblStyle).toBeNull();
  });

  it('should parse table with style', () => {
    const elem = makeElement('<w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr>');
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblStyle).toBe('TableGrid');
  });

  it('should parse table width', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblW).not.toBeNull();
    expect(result!.tblW!.w).toBe(5000);
    expect(result!.tblW!.type).toBe('pct');
  });

  it('should parse table justification', () => {
    const elem = makeElement('<w:tblPr><w:jc w:val="center"/></w:tblPr>');
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.jc).toBe('center');
  });

  it('should parse table indentation', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblInd w:w="720" w:type="dxa"/>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblInd).not.toBeNull();
    expect(result!.tblInd!.w).toBe(720);
  });

  it('should parse table borders', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:color="000000"/>
          <w:insideH w:val="single" w:sz="4" w:color="000000"/>
          <w:insideV w:val="single" w:sz="4" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblBorders).not.toBeNull();
    expect(result!.tblBorders!.top).not.toBeNull();
    expect(result!.tblBorders!.insideH).not.toBeNull();
  });

  it('should parse table layout', () => {
    const elem = makeElement('<w:tblPr><w:tblLayout w:type="fixed"/></w:tblPr>');
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblLayout).toBe('fixed');
  });

  it('should parse table layout values', () => {
    const layouts = ['fixed', 'autofit'];
    for (const layout of layouts) {
      const elem = makeElement(`<w:tblPr><w:tblLayout w:type="${layout}"/></w:tblPr>`);
      const result = parseTableProperties(elem);
      expect(result).not.toBeNull();
      expect(result!.tblLayout).toBe(layout);
    }
  });

  it('should parse default cell margins', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblCellMar>
          <w:top w:w="72" w:type="dxa"/>
          <w:left w:w="115" w:type="dxa"/>
          <w:bottom w:w="72" w:type="dxa"/>
          <w:right w:w="115" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblCellMar).not.toBeNull();
    expect(result!.tblCellMar!.top).not.toBeNull();
    expect(result!.tblCellMar!.top!.w).toBe(72);
  });

  it('should parse table caption', () => {
    const elem = makeElement('<w:tblPr><w:tblCaption w:val="Sales Data"/></w:tblPr>');
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblCaption).toBe('Sales Data');
  });

  it('should parse table description', () => {
    const elem = makeElement(
      '<w:tblPr><w:tblDescription w:val="Quarterly sales figures"/></w:tblPr>'
    );
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblDescription).toBe('Quarterly sales figures');
  });

  it('should parse table look', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblLook w:firstRow="1" w:firstColumn="1" w:noVBand="1"/>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblLook).not.toBeNull();
    expect(result!.tblLook!.firstRow).toBe(true);
  });

  it('should parse comprehensive table properties', () => {
    const elem = makeElement(`
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:jc w:val="center"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblLook w:firstRow="1" w:noVBand="1"/>
      </w:tblPr>
    `);
    const result = parseTableProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.tblStyle).toBe('TableGrid');
    expect(result!.tblW).not.toBeNull();
    expect(result!.tblW!.type).toBe('pct');
    expect(result!.jc).toBe('center');
    expect(result!.tblLayout).toBe('fixed');
    expect(result!.tblLook).not.toBeNull();
    expect(result!.tblLook!.firstRow).toBe(true);
  });
});

// =============================================================================
// Table Parser Tests (<w:tbl>)
// =============================================================================

describe('parseTable', () => {
  it('should return null for null input', () => {
    const result = parseTable(null);
    expect(result).toBeNull();
  });

  it('should parse empty table', () => {
    const elem = makeElement('<w:tbl/>');
    const result = parseTable(elem);
    expect(result).not.toBeNull();
    expect(result!.tblPr).toBeNull();
    expect(result!.tblGrid).toBeNull();
    expect(result!.tr.length).toBe(0);
  });

  it('should parse simple 2x2 table', () => {
    const elem = makeElement(`
      <w:tbl>
        <w:tblPr>
          <w:tblStyle w:val="TableGrid"/>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="2880"/>
          <w:gridCol w:w="2880"/>
        </w:tblGrid>
        <w:tr>
          <w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>A2</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>B2</w:t></w:r></w:p></w:tc>
        </w:tr>
      </w:tbl>
    `);
    const result = parseTable(elem);
    expect(result).not.toBeNull();
    expect(result!.tblPr).not.toBeNull();
    expect(result!.tblPr!.tblStyle).toBe('TableGrid');
    expect(result!.tblGrid).not.toBeNull();
    expect(result!.tblGrid!.gridCol.length).toBe(2);
    expect(result!.tr.length).toBe(2);
    expect(result!.tr[0].tc.length).toBe(2);
  });

  it('should parse table with header row', () => {
    const elem = makeElement(`
      <w:tbl>
        <w:tblPr>
          <w:tblLook w:firstRow="1"/>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="2880"/>
        </w:tblGrid>
        <w:tr>
          <w:trPr><w:tblHeader/></w:trPr>
          <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Data</w:t></w:r></w:p></w:tc>
        </w:tr>
      </w:tbl>
    `);
    const result = parseTable(elem);
    expect(result).not.toBeNull();
    expect(result!.tblPr).not.toBeNull();
    expect(result!.tblPr!.tblLook).not.toBeNull();
    expect(result!.tblPr!.tblLook!.firstRow).toBe(true);
    expect(result!.tr[0].trPr).not.toBeNull();
    expect(result!.tr[0].trPr!.tblHeader).toBe(true);
  });

  it('should parse table with merged cells', () => {
    const elem = makeElement(`
      <w:tbl>
        <w:tblGrid>
          <w:gridCol w:w="2880"/>
          <w:gridCol w:w="2880"/>
        </w:tblGrid>
        <w:tr>
          <w:tc>
            <w:tcPr><w:gridSpan w:val="2"/></w:tcPr>
            <w:p><w:r><w:t>Merged</w:t></w:r></w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
    `);
    const result = parseTable(elem);
    expect(result).not.toBeNull();
    expect(result!.tr[0].tc[0].tcPr).not.toBeNull();
    expect(result!.tr[0].tc[0].tcPr!.gridSpan).toBe(2);
  });
});
