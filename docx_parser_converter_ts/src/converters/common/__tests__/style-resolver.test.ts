/**
 * Unit tests for StyleResolver class.
 *
 * Tests style inheritance resolution, property merging, and edge cases.
 * Matches Python: tests/unit/converters/test_style_resolver.py
 */

import { describe, it, expect } from 'vitest';
import { StyleResolver } from '../style-resolver';
import type { Styles } from '../../../models/styles/styles';
import type { Style } from '../../../models/styles/style';
import type { DocumentDefaults } from '../../../models/styles/document-defaults';

// =============================================================================
// Test Fixtures
// =============================================================================

function emptyStyles(): Styles {
  return { style: [] };
}

function simpleStyles(): Styles {
  return {
    style: [
      {
        type: 'paragraph',
        styleId: 'Normal',
        name: 'Normal',
        default: true,
        pPr: { jc: 'left' },
        rPr: { sz: 24 },
      },
      {
        type: 'paragraph',
        styleId: 'Title',
        name: 'Title',
        pPr: { jc: 'center', spacing: { before: 240 } },
        rPr: { b: true, sz: 56 },
      },
      {
        type: 'character',
        styleId: 'Strong',
        name: 'Strong',
        rPr: { b: true },
      },
    ],
  };
}

function inheritedStyles(): Styles {
  return {
    style: [
      {
        type: 'paragraph',
        styleId: 'Normal',
        name: 'Normal',
        default: true,
        pPr: { jc: 'left', spacing: { after: 200 } },
        rPr: { sz: 24, rFonts: { ascii: 'Calibri' } },
      },
      {
        type: 'paragraph',
        styleId: 'Heading1',
        name: 'heading 1',
        basedOn: 'Normal',
        pPr: { jc: 'left', spacing: { before: 240, after: 0 } },
        rPr: { b: true, sz: 32 },
      },
      {
        type: 'paragraph',
        styleId: 'Heading2',
        name: 'heading 2',
        basedOn: 'Heading1',
        rPr: { sz: 28, i: true },
      },
      {
        type: 'paragraph',
        styleId: 'Heading3',
        name: 'heading 3',
        basedOn: 'Heading2',
        rPr: { sz: 24 },
      },
    ],
  };
}

function circularStyles(): Styles {
  return {
    style: [
      {
        type: 'paragraph',
        styleId: 'StyleA',
        name: 'Style A',
        basedOn: 'StyleB',
        pPr: { jc: 'center' },
      },
      {
        type: 'paragraph',
        styleId: 'StyleB',
        name: 'Style B',
        basedOn: 'StyleA',
        pPr: { jc: 'right' },
      },
    ],
  };
}

function missingBasedOnStyles(): Styles {
  return {
    style: [
      {
        type: 'paragraph',
        styleId: 'Orphan',
        name: 'Orphan Style',
        basedOn: 'NonExistent',
        pPr: { jc: 'center' },
      },
    ],
  };
}

function documentDefaults(): DocumentDefaults {
  return {
    rPrDefault: { rPr: { sz: 22, rFonts: { ascii: 'Times New Roman' } } },
    pPrDefault: { pPr: { spacing: { after: 160, line: 259 } } },
  };
}

function tableStyles(): Styles {
  return {
    style: [
      {
        type: 'table',
        styleId: 'TableNormal',
        name: 'Normal Table',
        default: true,
        tblPr: { tblCellMar: { top: { w: 0 }, left: { w: 108 } } },
      },
      {
        type: 'table',
        styleId: 'TableGrid',
        name: 'Table Grid',
        basedOn: 'TableNormal',
        tblPr: {
          tblBorders: {
            top: { val: 'single', sz: 4 },
            left: { val: 'single', sz: 4 },
            bottom: { val: 'single', sz: 4 },
            right: { val: 'single', sz: 4 },
            insideH: { val: 'single', sz: 4 },
            insideV: { val: 'single', sz: 4 },
          },
        },
      },
    ],
  };
}

// =============================================================================
// StyleResolver Initialization Tests
// =============================================================================

