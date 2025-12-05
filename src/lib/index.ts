/**
 * Voxa Core Library - Main Entry Point
 * 
 * This is the library entry point that can be used directly in TypeScript/JavaScript
 * or consumed by the Voxa Server for language-agnostic access.
 * 
 * Features are lazy-loaded to optimize bundle size and tree-shaking.
 */

export { Voxa } from './client/voxa.js';
export { default } from './client/voxa.js';

// Export types (no runtime cost)
export type {
    VoxaConfig,
    VoxaResponse,
    CacheAdapter,
    CacheConfig,
    QueueConfig,
    RetryConfig,
    DeduplicationConfig,
    RateLimiterConfig,
    SchemaValidatorConfig,
    ErrorClassifierConfig,
    MetadataConfig,
    RequestPriority,
    RequestMetadata,
    HttpMethod
} from './types/client-types.js';

// Core managers (commonly used, included in main bundle)
export { CacheManager } from './features/cache/manager.js';
export { QueueManager } from './features/queue/manager.js';

// Optional features - lazy loaded (use dynamic imports for better tree-shaking)
export const lazyLoadInterceptorManager = () => import('./features/interceptors/manager.js').then(m => m.InterceptorManager);
export const lazyLoadDeduplicationManager = () => import('./features/deduplication/manager.js').then(m => m.DeduplicationManager);
export const lazyLoadMetadataManager = () => import('./features/metadata/manager.js').then(m => m.MetadataManager);
export const lazyLoadRetryManager = () => import('./features/retry/manager.js').then(m => m.RetryManager);

// Direct exports for backwards compatibility (will be tree-shaken if not used)
export { InterceptorManager } from './features/interceptors/manager.js';
export { DeduplicationManager } from './features/deduplication/manager.js';
export { MetadataManager } from './features/metadata/manager.js';

// Export utilities
export { mergeConfig, buildURL } from './client/utils.js';
