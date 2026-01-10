/**
 * Unit tests for drawing parsers (images, shapes).
 *
 * Tests cover:
 * - Drawing extent parsing (<wp:extent>, <a:ext>)
 * - Document properties parsing (<wp:docPr>)
 * - Blip/image reference parsing (<a:blip>)
 * - Picture parsing (<pic:pic>)
 * - Inline drawing parsing (<wp:inline>)
 * - Anchor drawing parsing (<wp:anchor>)
 * - Complete drawing parsing (<w:drawing>)
 */

import { describe, it, expect } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';
import {
  parseExtent,
  parseDocPr,
  parseBlip,
  parseBlipFill,
  parseShapeProperties,
  parsePicture,
  parseGraphicData,
  parseGraphic,
  parseInlineDrawing,
  parseAnchorDrawing,
  parseDrawing,
} from '../document/drawing-parser';

// Namespaces for drawing elements
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC_NS = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/**
 * Parse XML string with drawing namespaces into an Element.
 */
function makeDrawingElement(xml: string): Element {
  const wrapped = `<root xmlns:w="${W_NS}" xmlns:wp="${WP_NS}" xmlns:a="${A_NS}"
                        xmlns:pic="${PIC_NS}" xmlns:r="${R_NS}">${xml}</root>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(wrapped, 'text/xml');
  const root = doc.documentElement;
  if (!root) {
    throw new Error('Failed to parse XML document');
  }
  // Find the first element child (skip text nodes from whitespace)
  const children = root.childNodes;
  for (let i = 0; i < children.length; i++) {
    if (children[i].nodeType === 1) {
      return children[i] as unknown as Element;
    }
  }
  throw new Error('No element found');
}

// =============================================================================
// Extent Parser Tests (<wp:extent>, <a:ext>)
// =============================================================================

describe('parseExtent', () => {
  it('should return null for null input', () => {
    const result = parseExtent(null);
    expect(result).toBeNull();
  });

  it('should parse extent with width and height', () => {
    const elem = makeDrawingElement('<wp:extent cx="914400" cy="457200"/>');
    const result = parseExtent(elem);
    expect(result).not.toBeNull();
    expect(result!.cx).toBe(914400); // 1 inch
    expect(result!.cy).toBe(457200); // 0.5 inch
  });

  it('should parse extent with only width', () => {
    const elem = makeDrawingElement('<wp:extent cx="914400"/>');
    const result = parseExtent(elem);
    expect(result).not.toBeNull();
    expect(result!.cx).toBe(914400);
    expect(result!.cy).toBeNull();
  });

  it('should parse extent with only height', () => {
    const elem = makeDrawingElement('<wp:extent cy="914400"/>');
    const result = parseExtent(elem);
    expect(result).not.toBeNull();
    expect(result!.cx).toBeNull();
    expect(result!.cy).toBe(914400);
  });

  it('should parse empty extent', () => {
    const elem = makeDrawingElement('<wp:extent/>');
    const result = parseExtent(elem);
    expect(result).not.toBeNull();
    expect(result!.cx).toBeNull();
    expect(result!.cy).toBeNull();
  });

  it('should parse <a:ext> element (same structure)', () => {
    const elem = makeDrawingElement('<a:ext cx="1000000" cy="500000"/>');
    const result = parseExtent(elem);
    expect(result).not.toBeNull();
    expect(result!.cx).toBe(1000000);
    expect(result!.cy).toBe(500000);
  });
});

// =============================================================================
// Document Properties Parser Tests (<wp:docPr>)
// =============================================================================

describe('parseDocPr', () => {
  it('should return null for null input', () => {
    const result = parseDocPr(null);
    expect(result).toBeNull();
  });

  it('should parse docPr with all attributes', () => {
    const elem = makeDrawingElement('<wp:docPr id="1" name="Picture 1" descr="A sample image"/>');
    const result = parseDocPr(elem);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.name).toBe('Picture 1');
    expect(result!.descr).toBe('A sample image');
  });

  it('should parse docPr with only id', () => {
    const elem = makeDrawingElement('<wp:docPr id="5"/>');
    const result = parseDocPr(elem);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(5);
    expect(result!.name).toBeNull();
    expect(result!.descr).toBeNull();
  });

  it('should parse docPr without attributes', () => {
    const elem = makeDrawingElement('<wp:docPr/>');
    const result = parseDocPr(elem);
    expect(result).not.toBeNull();
    expect(result!.id).toBeNull();
    expect(result!.name).toBeNull();
    expect(result!.descr).toBeNull();
  });

  it('should parse docPr with special characters in description', () => {
    const elem = makeDrawingElement(
      '<wp:docPr id="1" descr="Image with &amp; and &lt;special&gt; chars"/>'
    );
    const result = parseDocPr(elem);
    expect(result).not.toBeNull();
    expect(result!.descr).toBe('Image with & and <special> chars');
  });
});

// =============================================================================
// Blip Parser Tests (<a:blip>)
// =============================================================================

describe('parseBlip', () => {
  it('should return null for null input', () => {
    const result = parseBlip(null);
    expect(result).toBeNull();
  });

  it('should parse blip with relationship ID', () => {
    const elem = makeDrawingElement('<a:blip r:embed="rId4"/>');
    const result = parseBlip(elem);
    expect(result).not.toBeNull();
    expect(result!.embed).toBe('rId4');
  });

  it('should parse blip with different relationship ID', () => {
    const elem = makeDrawingElement('<a:blip r:embed="rId123"/>');
    const result = parseBlip(elem);
    expect(result).not.toBeNull();
    expect(result!.embed).toBe('rId123');
  });

  it('should parse blip without embed attribute', () => {
    const elem = makeDrawingElement('<a:blip/>');
    const result = parseBlip(elem);
    expect(result).not.toBeNull();
    expect(result!.embed).toBeNull();
  });
});

// =============================================================================
// BlipFill Parser Tests (<pic:blipFill>)
// =============================================================================

describe('parseBlipFill', () => {
  it('should return null for null input', () => {
    const result = parseBlipFill(null);
    expect(result).toBeNull();
  });

  it('should parse blipFill containing blip', () => {
    const elem = makeDrawingElement(`
      <pic:blipFill>
        <a:blip r:embed="rId5"/>
      </pic:blipFill>
    `);
    const result = parseBlipFill(elem);
    expect(result).not.toBeNull();
    expect(result!.blip).not.toBeNull();
    expect(result!.blip!.embed).toBe('rId5');
  });

  it('should parse blipFill without blip child', () => {
    const elem = makeDrawingElement('<pic:blipFill/>');
    const result = parseBlipFill(elem);
    expect(result).not.toBeNull();
    expect(result!.blip).toBeNull();
  });
});

// =============================================================================
// Shape Properties Parser Tests (<pic:spPr>)
// =============================================================================

describe('parseShapeProperties', () => {
  it('should return null for null input', () => {
    const result = parseShapeProperties(null);
    expect(result).toBeNull();
  });

  it('should parse spPr with transform containing extent', () => {
    const elem = makeDrawingElement(`
      <pic:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="914400" cy="914400"/>
        </a:xfrm>
      </pic:spPr>
    `);
    const result = parseShapeProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.extent).not.toBeNull();
    expect(result!.extent!.cx).toBe(914400);
    expect(result!.extent!.cy).toBe(914400);
  });

  it('should parse spPr without transform', () => {
    const elem = makeDrawingElement('<pic:spPr/>');
    const result = parseShapeProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.extent).toBeNull();
  });
});

// =============================================================================
// Picture Parser Tests (<pic:pic>)
// =============================================================================

describe('parsePicture', () => {
  it('should return null for null input', () => {
    const result = parsePicture(null);
    expect(result).toBeNull();
  });

  it('should parse picture with blipFill and spPr', () => {
    const elem = makeDrawingElement(`
      <pic:pic>
        <pic:nvPicPr>
          <pic:cNvPr id="0" name="image.png"/>
        </pic:nvPicPr>
        <pic:blipFill>
          <a:blip r:embed="rId6"/>
        </pic:blipFill>
        <pic:spPr>
          <a:xfrm>
            <a:ext cx="500000" cy="300000"/>
          </a:xfrm>
        </pic:spPr>
      </pic:pic>
    `);
    const result = parsePicture(elem);
    expect(result).not.toBeNull();
    expect(result!.blipFill).not.toBeNull();
    expect(result!.blipFill!.blip).not.toBeNull();
    expect(result!.blipFill!.blip!.embed).toBe('rId6');
    expect(result!.spPr).not.toBeNull();
    expect(result!.spPr!.extent).not.toBeNull();
    expect(result!.spPr!.extent!.cx).toBe(500000);
  });

  it('should parse picture with only blipFill', () => {
    const elem = makeDrawingElement(`
      <pic:pic>
        <pic:blipFill>
          <a:blip r:embed="rId7"/>
        </pic:blipFill>
      </pic:pic>
    `);
    const result = parsePicture(elem);
    expect(result).not.toBeNull();
    expect(result!.blipFill).not.toBeNull();
    expect(result!.blipFill!.blip).not.toBeNull();
    expect(result!.blipFill!.blip!.embed).toBe('rId7');
    expect(result!.spPr).toBeNull();
  });

  it('should parse empty picture element', () => {
    const elem = makeDrawingElement('<pic:pic/>');
    const result = parsePicture(elem);
    expect(result).not.toBeNull();
    expect(result!.blipFill).toBeNull();
    expect(result!.spPr).toBeNull();
  });
});

// =============================================================================
// Graphic Data Parser Tests (<a:graphicData>)
// =============================================================================

describe('parseGraphicData', () => {
  it('should return null for null input', () => {
    const result = parseGraphicData(null);
    expect(result).toBeNull();
  });

  it('should parse graphicData with picture', () => {
    const elem = makeDrawingElement(`
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:blipFill>
            <a:blip r:embed="rId8"/>
          </pic:blipFill>
        </pic:pic>
      </a:graphicData>
    `);
    const result = parseGraphicData(elem);
    expect(result).not.toBeNull();
    expect(result!.uri).toBe('http://schemas.openxmlformats.org/drawingml/2006/picture');
    expect(result!.pic).not.toBeNull();
    expect(result!.pic!.blipFill).not.toBeNull();
    expect(result!.pic!.blipFill!.blip).not.toBeNull();
    expect(result!.pic!.blipFill!.blip!.embed).toBe('rId8');
  });

  it('should parse graphicData without picture', () => {
    const elem = makeDrawingElement('<a:graphicData/>');
    const result = parseGraphicData(elem);
    expect(result).not.toBeNull();
    expect(result!.uri).toBeNull();
    expect(result!.pic).toBeNull();
  });
});

// =============================================================================
// Graphic Parser Tests (<a:graphic>)
// =============================================================================

describe('parseGraphic', () => {
  it('should return null for null input', () => {
    const result = parseGraphic(null);
    expect(result).toBeNull();
  });

  it('should parse graphic with graphicData', () => {
    const elem = makeDrawingElement(`
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic>
            <pic:blipFill>
              <a:blip r:embed="rId9"/>
            </pic:blipFill>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    `);
    const result = parseGraphic(elem);
    expect(result).not.toBeNull();
    expect(result!.graphicData).not.toBeNull();
    expect(result!.graphicData!.pic).not.toBeNull();
    expect(result!.graphicData!.pic!.blipFill).not.toBeNull();
    expect(result!.graphicData!.pic!.blipFill!.blip).not.toBeNull();
    expect(result!.graphicData!.pic!.blipFill!.blip!.embed).toBe('rId9');
  });

  it('should parse empty graphic element', () => {
    const elem = makeDrawingElement('<a:graphic/>');
    const result = parseGraphic(elem);
    expect(result).not.toBeNull();
    expect(result!.graphicData).toBeNull();
  });
});

// =============================================================================
// Inline Drawing Parser Tests (<wp:inline>)
// =============================================================================

describe('parseInlineDrawing', () => {
  it('should return null for null input', () => {
    const result = parseInlineDrawing(null);
    expect(result).toBeNull();
  });

  it('should parse complete inline drawing', () => {
    const elem = makeDrawingElement(`
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="952500" cy="476250"/>
        <wp:docPr id="1" name="Picture 1" descr="Alt text here"/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:blipFill>
                <a:blip r:embed="rId10"/>
              </pic:blipFill>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    `);
    const result = parseInlineDrawing(elem);
    expect(result).not.toBeNull();
    // Check extent
    expect(result!.extent).not.toBeNull();
    expect(result!.extent!.cx).toBe(952500);
    expect(result!.extent!.cy).toBe(476250);
    // Check docPr
    expect(result!.docPr).not.toBeNull();
    expect(result!.docPr!.id).toBe(1);
    expect(result!.docPr!.name).toBe('Picture 1');
    expect(result!.docPr!.descr).toBe('Alt text here');
    // Check graphic
    expect(result!.graphic).not.toBeNull();
    expect(result!.graphic!.graphicData).not.toBeNull();
    expect(result!.graphic!.graphicData!.pic).not.toBeNull();
    expect(result!.graphic!.graphicData!.pic!.blipFill).not.toBeNull();
    expect(result!.graphic!.graphicData!.pic!.blipFill!.blip).not.toBeNull();
    expect(result!.graphic!.graphicData!.pic!.blipFill!.blip!.embed).toBe('rId10');
  });

  it('should parse inline drawing with only extent', () => {
    const elem = makeDrawingElement(`
      <wp:inline>
        <wp:extent cx="100000" cy="100000"/>
      </wp:inline>
    `);
    const result = parseInlineDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.extent).not.toBeNull();
    expect(result!.extent!.cx).toBe(100000);
    expect(result!.docPr).toBeNull();
    expect(result!.graphic).toBeNull();
  });

  it('should parse empty inline drawing', () => {
    const elem = makeDrawingElement('<wp:inline/>');
    const result = parseInlineDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.extent).toBeNull();
    expect(result!.docPr).toBeNull();
    expect(result!.graphic).toBeNull();
  });
});

// =============================================================================
// Anchor Drawing Parser Tests (<wp:anchor>)
// =============================================================================

describe('parseAnchorDrawing', () => {
  it('should return null for null input', () => {
    const result = parseAnchorDrawing(null);
    expect(result).toBeNull();
  });

  it('should parse anchor with left horizontal alignment', () => {
    const elem = makeDrawingElement(`
      <wp:anchor behindDoc="0">
        <wp:positionH relativeFrom="column">
          <wp:align>left</wp:align>
        </wp:positionH>
        <wp:positionV relativeFrom="paragraph">
          <wp:posOffset>0</wp:posOffset>
        </wp:positionV>
        <wp:extent cx="800000" cy="800000"/>
        <wp:wrapSquare wrapText="bothSides"/>
        <wp:docPr id="2" name="Floating Image"/>
        <a:graphic>
          <a:graphicData>
            <pic:pic>
              <pic:blipFill>
                <a:blip r:embed="rId11"/>
              </pic:blipFill>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.hAlign).toBe('left');
    expect(result!.vAlign).toBeNull(); // posOffset, not align
    expect(result!.wrapType).toBe('square');
    expect(result!.behindDoc).toBe(false);
    expect(result!.extent).not.toBeNull();
    expect(result!.extent!.cx).toBe(800000);
    expect(result!.docPr).not.toBeNull();
    expect(result!.docPr!.name).toBe('Floating Image');
  });

  it('should parse anchor with right horizontal alignment', () => {
    const elem = makeDrawingElement(`
      <wp:anchor>
        <wp:positionH relativeFrom="margin">
          <wp:align>right</wp:align>
        </wp:positionH>
        <wp:extent cx="500000" cy="500000"/>
        <wp:wrapTight wrapText="bothSides"/>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.hAlign).toBe('right');
    expect(result!.wrapType).toBe('tight');
  });

  it('should parse anchor with center horizontal alignment', () => {
    const elem = makeDrawingElement(`
      <wp:anchor>
        <wp:positionH relativeFrom="page">
          <wp:align>center</wp:align>
        </wp:positionH>
        <wp:extent cx="600000" cy="400000"/>
        <wp:wrapTopAndBottom/>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.hAlign).toBe('center');
    expect(result!.wrapType).toBe('topandbottom');
  });

  it('should parse anchor with no wrapping', () => {
    const elem = makeDrawingElement(`
      <wp:anchor>
        <wp:extent cx="400000" cy="400000"/>
        <wp:wrapNone/>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.wrapType).toBe('none');
  });

  it('should parse anchor with behindDoc="1"', () => {
    const elem = makeDrawingElement(`
      <wp:anchor behindDoc="1">
        <wp:extent cx="300000" cy="300000"/>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.behindDoc).toBe(true);
  });

  it('should parse anchor with vertical alignment', () => {
    const elem = makeDrawingElement(`
      <wp:anchor>
        <wp:positionH relativeFrom="column">
          <wp:align>left</wp:align>
        </wp:positionH>
        <wp:positionV relativeFrom="paragraph">
          <wp:align>top</wp:align>
        </wp:positionV>
        <wp:extent cx="200000" cy="200000"/>
      </wp:anchor>
    `);
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.hAlign).toBe('left');
    expect(result!.vAlign).toBe('top');
  });

  it('should parse empty anchor element', () => {
    const elem = makeDrawingElement('<wp:anchor/>');
    const result = parseAnchorDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.extent).toBeNull();
    expect(result!.docPr).toBeNull();
    expect(result!.graphic).toBeNull();
    expect(result!.hAlign).toBeNull();
    expect(result!.vAlign).toBeNull();
    expect(result!.wrapType).toBeNull();
    expect(result!.behindDoc).toBeNull();
  });
});

