/**
 * Unit tests for NumberingTracker class.
 *
 * Tests numbering counter tracking, formatting, and edge cases.
 * Matches Python: tests/unit/converters/test_numbering_tracker.py
 */

import { describe, it, expect } from 'vitest';
import { NumberingTracker } from '../numbering-tracker';
import type { Numbering } from '../../../models/numbering/numbering';

// =============================================================================
// Test Fixtures
// =============================================================================

function simpleNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [
          {
            ilvl: 0,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.',
            lvlJc: 'left',
          },
        ],
      },
    ],
    num: [{ numId: 1, abstractNumId: 0 }],
  };
}

function bulletNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [
          {
            ilvl: 0,
            numFmt: 'bullet',
            lvlText: '•',
            lvlJc: 'left',
          },
          {
            ilvl: 1,
            numFmt: 'bullet',
            lvlText: '◦',
            lvlJc: 'left',
          },
          {
            ilvl: 2,
            numFmt: 'bullet',
            lvlText: '▪',
            lvlJc: 'left',
          },
        ],
      },
    ],
    num: [{ numId: 1, abstractNumId: 0 }],
  };
}

function multiLevelNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        multiLevelType: 'multilevel',
        lvl: [
          {
            ilvl: 0,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.',
            lvlJc: 'left',
          },
          {
            ilvl: 1,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.%2.',
            lvlJc: 'left',
          },
          {
            ilvl: 2,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.%2.%3.',
            lvlJc: 'left',
          },
        ],
      },
    ],
    num: [{ numId: 1, abstractNumId: 0 }],
  };
}

function variousFormatsNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'decimal', lvlText: '%1.' }],
      },
      {
        abstractNumId: 1,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'lowerLetter', lvlText: '%1)' }],
      },
      {
        abstractNumId: 2,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'upperLetter', lvlText: '%1.' }],
      },
      {
        abstractNumId: 3,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'lowerRoman', lvlText: '%1.' }],
      },
      {
        abstractNumId: 4,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'upperRoman', lvlText: '(%1)' }],
      },
    ],
    num: [
      { numId: 1, abstractNumId: 0 },
      { numId: 2, abstractNumId: 1 },
      { numId: 3, abstractNumId: 2 },
      { numId: 4, abstractNumId: 3 },
      { numId: 5, abstractNumId: 4 },
    ],
  };
}

function restartNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [
          {
            ilvl: 0,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.',
          },
          {
            ilvl: 1,
            start: 1,
            numFmt: 'lowerLetter',
            lvlText: '%2)',
            lvlRestart: 0, // Restart when level 0 increments
          },
          {
            ilvl: 2,
            start: 1,
            numFmt: 'lowerRoman',
            lvlText: '%3.',
            lvlRestart: 1, // Restart when level 1 increments
          },
        ],
      },
    ],
    num: [{ numId: 1, abstractNumId: 0 }],
  };
}

function overrideNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [
          {
            ilvl: 0,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.',
          },
        ],
      },
    ],
    num: [
      { numId: 1, abstractNumId: 0 },
      {
        numId: 2,
        abstractNumId: 0,
        lvlOverride: [{ ilvl: 0, startOverride: 10 }],
      },
    ],
  };
}

function multipleListsNumbering(): Numbering {
  return {
    abstractNum: [
      {
        abstractNumId: 0,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'decimal', lvlText: '%1.' }],
      },
      {
        abstractNumId: 1,
        lvl: [{ ilvl: 0, start: 1, numFmt: 'upperLetter', lvlText: '%1.' }],
      },
    ],
    num: [
      { numId: 1, abstractNumId: 0 },
      { numId: 2, abstractNumId: 1 },
      { numId: 3, abstractNumId: 0 }, // Different num, same abstract
    ],
  };
}

// =============================================================================
// NumberingTracker Initialization Tests
// =============================================================================

describe('NumberingTracker Initialization', () => {
  it('should initialize with numbering definitions', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    expect(tracker).not.toBeNull();
  });

  it('should initialize with empty numbering', () => {
    const tracker = new NumberingTracker({ abstractNum: [], num: [] });
    expect(tracker).not.toBeNull();
  });

  it('should initialize with null numbering', () => {
    const tracker = new NumberingTracker(null);
    expect(tracker).not.toBeNull();
  });

  it('should build lookup maps on initialization', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    expect(tracker.hasAbstractNum(0)).toBe(true);
    expect(tracker.hasNumInstance(1)).toBe(true);
  });
});

// =============================================================================
// Basic Counter Tests
// =============================================================================

