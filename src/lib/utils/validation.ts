/**
 * Voxa HTTP Client - Validation Utilities
 * Common validation functions used across features
 */

/**
 * Validate if a value is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a value is a valid HTTP status code
 */
export function isValidStatusCode(code: number): boolean {
  return Number.isInteger(code) && code >= 100 && code < 600;
}

/**
 * Validate if a value is within a numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate if an object has required properties
 */
export function hasRequiredProperties<T extends object>(
  obj: T,
  properties: (keyof T)[]
): boolean {
  return properties.every(prop => prop in obj && obj[prop] !== undefined);
}

/**
 * Validate timeout value (must be positive number)
 */
export function isValidTimeout(timeout: number): boolean {
  return Number.isFinite(timeout) && timeout > 0;
}

/**
 * Validate retry count (must be non-negative integer)
 */
export function isValidRetryCount(count: number): boolean {
  return Number.isInteger(count) && count >= 0;
}

/**
 * Validate headers object
 */
export function isValidHeaders(headers: unknown): headers is Record<string, string> {
  if (typeof headers !== 'object' || headers === null) return false;
  return Object.entries(headers).every(
    ([key, value]) => typeof key === 'string' && typeof value === 'string'
  );
}

/**
 * Sanitize and validate configuration object
 */
export function sanitizeConfig<T extends object>(config: T, defaults: Partial<T>): T {
  return { ...defaults, ...config };
}
