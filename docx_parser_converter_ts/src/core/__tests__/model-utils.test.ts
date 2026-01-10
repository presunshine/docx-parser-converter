/**
 * Unit tests for model merging utilities.
 *
 * Tests deep merging of objects and property dictionaries.
 * Matches Python: tests/unit/core/test_model_utils.py
 */

import { describe, it, expect } from 'vitest';

import { mergeProperties, deepMerge, mergeChain } from '../model-utils';

// =============================================================================
// Basic Merge Tests
// =============================================================================

describe('Basic Merge', () => {
  it('merges empty objects', () => {
    const result = mergeProperties({}, {});
    expect(result).toEqual({});
  });

  it('merges with empty base', () => {
    const base: Record<string, number> = {};
    const override = { a: 1, b: 2 };
    const result = mergeProperties(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('merges with empty override', () => {
    const base = { a: 1, b: 2 };
    const override: Record<string, number> = {};
    const result = mergeProperties(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('merges non-overlapping properties', () => {
    const base = { a: 1, b: 2 };
    const override = { c: 3, d: 4 };
    const result = mergeProperties(base as Record<string, number>, override as Record<string, number>);
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it('override replaces base', () => {
    const base = { a: 1, b: 2 };
    const override = { a: 10 };
    const result = mergeProperties(base, override);
    expect(result).toEqual({ a: 10, b: 2 });
  });
});

// =============================================================================
// None/Null Handling Tests
// =============================================================================

describe('Null Handling', () => {
  it('null base returns override', () => {
    const result = mergeProperties(null, { a: 1 });
    expect(result).toEqual({ a: 1 });
  });

  it('null override returns base', () => {
    const result = mergeProperties({ a: 1 }, null);
    expect(result).toEqual({ a: 1 });
  });

  it('both null returns null', () => {
    const result = mergeProperties(null, null);
    expect(result).toBeNull();
  });

  it('null value does not override', () => {
    const base = { a: 1, b: 2 };
    const override = { a: null } as Record<string, number | null>;
    const result = mergeProperties(base as Record<string, number | null>, override);
    expect(result).not.toBeNull();
    // Null should not override existing value
    expect(result!.a).toBe(1);
    expect(result!.b).toBe(2);
  });

  it('explicit null option', () => {
    const base = { a: 1 } as Record<string, number | null>;
    const override = { a: null } as Record<string, number | null>;
    const result = mergeProperties(base, override, true);
    expect(result).not.toBeNull();
    expect(result!.a).toBeNull();
  });
});

// =============================================================================
// Deep Merge Tests
// =============================================================================

describe('Deep Merge', () => {
  it('merges nested objects', () => {
    const base = { outer: { a: 1, b: 2 } };
    const override = { outer: { b: 20, c: 3 } };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).toEqual({ outer: { a: 1, b: 20, c: 3 } });
  });

  it('merges deeply nested', () => {
    const base = { l1: { l2: { l3: { a: 1 } } } };
    const override = { l1: { l2: { l3: { b: 2 } } } };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).toEqual({ l1: { l2: { l3: { a: 1, b: 2 } } } });
  });

  it('override nested with flat', () => {
    const base = { a: { nested: 'value' } };
    const override = { a: 'flat' };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).toEqual({ a: 'flat' });
  });

  it('nested with flat base', () => {
    const base = { a: 'flat' };
    const override = { a: { nested: 'value' } };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).toEqual({ a: { nested: 'value' } });
  });

  it('partial nested override', () => {
    const base = {
      spacing: { before: 100, after: 200, line: 240 },
      jc: 'left',
    };
    const override = {
      spacing: { before: 150 }, // Only override before
    };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).spacing.before).toBe(150);
    expect((result as any).spacing.after).toBe(200);
    expect((result as any).spacing.line).toBe(240);
    expect((result as any).jc).toBe('left');
  });
});

// =============================================================================
// Style Property Merge Tests
// =============================================================================

describe('Style Property Merge', () => {
  it('merges paragraph properties', () => {
    const base = {
      jc: 'left',
      spacing: { before: 0, after: 200 },
      ind: { left: 0 },
    };
    const override = {
      jc: 'center',
      spacing: { before: 240 },
      keepNext: true,
    };
    const result = mergeProperties(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).jc).toBe('center');
    expect((result as any).spacing.before).toBe(240);
    expect((result as any).spacing.after).toBe(200); // Preserved from base
    expect((result as any).ind.left).toBe(0); // Preserved
    expect((result as any).keepNext).toBe(true); // New from override
  });

  it('merges run properties', () => {
    const base = {
      sz: 24,
      rFonts: { ascii: 'Calibri', hAnsi: 'Calibri' },
      b: false,
    };
    const override = {
      sz: 32,
      b: true,
      i: true,
    };
    const result = mergeProperties(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).sz).toBe(32);
    expect((result as any).rFonts.ascii).toBe('Calibri'); // Preserved
    expect((result as any).b).toBe(true);
    expect((result as any).i).toBe(true);
  });

  it('merges border properties', () => {
    const base = {
      top: { val: 'single', sz: 4, color: 'auto' },
      bottom: { val: 'single', sz: 4, color: 'auto' },
    };
    const override = {
      top: { sz: 8 }, // Only change size
      left: { val: 'single', sz: 4, color: 'auto' },
    };
    const result = deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).top.val).toBe('single'); // Preserved
    expect((result as any).top.sz).toBe(8); // Overridden
    expect((result as any).top.color).toBe('auto'); // Preserved
    expect((result as any).bottom.val).toBe('single'); // Preserved
    expect((result as any).left.val).toBe('single'); // New
  });
});