describe('Basic Counter', () => {
  it('should return start value for first item', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    const result = tracker.getNumber(1, 0);
    expect(result).toBe('1.');
  });

  it('should increment on second item', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    tracker.getNumber(1, 0); // "1."
    const result = tracker.getNumber(1, 0);
    expect(result).toBe('2.');
  });

  it('should continue incrementing with each call', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(tracker.getNumber(1, 0));
    }
    expect(results).toEqual(['1.', '2.', '3.', '4.', '5.']);
  });

  it('should handle custom start value', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 5, numFmt: 'decimal', lvlText: '%1.' }],
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    expect(tracker.getNumber(1, 0)).toBe('5.');
    expect(tracker.getNumber(1, 0)).toBe('6.');
  });
});

// =============================================================================
// Number Format Tests
// =============================================================================

describe('Number Formats', () => {
  it('should format decimal (1, 2, 3...)', () => {
    const tracker = new NumberingTracker(variousFormatsNumbering());
    expect(tracker.getNumber(1, 0)).toBe('1.');
    expect(tracker.getNumber(1, 0)).toBe('2.');
    expect(tracker.getNumber(1, 0)).toBe('3.');
  });

  it('should format lowerLetter (a, b, c...)', () => {
    const tracker = new NumberingTracker(variousFormatsNumbering());
    expect(tracker.getNumber(2, 0)).toBe('a)');
    expect(tracker.getNumber(2, 0)).toBe('b)');
    expect(tracker.getNumber(2, 0)).toBe('c)');
  });

  it('should format upperLetter (A, B, C...)', () => {
    const tracker = new NumberingTracker(variousFormatsNumbering());
    expect(tracker.getNumber(3, 0)).toBe('A.');
    expect(tracker.getNumber(3, 0)).toBe('B.');
    expect(tracker.getNumber(3, 0)).toBe('C.');
  });

  it('should format lowerRoman (i, ii, iii...)', () => {
    const tracker = new NumberingTracker(variousFormatsNumbering());
    expect(tracker.getNumber(4, 0)).toBe('i.');
    expect(tracker.getNumber(4, 0)).toBe('ii.');
    expect(tracker.getNumber(4, 0)).toBe('iii.');
  });

  it('should format upperRoman (I, II, III...)', () => {
    const tracker = new NumberingTracker(variousFormatsNumbering());
    expect(tracker.getNumber(5, 0)).toBe('(I)');
    expect(tracker.getNumber(5, 0)).toBe('(II)');
    expect(tracker.getNumber(5, 0)).toBe('(III)');
  });

  it('should handle bullet format (no counter increment)', () => {
    const tracker = new NumberingTracker(bulletNumbering());
    // Bullets should always return the same symbol
    expect(tracker.getNumber(1, 0)).toBe('•');
    expect(tracker.getNumber(1, 0)).toBe('•');
  });

  it('should wrap letters after z (z -> aa -> ab...)', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 26, numFmt: 'lowerLetter', lvlText: '%1)' }],
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    expect(tracker.getNumber(1, 0)).toBe('z)');
    expect(tracker.getNumber(1, 0)).toBe('aa)');
    expect(tracker.getNumber(1, 0)).toBe('ab)');
  });
});

// =============================================================================
// Multi-Level Tests
// =============================================================================

describe('Multi-Level Numbering', () => {
  it('should format nested level text (%1.%2.)', () => {
    const tracker = new NumberingTracker(multiLevelNumbering());

    // Level 0
    expect(tracker.getNumber(1, 0)).toBe('1.');

    // Level 1 (nested)
    expect(tracker.getNumber(1, 1)).toBe('1.1.');
    expect(tracker.getNumber(1, 1)).toBe('1.2.');

    // Level 2 (double nested)
    expect(tracker.getNumber(1, 2)).toBe('1.2.1.');
  });

  it('should reset lower levels when higher level increments', () => {
    const tracker = new NumberingTracker(multiLevelNumbering());

    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 1); // 1.1.
    tracker.getNumber(1, 1); // 1.2.

    // Back to level 0
    tracker.getNumber(1, 0); // 2.

    // Level 1 should reset
    expect(tracker.getNumber(1, 1)).toBe('2.1.');
  });

  it('should handle three levels of nesting', () => {
    const tracker = new NumberingTracker(multiLevelNumbering());

    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 1); // 1.1.
    tracker.getNumber(1, 2); // 1.1.1.
    tracker.getNumber(1, 2); // 1.1.2.
    tracker.getNumber(1, 1); // 1.2.
    expect(tracker.getNumber(1, 2)).toBe('1.2.1.');
  });
});

// =============================================================================
// Level Restart Tests
// =============================================================================

