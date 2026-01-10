/**
 * Unit tests for image to HTML conversion.
 *
 * Tests cover:
 * - EMU to pixel conversion
 * - Inline image conversion
 * - Anchor/floating image conversion
 * - Alt text handling
 * - Image dimensions
 * - Float positioning (left, right, center)
 *
 * Matches Python: tests/unit/converters/html/test_image_to_html.py
 */

import { describe, it, expect } from 'vitest';
import {
  emuToPx,
  buildImgTag,
  getBlipEmbed,
  inlineDrawingToHtml,
  anchorDrawingToHtml,
  drawingToHtml,
} from '../image-to-html';
import type {
  Drawing,
  InlineDrawing,
  AnchorDrawing,
  Graphic,
} from '../../../models/document/drawing';

// 1x1 red PNG as base64
const TEST_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

/**
 * Helper to create test image data.
 */
function makeImageData(relId: string = 'rId1'): Map<string, { bytes: Uint8Array; contentType: string }> {
  const bytes = Uint8Array.from(atob(TEST_PNG_BASE64), c => c.charCodeAt(0));
  return new Map([[relId, { bytes, contentType: 'image/png' }]]);
}

/**
 * Helper to create inline drawing.
 */
function makeInlineDrawing(options?: {
  embed?: string;
  cx?: number | null;
  cy?: number | null;
  descr?: string | null;
}): InlineDrawing {
  const embed = options?.embed ?? 'rId1';
  const cx = options?.cx ?? 952500;
  const cy = options?.cy ?? 952500;
  const descr = options?.descr ?? null;

  return {
    extent: (cx !== null || cy !== null) ? { cx: cx ?? undefined, cy: cy ?? undefined } : undefined,
    docPr: { id: 1, name: 'Image', descr: descr ?? undefined },
    graphic: {
      graphicData: {
        pic: {
          blipFill: {
            blip: { embed },
          },
        },
      },
    },
  };
}

/**
 * Helper to create anchor drawing.
 */
function makeAnchorDrawing(options?: {
  embed?: string;
  cx?: number | null;
  cy?: number | null;
  hAlign?: string | null;
  descr?: string | null;
}): AnchorDrawing {
  const embed = options?.embed ?? 'rId1';
  const cx = options?.cx ?? 952500;
  const cy = options?.cy ?? 952500;
  const hAlign = options?.hAlign ?? null;
  const descr = options?.descr ?? null;

  return {
    extent: (cx !== null || cy !== null) ? { cx: cx ?? undefined, cy: cy ?? undefined } : undefined,
    docPr: { id: 1, name: 'Image', descr: descr ?? undefined },
    graphic: {
      graphicData: {
        pic: {
          blipFill: {
            blip: { embed },
          },
        },
      },
    },
    hAlign: hAlign ?? undefined,
  };
}

// =============================================================================
// EMU to Pixel Conversion Tests
// =============================================================================

describe('EMU to Pixel Conversion', () => {
  it('should return undefined for undefined input', () => {
    expect(emuToPx(undefined)).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    expect(emuToPx(null as unknown as number | undefined)).toBeUndefined();
  });

  it('should convert one inch (914400 EMU) to 96 pixels', () => {
    // 914400 / 9525 = 96
    expect(emuToPx(914400)).toBe(96);
  });

  it('should convert half inch (457200 EMU) to 48 pixels', () => {
    expect(emuToPx(457200)).toBe(48);
  });

  it('should convert 952500 EMU to 100 pixels', () => {
    // 100 * 9525 = 952500
    expect(emuToPx(952500)).toBe(100);
  });

  it('should convert small value (9525 EMU) to 1 pixel', () => {
    expect(emuToPx(9525)).toBe(1);
  });

  it('should convert zero to zero', () => {
    expect(emuToPx(0)).toBe(0);
  });
});

// =============================================================================
// Build Img Tag Tests
// =============================================================================