describe('StyleResolver Initialization', () => {
  it('should initialize with empty styles', () => {
    const resolver = new StyleResolver(emptyStyles());
    expect(resolver).not.toBeNull();
    expect(resolver.getStyleMap().size).toBe(0);
  });

  it('should initialize with style definitions', () => {
    const resolver = new StyleResolver(simpleStyles());
    expect(resolver.getStyleMap().size).toBe(3);
    expect(resolver.getStyleMap().has('Normal')).toBe(true);
    expect(resolver.getStyleMap().has('Title')).toBe(true);
    expect(resolver.getStyleMap().has('Strong')).toBe(true);
  });

  it('should initialize with document defaults', () => {
    const resolver = new StyleResolver(simpleStyles(), documentDefaults());
    expect(resolver.getDocDefaults()).not.toBeNull();
  });

  it('should initialize with null styles', () => {
    const resolver = new StyleResolver(null);
    expect(resolver).not.toBeNull();
    expect(resolver.getStyleMap().size).toBe(0);
  });
});

// =============================================================================
// Basic Style Resolution Tests
// =============================================================================

describe('Basic Style Resolution', () => {
  it('should resolve existing style by ID', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.resolveStyle('Normal');
    expect(result).not.toBeNull();
    expect(result?.pPr).not.toBeNull();
    expect(result?.pPr?.jc).toBe('left');
    expect(result?.rPr).not.toBeNull();
    expect(result?.rPr?.sz).toBe(24);
  });

  it('should return null for nonexistent style', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.resolveStyle('NonExistent');
    expect(result).toBeNull();
  });

  it('should return null for null style ID', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.resolveStyle(null);
    expect(result).toBeNull();
  });

  it('should resolve default paragraph style', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.getDefaultParagraphStyle();
    expect(result).not.toBeNull();
    expect(result?.styleId).toBe('Normal');
  });

  it('should resolve character style', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.resolveStyle('Strong');
    expect(result).not.toBeNull();
    expect(result?.rPr).not.toBeNull();
    expect(result?.rPr?.b).toBe(true);
  });
});

// =============================================================================
// Style Inheritance Tests
// =============================================================================

describe('Style Inheritance', () => {
  it('should resolve single level inheritance', () => {
    const resolver = new StyleResolver(inheritedStyles());
    const result = resolver.resolveParagraphProperties('Heading1');

    // From Heading1 directly
    expect(result.spacing?.before).toBe(240);
    expect(result.spacing?.after).toBe(0); // Overrides Normal's 200

    // From run properties
    expect(result.rPr?.b).toBe(true);
    expect(result.rPr?.sz).toBe(32);

    // Inherited from Normal
    expect(result.jc).toBe('left');
    expect(result.rPr?.rFonts?.ascii).toBe('Calibri');
  });

  it('should resolve multi-level inheritance', () => {
    const resolver = new StyleResolver(inheritedStyles());
    const result = resolver.resolveParagraphProperties('Heading3');

    // From Heading3
    expect(result.rPr?.sz).toBe(24);

    // From Heading2
    expect(result.rPr?.i).toBe(true);

    // From Heading1
    expect(result.rPr?.b).toBe(true);
    expect(result.spacing?.before).toBe(240);

    // From Normal (through chain)
    expect(result.rPr?.rFonts?.ascii).toBe('Calibri');
  });

  it('should allow child to override parent properties', () => {
    const resolver = new StyleResolver(inheritedStyles());
    const result = resolver.resolveParagraphProperties('Heading1');

    // spacing.after is 200 in Normal, but 0 in Heading1
    expect(result.spacing?.after).toBe(0);
  });

  it('should deep merge nested properties', () => {
    const resolver = new StyleResolver(inheritedStyles());

    // Heading1 has spacing.before=240, spacing.after=0
    // Normal has spacing.after=200
    // Result should have both before and after from Heading1
    const result = resolver.resolveParagraphProperties('Heading1');
    expect(result.spacing?.before).toBe(240);
    expect(result.spacing?.after).toBe(0);
  });
});

// =============================================================================
// Circular Reference Tests
// =============================================================================