// =============================================================================
// Drawing Parser Tests (<w:drawing>)
// =============================================================================

describe('parseDrawing', () => {
  it('should return null for null input', () => {
    const result = parseDrawing(null);
    expect(result).toBeNull();
  });

  it('should parse drawing containing inline image', () => {
    const elem = makeDrawingElement(`
      <w:drawing>
        <wp:inline>
          <wp:extent cx="914400" cy="914400"/>
          <wp:docPr id="1" name="Inline Image"/>
          <a:graphic>
            <a:graphicData>
              <pic:pic>
                <pic:blipFill>
                  <a:blip r:embed="rId12"/>
                </pic:blipFill>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    `);
    const result = parseDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.inline).not.toBeNull();
    expect(result!.anchor).toBeNull();
    expect(result!.inline!.extent).not.toBeNull();
    expect(result!.inline!.extent!.cx).toBe(914400);
    expect(result!.inline!.docPr).not.toBeNull();
    expect(result!.inline!.docPr!.name).toBe('Inline Image');
    expect(result!.inline!.graphic).not.toBeNull();
    expect(result!.inline!.graphic!.graphicData).not.toBeNull();
    expect(result!.inline!.graphic!.graphicData!.pic).not.toBeNull();
    expect(result!.inline!.graphic!.graphicData!.pic!.blipFill).not.toBeNull();
    expect(result!.inline!.graphic!.graphicData!.pic!.blipFill!.blip).not.toBeNull();
    expect(result!.inline!.graphic!.graphicData!.pic!.blipFill!.blip!.embed).toBe('rId12');
  });

  it('should parse drawing containing anchor image', () => {
    const elem = makeDrawingElement(`
      <w:drawing>
        <wp:anchor behindDoc="0">
          <wp:positionH relativeFrom="column">
            <wp:align>right</wp:align>
          </wp:positionH>
          <wp:extent cx="1000000" cy="500000"/>
          <wp:wrapSquare wrapText="bothSides"/>
          <wp:docPr id="2" name="Floating Image"/>
          <a:graphic>
            <a:graphicData>
              <pic:pic>
                <pic:blipFill>
                  <a:blip r:embed="rId13"/>
                </pic:blipFill>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:anchor>
      </w:drawing>
    `);
    const result = parseDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.inline).toBeNull();
    expect(result!.anchor).not.toBeNull();
    expect(result!.anchor!.hAlign).toBe('right');
    expect(result!.anchor!.wrapType).toBe('square');
    expect(result!.anchor!.extent).not.toBeNull();
    expect(result!.anchor!.extent!.cx).toBe(1000000);
  });

  it('should parse empty drawing element', () => {
    const elem = makeDrawingElement('<w:drawing/>');
    const result = parseDrawing(elem);
    expect(result).not.toBeNull();
    expect(result!.inline).toBeNull();
    expect(result!.anchor).toBeNull();
  });
});