describe('Build Img Tag', () => {
  it('should build basic img tag with src', () => {
    const result = buildImgTag('data:image/png;base64,ABC', '', []);
    expect(result).toBe('<img src="data:image/png;base64,ABC" alt="">');
  });

  it('should build img tag with alt text', () => {
    const result = buildImgTag('data:image/png;base64,ABC', 'My image', []);
    expect(result).toBe('<img src="data:image/png;base64,ABC" alt="My image">');
  });

  it('should build img tag with style attributes', () => {
    const result = buildImgTag('data:image/png;base64,ABC', '', ['width: 100px', 'height: 50px']);
    expect(result).toContain('style="width: 100px; height: 50px"');
  });

  it('should escape HTML in alt text', () => {
    const result = buildImgTag('data:image/png;base64,ABC', '<script>"xss"</script>', []);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&quot;xss&quot;');
  });
});

// =============================================================================
// Get Blip Embed Tests
// =============================================================================

describe('Get Blip Embed', () => {
  it('should return undefined for null graphic', () => {
    expect(getBlipEmbed(null)).toBeUndefined();
  });

  it('should return undefined for undefined graphic', () => {
    expect(getBlipEmbed(undefined)).toBeUndefined();
  });

  it('should return undefined for graphic without graphicData', () => {
    const graphic: Graphic = { graphicData: undefined };
    expect(getBlipEmbed(graphic)).toBeUndefined();
  });

  it('should return undefined for graphic without pic', () => {
    const graphic: Graphic = { graphicData: { pic: undefined } };
    expect(getBlipEmbed(graphic)).toBeUndefined();
  });

  it('should return undefined for graphic without blipFill', () => {
    const graphic: Graphic = { graphicData: { pic: { blipFill: undefined } } };
    expect(getBlipEmbed(graphic)).toBeUndefined();
  });

  it('should return undefined for graphic without blip', () => {
    const graphic: Graphic = { graphicData: { pic: { blipFill: { blip: undefined } } } };
    expect(getBlipEmbed(graphic)).toBeUndefined();
  });

  it('should return embed ID for graphic with full chain', () => {
    const graphic: Graphic = {
      graphicData: {
        pic: {
          blipFill: {
            blip: { embed: 'rId4' },
          },
        },
      },
    };
    expect(getBlipEmbed(graphic)).toBe('rId4');
  });
});

// =============================================================================
// Inline Drawing to HTML Tests
// =============================================================================

describe('Inline Drawing to HTML', () => {
  it('should include width and height in style', () => {
    const inline = makeInlineDrawing({ cx: 952500, cy: 476250 });
    const imageData = makeImageData();

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('<img ');
    expect(result).toContain('src="data:image/png;base64,');
    expect(result).toContain('width: 100px');
    expect(result).toContain('height: 50px');
  });

  it('should include alt text', () => {
    const inline = makeInlineDrawing({ descr: 'A red square' });
    const imageData = makeImageData();

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('alt="A red square"');
  });

  it('should have empty alt when no description', () => {
    const inline = makeInlineDrawing({ descr: null });
    const imageData = makeImageData();

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('alt=""');
  });

  it('should return empty string when image data missing', () => {
    const inline = makeInlineDrawing({ embed: 'rId999' });
    const imageData = makeImageData('rId1');

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toBe('');
  });

  it('should return empty string when graphic missing', () => {
    const inline: InlineDrawing = {
      extent: { cx: 100000, cy: 100000 },
      graphic: undefined,
    };
    const imageData = makeImageData();

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toBe('');
  });
});

// =============================================================================
// Anchor Drawing to HTML Tests
// =============================================================================