// =============================================================================
// List Handling Tests
// =============================================================================

describe('List Handling', () => {
  it('list replaced not merged', () => {
    const base = { items: [1, 2, 3] };
    const override = { items: [4, 5] };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!.items).toEqual([4, 5]);
  });

  it('list preserved when not overridden', () => {
    const base = { items: [1, 2, 3], other: 'value' };
    const override = { other: 'new' };
    const result = mergeProperties(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).items).toEqual([1, 2, 3]);
  });

  it('empty list overrides', () => {
    const base = { items: [1, 2, 3] };
    const override = { items: [] as number[] };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
  });
});

// =============================================================================
// Type Preservation Tests
// =============================================================================

describe('Type Preservation', () => {
  it('preserves bool type', () => {
    const base = { flag: false };
    const override = { flag: true };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!.flag).toBe(true);
    expect(typeof result!.flag).toBe('boolean');
  });

  it('preserves int type', () => {
    const base = { count: 0 };
    const override = { count: 42 };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(42);
    expect(typeof result!.count).toBe('number');
  });

  it('preserves string type', () => {
    const base = { name: 'old' };
    const override = { name: 'new' };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('new');
    expect(typeof result!.name).toBe('string');
  });

  it('different types override', () => {
    const base = { value: 123 };
    const override = { value: 'string' };
    const result = mergeProperties(base as Record<string, unknown>, override as Record<string, unknown>);
    expect(result).not.toBeNull();
    expect((result as any).value).toBe('string');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Merge Edge Cases', () => {
  it('merge does not modify originals', () => {
    const base = { a: 1, nested: { b: 2 } };
    const override = { a: 10, nested: { c: 3 } };
    const baseCopy = { a: 1, nested: { b: 2 } };
    const overrideCopy = { a: 10, nested: { c: 3 } };

    deepMerge(base as Record<string, unknown>, override as Record<string, unknown>);

    // Originals unchanged
    expect(base).toEqual(baseCopy);
    expect(override).toEqual(overrideCopy);
  });

  it('merge with special keys', () => {
    const base = { __init__: 1, class: 2, '123': 3 } as Record<string, number>;
    const override = { __init__: 10 };
    const result = mergeProperties(base, override as Record<string, number>);
    expect(result).not.toBeNull();
    expect(result!.__init__).toBe(10);
    expect(result!.class).toBe(2);
    expect(result!['123']).toBe(3);
  });

  it('merge empty string key', () => {
    const base = { '': 'empty_key', a: 1 };
    const override = { '': 'new_empty' };
    const result = mergeProperties(base, override);
    expect(result).not.toBeNull();
    expect(result!['']).toBe('new_empty');
  });

  it('very deep nesting', () => {
    // Build a deeply nested structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base: any = { l1: {} };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const override: any = { l1: {} };
    let currentBase = base.l1;
    let currentOverride = override.l1;

    for (let i = 0; i < 50; i++) {
      currentBase[`l${i + 2}`] = {};
      currentOverride[`l${i + 2}`] = {};
      currentBase = currentBase[`l${i + 2}`];
      currentOverride = currentOverride[`l${i + 2}`];
    }

    currentBase.value = 'base';
    currentOverride.value = 'override';

    const result = deepMerge(base, override);
    expect(result).not.toBeNull();
    // Navigate to the deepest level
    let current = result;
    for (let i = 0; i < 51; i++) {
      current = current[`l${i + 1}`];
    }
    expect(current.value).toBe('override');
  });
});

// =============================================================================
// Chain Merge Tests
// =============================================================================

describe('Chain Merge', () => {
  it('merges chain of three', () => {
    const defaults = { a: 1, b: 1, c: 1 };
    const style = { b: 2, c: 2 };
    const direct = { c: 3 };

    const result = mergeChain([defaults as Record<string, number>, style as Record<string, number>, direct as Record<string, number>]);
    expect((result as any).a).toBe(1); // From defaults
    expect((result as any).b).toBe(2); // From style
    expect((result as any).c).toBe(3); // From direct
  });

  it('merges chain with null', () => {
    const defaults = { a: 1 };
    const style = null;
    const direct = { b: 2 };

    const result = mergeChain([defaults as Record<string, number>, style, direct as Record<string, number>]);
    expect((result as any).a).toBe(1);
    expect((result as any).b).toBe(2);
  });

  it('merges chain respects order', () => {
    const props = [{ val: 1 }, { val: 2 }, { val: 3 }];
    const result = mergeChain(props);
    expect(result.val).toBe(3);
  });
});
