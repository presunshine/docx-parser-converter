/**
 * Numbering tracker for list counter management.
 *
 * Tracks numbering counters for lists, handles number formatting,
 * multi-level numbering, and list restarts.
 *
 * Matches Python: converters/common/numbering_tracker.py
 */

import type { Level } from '../../models/numbering/level';
import type { Numbering } from '../../models/numbering/numbering';

/**
 * Tracks numbering counters and formats list numbers.
 *
 * Maintains counters per (numId, ilvl) pair, handles different
 * number formats, multi-level numbering, and level restarts.
 */
export class NumberingTracker {
  private _numbering: Numbering | null | undefined;

  // Maps: abstractNumId -> {ilvl -> Level}
  private _abstractNumMap: Map<number, Map<number, Level>> = new Map();

  // Maps: numId -> [abstractNumId, overrides]
  private _numInstanceMap: Map<number, [number, Map<number, number>]> = new Map();

  // Counters: "numId:ilvl" -> currentValue
  private _counters: Map<string, number> = new Map();

  // Track last level used per numId for restart logic
  private _lastLevel: Map<number, number> = new Map();

  constructor(numbering: Numbering | null | undefined) {
    this._numbering = numbering;
    this._buildLookupMaps();
  }

  private _buildLookupMaps(): void {
    if (!this._numbering) {
      return;
    }

    // Build abstract numbering map: abstractNumId -> {ilvl -> Level}
    if (this._numbering.abstractNum) {
      for (const abstractNum of this._numbering.abstractNum) {
        if (abstractNum.abstractNumId !== null && abstractNum.abstractNumId !== undefined) {
          const levelMap: Map<number, Level> = new Map();
          if (abstractNum.lvl) {
            for (const level of abstractNum.lvl) {
              if (level.ilvl !== null && level.ilvl !== undefined) {
                levelMap.set(level.ilvl, level);
              }
            }
          }
          this._abstractNumMap.set(abstractNum.abstractNumId, levelMap);
        }
      }
    }

    // Build numbering instance map: numId -> [abstractNumId, overrides]
    if (this._numbering.num) {
      for (const numInstance of this._numbering.num) {
        if (
          numInstance.numId === null ||
          numInstance.numId === undefined ||
          numInstance.abstractNumId === null ||
          numInstance.abstractNumId === undefined
        ) {
          continue;
        }

        // Collect start overrides
        const overrides: Map<number, number> = new Map();
        if (numInstance.lvlOverride) {
          for (const override of numInstance.lvlOverride) {
            if (
              override.ilvl !== null &&
              override.ilvl !== undefined &&
              override.startOverride !== null &&
              override.startOverride !== undefined
            ) {
              overrides.set(override.ilvl, override.startOverride);
            }
          }
        }

        this._numInstanceMap.set(numInstance.numId, [numInstance.abstractNumId, overrides]);
      }
    }
  }

  /**
   * Get level properties for a numbering instance.
   */
  getLevel(numId: number, ilvl: number): Level | null {
    if (!this._numInstanceMap.has(numId)) {
      return null;
    }

    const [abstractNumId] = this._numInstanceMap.get(numId)!;

    if (!this._abstractNumMap.has(abstractNumId)) {
      return null;
    }

    const levelMap = this._abstractNumMap.get(abstractNumId)!;
    return levelMap.get(ilvl) || null;
  }

  /**
   * Get formatted number for a list item and increment counter.
   */
  getNumber(numId: number, ilvl: number): string {
    const level = this.getLevel(numId, ilvl);
    if (level === null) {
      return '';
    }

    // Check for level restart
    this._handleLevelRestart(numId, ilvl, level);

    // Get or initialize counter
    const counterKey = `${numId}:${ilvl}`;
    if (!this._counters.has(counterKey)) {
      // Initialize with start value (considering overrides)
      const startValue = this._getStartValue(numId, ilvl, level);
      this._counters.set(counterKey, startValue);
    } else {
      // Increment counter (unless bullet)
      const numFmt = level.numFmt || 'decimal';
      if (numFmt !== 'bullet') {
        this._counters.set(counterKey, this._counters.get(counterKey)! + 1);
      }
    }

    // Track last level
    this._lastLevel.set(numId, ilvl);

    // Format the number
    return this._formatNumber(numId, ilvl, level);
  }

