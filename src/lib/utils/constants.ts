/**
 * Voxa HTTP Client - Constants
 * Centralized configuration values to avoid magic numbers
 */

/**
 * Default timeout values (in milliseconds)
 */
export const DEFAULT_TIMEOUT_MS = 5000; // 5 seconds
export const DEFAULT_REQUEST_EXPIRY_MS = 300000; // 5 minutes

/**
 * Default cache TTL (in milliseconds)
 */
export const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutes

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_COUNT = 5;
export const DEFAULT_RETRY_DELAY_MS = 1000; // 1 second
export const DEFAULT_MAX_RETRY_DELAY_MS = 30000; // 30 seconds

/**
 * Default status codes for retry
 */
export const DEFAULT_RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Default headers
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

/**
 * Request priorities
 */
export const REQUEST_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

/**
 * Environment detection
 */
export const isNode = typeof process !== 'undefined' && 
  process.versions != null && 
  process.versions.node != null;

export const isBrowser = typeof globalThis !== 'undefined' && 
  typeof (globalThis as any).window !== 'undefined';