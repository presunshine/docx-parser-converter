/**
 * Model merging utilities.
 *
 * Matches Python: core/model_utils.py
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Check if a value is a plain object (not array, null, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merge two property objects, with override taking precedence.
 *
 * @param base - Base properties
 * @param override - Override properties
 * @param allowNoneOverride - If true, null values in override replace base values
 * @returns Merged properties
 */
export function mergeProperties<T extends Record<string, any>>(
  base: T | null,
  override: T | null,
  allowNoneOverride: boolean = false
): T | null {
  if (base === null && override === null) {
    return null;
  }

  if (base === null) {
    return override ? { ...override } : null;
  }

  if (override === null) {
    return { ...base };
  }

  const result: Record<string, any> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    // Skip null values unless explicitly allowed
    if (value === null && !allowNoneOverride) {
      continue;
    }

    // If both are plain objects, merge nested
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeProperties(result[key], value, allowNoneOverride);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Deep merge two objects recursively.
 *
 * @param base - Base object
 * @param override - Override object
 * @returns New merged object
 */
export function deepMerge<T extends Record<string, any>>(
  base: T,
  override: T
): T {
  const result: Record<string, any> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    // If both are plain objects, merge recursively
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Merge a chain of property objects in order.
 *
 * Later entries take precedence over earlier ones.
 *
 * @param chain - Array of property objects (may contain nulls)
 * @returns Merged properties
 */
export function mergeChain<T extends Record<string, any>>(
  chain: (T | null)[]
): T {
  let result: T = {} as T;

  for (const props of chain) {
    if (props !== null) {
      result = mergeProperties(result, props) as T;
    }
  }

  return result;
}