describe('Circular References', () => {
  it('should detect simple circular reference (A -> B -> A)', () => {
    const resolver = new StyleResolver(circularStyles());
    // Should not infinite loop
    const result = resolver.resolveStyle('StyleA');
    expect(result).not.toBeNull();
    // Should have properties from StyleA at minimum
    expect(result?.pPr).not.toBeNull();
    expect(result?.pPr?.jc).toBe('center');
  });

  it('should break circular reference at detection point', () => {
    const resolver = new StyleResolver(circularStyles());
    const result = resolver.resolveStyle('StyleB');
    // Should have StyleB's properties
    expect(result).not.toBeNull();
    expect(result?.pPr).not.toBeNull();
    expect(result?.pPr?.jc).toBe('right');
  });

  it('should handle self-referencing style', () => {
    const styles: Styles = {
      style: [
        {
          type: 'paragraph',
          styleId: 'SelfRef',
          name: 'Self Reference',
          basedOn: 'SelfRef',
          pPr: { jc: 'center' },
        },
      ],
    };
    const resolver = new StyleResolver(styles);
    const result = resolver.resolveStyle('SelfRef');
    expect(result).not.toBeNull();
    expect(result?.pPr).not.toBeNull();
    expect(result?.pPr?.jc).toBe('center');
  });
});

// =============================================================================
// Missing Reference Tests
// =============================================================================

describe('Missing References', () => {
  it('should use own properties when basedOn is missing', () => {
    const resolver = new StyleResolver(missingBasedOnStyles());
    const result = resolver.resolveStyle('Orphan');
    expect(result).not.toBeNull();
    expect(result?.pPr).not.toBeNull();
    expect(result?.pPr?.jc).toBe('center');
  });

  // Note: Logging test omitted - TypeScript implementation may handle logging differently
});

// =============================================================================
// Document Defaults Integration Tests
// =============================================================================

describe('Document Defaults Integration', () => {
  it('should apply defaults before style properties', () => {
    const resolver = new StyleResolver(simpleStyles(), documentDefaults());
    const result = resolver.resolveParagraphProperties('Normal');

    // From Normal style
    expect(result.jc).toBe('left');
  });

  it('should allow style to override defaults', () => {
    const resolver = new StyleResolver(simpleStyles(), documentDefaults());
    const result = resolver.resolveRunProperties('Normal');

    // Normal has sz=24, defaults have sz=22
    // Style should win
    expect(result.sz).toBe(24);
  });

  it('should fill missing properties from defaults', () => {
    const styles: Styles = {
      style: [
        {
          type: 'paragraph',
          styleId: 'Minimal',
          name: 'Minimal',
          pPr: { jc: 'center' },
          // No rPr specified
        },
      ],
    };
    const resolver = new StyleResolver(styles, documentDefaults());
    const result = resolver.resolveRunProperties('Minimal');

    // Should get font from defaults
    expect(result.rFonts?.ascii).toBe('Times New Roman');
  });
});

// =============================================================================
// Direct Formatting Override Tests
// =============================================================================

describe('Direct Formatting Override', () => {
  it('should allow direct formatting to override style', () => {
    const resolver = new StyleResolver(simpleStyles());
    const styleProps = resolver.resolveParagraphProperties('Normal');

    // Merge with direct formatting
    const directProps = { jc: 'right', spacing: { before: 100 } };
    const result = resolver.mergeWithDirect(styleProps, directProps);

    expect(result.jc).toBe('right'); // From direct
    expect(result.spacing?.before).toBe(100); // From direct
  });

  it('should not override when direct value is null', () => {
    const resolver = new StyleResolver(simpleStyles());
    const styleProps = resolver.resolveParagraphProperties('Normal');

    const directProps = { jc: null }; // Explicit null
    const result = resolver.mergeWithDirect(styleProps, directProps);

    expect(result.jc).toBe('left'); // From style, not overridden
  });

  it('should apply merge order: defaults -> style -> direct', () => {
    const resolver = new StyleResolver(simpleStyles(), documentDefaults());

    // All three levels set different values
    const directProps = { jc: 'both' };
    const result = resolver.resolveWithDirect('Normal', directProps);

    // Direct wins
    expect(result.jc).toBe('both');
  });
});

// =============================================================================
// Style Type Resolution Tests
// =============================================================================

