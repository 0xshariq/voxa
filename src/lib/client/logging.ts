// Logging sanitizer utility for Voxa (TypeScript)
// Redacts tokens, passwords, and PII from logs
// Supports file-based logging to ~/.voxa/logs/

import { getFileLogger } from '../features/logging/file-logger.js';

const SENSITIVE_KEYS = [
  'authorization', 'token', 'access_token', 'refresh_token', 'password', 'secret', 'apiKey', 'apikey', 'x-api-key', 'set-cookie', 'cookie', 'email', 'ssn', 'creditcard', 'cardnumber', 'cvv', 'pin'
];

// Global debug flag - can be set by Voxa config
let globalDebugEnabled = false;
let fileLoggingEnabled = false;

export function setDebugEnabled(enabled: boolean): void {
  globalDebugEnabled = enabled;
}

export function isDebugEnabled(): boolean {
  return globalDebugEnabled;
}

export function setFileLoggingEnabled(enabled: boolean): void {
  fileLoggingEnabled = enabled;
}

export function sanitizeLog<T = any>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLog) as any;
  const out: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      out[key] = sanitizeLog(value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function logSafe(...args: any[]): void {
  const sanitized = args.map(sanitizeLog);
  // eslint-disable-next-line no-console
  console.log(...sanitized);
  
  if (fileLoggingEnabled) {
    const logger = getFileLogger();
    logger.log('info', args[0], ...args.slice(1)).catch(() => {});
  }
}

export function warnSafe(...args: any[]): void {
  const sanitized = args.map(sanitizeLog);
  // eslint-disable-next-line no-console
  console.warn(...sanitized);
  
  if (fileLoggingEnabled) {
    const logger = getFileLogger();
    logger.log('warn', args[0], ...args.slice(1)).catch(() => {});
  }
}

export function errorSafe(...args: any[]): void {
  const sanitized = args.map(sanitizeLog);
  // eslint-disable-next-line no-console
  console.error(...sanitized);
}

/**
 * Debug logging - only logs if debug mode is enabled
 */
export function debugLog(...args: any[]): void {
  if (globalDebugEnabled) {
    const sanitized = args.map(sanitizeLog);
    // eslint-disable-next-line no-console
    console.log('[Voxa Debug]', ...sanitized);
  }
}