  private _getStartValue(numId: number, ilvl: number, level: Level): number {
    // Check for start override
    if (this._numInstanceMap.has(numId)) {
      const [, overrides] = this._numInstanceMap.get(numId)!;
      if (overrides.has(ilvl)) {
        return overrides.get(ilvl)!;
      }
    }

    // Use level start or default to 1
    return level.start ?? 1;
  }

  private _handleLevelRestart(numId: number, ilvl: number, level: Level): void {
    if (!this._lastLevel.has(numId)) {
      return;
    }

    const lastIlvl = this._lastLevel.get(numId)!;

    // Check if we need to restart based on lvlRestart
    if (level.lvlRestart !== null && level.lvlRestart !== undefined) {
      const restartLevel = level.lvlRestart;
      if (lastIlvl <= restartLevel && lastIlvl < ilvl) {
        // Higher level was used, restart this level
        const counterKey = `${numId}:${ilvl}`;
        if (this._counters.has(counterKey)) {
          this._counters.delete(counterKey);
        }
      }
    }

    // Default behavior: higher level resets lower levels
    if (lastIlvl < ilvl) {
      // Moving to a deeper level - no reset needed for current level
    } else if (lastIlvl > ilvl) {
      // Moving to a higher level - reset all lower levels
      for (let lowerIlvl = ilvl + 1; lowerIlvl < 10; lowerIlvl++) {
        const lowerKey = `${numId}:${lowerIlvl}`;
        if (this._counters.has(lowerKey)) {
          this._counters.delete(lowerKey);
        }
      }
    }
  }

  private _formatNumber(numId: number, ilvl: number, level: Level): string {
    const numFmt = level.numFmt || 'decimal';
    const lvlText = level.lvlText || `%${ilvl + 1}`;

    if (numFmt === 'bullet') {
      // For bullets, return the text directly (it's the bullet character)
      return lvlText;
    }

    // Replace placeholders %1, %2, etc. with formatted numbers
    let result = lvlText;
    for (let placeholderLevel = 0; placeholderLevel < 10; placeholderLevel++) {
      const placeholder = `%${placeholderLevel + 1}`;
      if (result.includes(placeholder)) {
        const counterKey = `${numId}:${placeholderLevel}`;
        const counterValue = this._counters.get(counterKey) ?? 1;

        // Get format for this level
        const levelDef = this.getLevel(numId, placeholderLevel);
        let levelFmt = levelDef?.numFmt ?? 'decimal';
        levelFmt = levelFmt || 'decimal';

        const formatted = this._formatValue(counterValue, levelFmt);
        result = result.replace(placeholder, formatted);
      }
    }

    return result;
  }

  private _formatValue(value: number, numFmt: string): string {
    switch (numFmt) {
      case 'decimal':
        return String(value);
      case 'lowerLetter':
        return this._toLetter(value, true);
      case 'upperLetter':
        return this._toLetter(value, false);
      case 'lowerRoman':
        return this._toRoman(value, true);
      case 'upperRoman':
        return this._toRoman(value, false);
      case 'bullet':
        return '';
      default:
        // Default to decimal for unknown formats
        return String(value);
    }
  }

  private _toLetter(value: number, lowercase: boolean = true): string {
    let result = '';
    let v = value;
    while (v > 0) {
      v -= 1;
      const charCode = lowercase ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
      result = String.fromCharCode(charCode + (v % 26)) + result;
      v = Math.floor(v / 26);
    }
    return result;
  }

  private _toRoman(value: number, lowercase: boolean = true): string {
    if (value <= 0) {
      return String(value);
    }

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

    let result = '';
    let v = value;
    for (let i = 0; i < values.length; i++) {
      while (v >= values[i]) {
        result += numerals[i];
        v -= values[i];
      }
    }

    return lowercase ? result.toLowerCase() : result;
  }

  /**
   * Reset all counters to initial state.
   */
  reset(): void {
    this._counters.clear();
    this._lastLevel.clear();
  }

  // Public accessors for testing
  hasAbstractNum(abstractNumId: number): boolean {
    return this._abstractNumMap.has(abstractNumId);
  }

  hasNumInstance(numId: number): boolean {
    return this._numInstanceMap.has(numId);
  }
}