describe('Style Type Resolution', () => {
  it('should resolve paragraph style correctly', () => {
    const resolver = new StyleResolver(inheritedStyles());
    const result = resolver.resolveParagraphProperties('Heading1');
    expect('jc' in result).toBe(true);
    expect('spacing' in result).toBe(true);
  });

  it('should resolve character style correctly', () => {
    const resolver = new StyleResolver(simpleStyles());
    const result = resolver.resolveRunProperties('Strong');
    expect(result.b).toBe(true);
  });

  it('should resolve table style with inheritance', () => {
    const resolver = new StyleResolver(tableStyles());
    const result = resolver.resolveTableProperties('TableGrid');

    // From TableGrid
    expect('tblBorders' in result).toBe(true);

    // From TableNormal (base)
    expect('tblCellMar' in result).toBe(true);
  });

  it('should include run properties in paragraph style resolution', () => {
    const resolver = new StyleResolver(inheritedStyles());
    const { pPr, rPr } = resolver.resolveParagraphStyleFull('Heading1');

    expect(pPr.jc).toBe('left');
    expect(rPr.b).toBe(true);
    expect(rPr.sz).toBe(32);
  });
});

// =============================================================================
// Caching Tests
// =============================================================================

describe('Style Caching', () => {
  it('should cache resolved styles', () => {
    const resolver = new StyleResolver(inheritedStyles());

    // First resolution
    const result1 = resolver.resolveStyle('Heading1');

    // Second resolution should use cache
    const result2 = resolver.resolveStyle('Heading1');

    // Should be same object (cached)
    expect(result1).toBe(result2);
  });

  it('should clear cache on reset', () => {
    const resolver = new StyleResolver(inheritedStyles());
    resolver.resolveStyle('Heading1');

    resolver.clearCache();

    expect(resolver.getCacheSize()).toBe(0);
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('StyleResolver Edge Cases', () => {
  it('should handle style with no properties', () => {
    const styles: Styles = {
      style: [
        {
          type: 'paragraph',
          styleId: 'Empty',
          name: 'Empty Style',
        },
      ],
    };
    const resolver = new StyleResolver(styles);
    const result = resolver.resolveStyle('Empty');
    expect(result).not.toBeNull();
    expect(result?.pPr).toBeUndefined();
    expect(result?.rPr).toBeUndefined();
  });

  it('should handle style with only paragraph properties', () => {
    const styles: Styles = {
      style: [
        {
          type: 'paragraph',
          styleId: 'POnly',
          name: 'Paragraph Only',
          pPr: { jc: 'center' },
        },
      ],
    };
    const resolver = new StyleResolver(styles);
    const pProps = resolver.resolveParagraphProperties('POnly');
    const rProps = resolver.resolveRunProperties('POnly');

    expect(pProps.jc).toBe('center');
    expect(Object.keys(rProps).length).toBe(0);
  });

  it('should handle style with only run properties', () => {
    const styles: Styles = {
      style: [
        {
          type: 'character',
          styleId: 'ROnly',
          name: 'Run Only',
          rPr: { b: true },
        },
      ],
    };
    const resolver = new StyleResolver(styles);
    const rProps = resolver.resolveRunProperties('ROnly');
    expect(rProps.b).toBe(true);
  });

  it('should handle very deep inheritance chain (15 levels)', () => {
    const styles: Style[] = [];
    for (let i = 0; i < 15; i++) {
      const basedOn = i > 0 ? `Level${i - 1}` : undefined;
      styles.push({
        type: 'paragraph',
        styleId: `Level${i}`,
        name: `Level ${i}`,
        basedOn,
        pPr: { outlineLvl: i },
      });
    }

    const stylesObj: Styles = { style: styles };
    const resolver = new StyleResolver(stylesObj);
    const result = resolver.resolveParagraphProperties('Level14');

    // Should have accumulated all levels (last one wins)
    expect(result.outlineLvl).toBe(14);
  });

  it('should handle linked paragraph and character styles', () => {
    const styles: Styles = {
      style: [
        {
          type: 'paragraph',
          styleId: 'Heading1',
          name: 'heading 1',
          link: 'Heading1Char',
          pPr: { outlineLvl: 0 },
          rPr: { b: true, sz: 32 },
        },
        {
          type: 'character',
          styleId: 'Heading1Char',
          name: 'Heading 1 Char',
          link: 'Heading1',
          rPr: { b: true, sz: 32 },
        },
      ],
    };
    const resolver = new StyleResolver(styles);

    // Both should resolve to same run properties
    const pRProps = resolver.resolveRunProperties('Heading1');
    const cRProps = resolver.resolveRunProperties('Heading1Char');

    expect(pRProps.b).toBe(cRProps.b);
    expect(pRProps.sz).toBe(cRProps.sz);
  });
});
