/**
 * Setup tests to verify Vitest is working correctly.
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should support test.each patterns', () => {
    const testCases = [
      { input: 1, expected: 2 },
      { input: 2, expected: 4 },
      { input: 3, expected: 6 },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(input * 2).toBe(expected);
    });
  });
});