describe('Anchor Drawing to HTML', () => {
  it('should use float left for left-aligned anchor', () => {
    const anchor = makeAnchorDrawing({ hAlign: 'left' });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toContain('float: left');
    expect(result).toContain('margin-right: 10px');
    expect(result).toContain('margin-bottom: 10px');
    // Wrapped in clearfix div
    expect(result).toContain('<div style="overflow: hidden;">');
  });

  it('should use float right for right-aligned anchor', () => {
    const anchor = makeAnchorDrawing({ hAlign: 'right' });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toContain('float: right');
    expect(result).toContain('margin-left: 10px');
    expect(result).toContain('margin-bottom: 10px');
    // Wrapped in clearfix div
    expect(result).toContain('<div style="overflow: hidden;">');
  });

  it('should use display block with auto margins for center-aligned anchor', () => {
    const anchor = makeAnchorDrawing({ hAlign: 'center' });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toContain('display: block');
    expect(result).toContain('margin-left: auto');
    expect(result).toContain('margin-right: auto');
    // Not wrapped in clearfix (no float)
    expect(result).not.toContain('<div style="overflow: hidden;">');
  });

  it('should have no float styling when no alignment', () => {
    const anchor = makeAnchorDrawing({ hAlign: null });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).not.toContain('float:');
    expect(result).not.toContain('<div style="overflow: hidden;">');
  });

  it('should include width and height', () => {
    const anchor = makeAnchorDrawing({ cx: 952500, cy: 476250 });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toContain('width: 100px');
    expect(result).toContain('height: 50px');
  });

  it('should include alt text', () => {
    const anchor = makeAnchorDrawing({ descr: 'Floating image' });
    const imageData = makeImageData();

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toContain('alt="Floating image"');
  });

  it('should return empty string when image data missing', () => {
    const anchor = makeAnchorDrawing({ embed: 'rId999' });
    const imageData = makeImageData('rId1');

    const result = anchorDrawingToHtml(anchor, imageData);

    expect(result).toBe('');
  });
});

// =============================================================================
// Drawing to HTML Tests
// =============================================================================

describe('Drawing to HTML', () => {
  it('should convert drawing with inline image', () => {
    const drawing: Drawing = {
      inline: {
        extent: { cx: 952500, cy: 952500 },
        docPr: { id: 1, descr: 'Inline' },
        graphic: {
          graphicData: {
            pic: {
              blipFill: {
                blip: { embed: 'rId1' },
              },
            },
          },
        },
      },
      anchor: undefined,
    };
    const imageData = makeImageData();

    const result = drawingToHtml(drawing, imageData);

    expect(result).toContain('<img ');
    expect(result).toContain('alt="Inline"');
  });

  it('should convert drawing with anchor image', () => {
    const drawing: Drawing = {
      inline: undefined,
      anchor: {
        extent: { cx: 952500, cy: 952500 },
        docPr: { id: 1, descr: 'Floating' },
        graphic: {
          graphicData: {
            pic: {
              blipFill: {
                blip: { embed: 'rId1' },
              },
            },
          },
        },
        hAlign: 'left',
      },
    };
    const imageData = makeImageData();

    const result = drawingToHtml(drawing, imageData);

    expect(result).toContain('<img ');
    expect(result).toContain('alt="Floating"');
    expect(result).toContain('float: left');
  });

  it('should return empty string for drawing without inline or anchor', () => {
    const drawing: Drawing = {
      inline: undefined,
      anchor: undefined,
    };
    const imageData = makeImageData();

    const result = drawingToHtml(drawing, imageData);

    expect(result).toBe('');
  });
});

// =============================================================================
// Image Format Tests
// =============================================================================

describe('Image Formats', () => {
  function makeInlineWithData(
    bytes: Uint8Array,
    contentType: string
  ): { inline: InlineDrawing; imageData: Map<string, { bytes: Uint8Array; contentType: string }> } {
    const inline = makeInlineDrawing();
    const imageData = new Map([['rId1', { bytes, contentType }]]);
    return { inline, imageData };
  }

  it('should use image/png content type for PNG', () => {
    const pngBytes = Uint8Array.from(atob(TEST_PNG_BASE64), c => c.charCodeAt(0));
    const { inline, imageData } = makeInlineWithData(pngBytes, 'image/png');

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('src="data:image/png;base64,');
  });

  it('should use image/jpeg content type for JPEG', () => {
    // Minimal valid JPEG (1x1 pixel)
    const jpegBytes = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
    ]);
    const { inline, imageData } = makeInlineWithData(jpegBytes, 'image/jpeg');

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('src="data:image/jpeg;base64,');
  });

  it('should use image/gif content type for GIF', () => {
    // Minimal GIF header
    const gifBytes = new TextEncoder().encode('GIF89a\x01\x00\x01\x00\x00\x00\x00;');
    const { inline, imageData } = makeInlineWithData(gifBytes, 'image/gif');

    const result = inlineDrawingToHtml(inline, imageData);

    expect(result).toContain('src="data:image/gif;base64,');
  });
});