describe('Level Restart', () => {
  it('should restart on parent level increment', () => {
    const tracker = new NumberingTracker(restartNumbering());

    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 1); // a)
    tracker.getNumber(1, 1); // b)

    tracker.getNumber(1, 0); // 2.
    // lvlRestart=0 means restart on level 0 change
    expect(tracker.getNumber(1, 1)).toBe('a)');
  });

  it('should respect lvlRestart value', () => {
    const tracker = new NumberingTracker(restartNumbering());

    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 1); // a)
    tracker.getNumber(1, 2); // i.
    tracker.getNumber(1, 2); // ii.

    // Level 1 increments (lvlRestart=1 for level 2)
    tracker.getNumber(1, 1); // b)
    expect(tracker.getNumber(1, 2)).toBe('i.');
  });
});

// =============================================================================
// Start Override Tests
// =============================================================================

describe('Start Override', () => {
  it('should use startOverride to change start value', () => {
    const tracker = new NumberingTracker(overrideNumbering());

    // num_id=1 uses default start=1
    expect(tracker.getNumber(1, 0)).toBe('1.');

    // num_id=2 has startOverride=10
    expect(tracker.getNumber(2, 0)).toBe('10.');
    expect(tracker.getNumber(2, 0)).toBe('11.');
  });

  it('should maintain independent counters for different instances', () => {
    const tracker = new NumberingTracker(overrideNumbering());

    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 0); // 2.
    tracker.getNumber(2, 0); // 10.

    // num_id=1 should continue from where it was
    expect(tracker.getNumber(1, 0)).toBe('3.');
  });
});

// =============================================================================
// Multiple Lists Tests
// =============================================================================

describe('Multiple Lists', () => {
  it('should maintain independent counters for different numIds', () => {
    const tracker = new NumberingTracker(multipleListsNumbering());

    expect(tracker.getNumber(1, 0)).toBe('1.');
    expect(tracker.getNumber(2, 0)).toBe('A.');
    expect(tracker.getNumber(1, 0)).toBe('2.');
    expect(tracker.getNumber(2, 0)).toBe('B.');
  });

  it('should be independent even with same abstractNum', () => {
    const tracker = new NumberingTracker(multipleListsNumbering());

    // num_id=1 and num_id=3 both use abstract_num_id=0
    expect(tracker.getNumber(1, 0)).toBe('1.');
    expect(tracker.getNumber(3, 0)).toBe('1.');
    expect(tracker.getNumber(1, 0)).toBe('2.');
    expect(tracker.getNumber(3, 0)).toBe('2.');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('NumberingTracker Edge Cases', () => {
  it('should return empty string for invalid numId', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    const result = tracker.getNumber(999, 0);
    expect(result).toBe('');
  });

  it('should return empty string for invalid level', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    const result = tracker.getNumber(1, 9);
    expect(result).toBe('');
  });

  it('should default to decimal when numFmt is missing', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 1, lvlText: '%1.' }], // No numFmt
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    expect(tracker.getNumber(1, 0)).toBe('1.');
  });

  it('should default to 1 when start is missing', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, numFmt: 'decimal', lvlText: '%1.' }], // No start
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    expect(tracker.getNumber(1, 0)).toBe('1.');
  });

  it('should use number only when lvlText is missing', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 1, numFmt: 'decimal' }], // No lvlText
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    const result = tracker.getNumber(1, 0);
    expect(result).toContain('1');
  });

  it('should reset counters', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    tracker.getNumber(1, 0); // 1.
    tracker.getNumber(1, 0); // 2.

    tracker.reset();

    expect(tracker.getNumber(1, 0)).toBe('1.');
  });

  it('should retrieve level properties', () => {
    const tracker = new NumberingTracker(simpleNumbering());
    const level = tracker.getLevel(1, 0);

    expect(level).not.toBeNull();
    expect(level?.numFmt).toBe('decimal');
    expect(level?.lvlText).toBe('%1.');
  });
});

// =============================================================================
// Roman Numeral Edge Cases
// =============================================================================

describe('Roman Numerals', () => {
  it('should format Roman numerals 1-10', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 1, numFmt: 'lowerRoman', lvlText: '%1.' }],
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    const expected = ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.'];
    for (const exp of expected) {
      expect(tracker.getNumber(1, 0)).toBe(exp);
    }
  });

  it('should format larger Roman numerals', () => {
    const numbering: Numbering = {
      abstractNum: [
        {
          abstractNumId: 0,
          lvl: [{ ilvl: 0, start: 50, numFmt: 'upperRoman', lvlText: '%1.' }],
        },
      ],
      num: [{ numId: 1, abstractNumId: 0 }],
    };
    const tracker = new NumberingTracker(numbering);
    expect(tracker.getNumber(1, 0)).toBe('L.');
    expect(tracker.getNumber(1, 0)).toBe('LI.');
  });
});
