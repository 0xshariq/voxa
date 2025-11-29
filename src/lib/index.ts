/**
 * Voxa Core Library - Main Entry Point
 * 
 * This is the library entry point that can be used directly in TypeScript/JavaScript
 * or consumed by the Voxa Server for language-agnostic access.
 */

export { Voxa } from './client/voxa.js';
export { default } from './client/voxa.js';

// Export types
export type {
    VoxaConfig,
    VoxaResponse,
    CacheAdapter,
    CacheConfig,
    QueueConfig,
    RetryConfig,
    RequestPriority,
    RequestMetadata,
    HttpMethod
} from './types/client-types';

// Export managers for advanced usage
export { CacheManager } from './features/cache/manager';
export { QueueManager } from './features/queue/manager';
export { InterceptorManager } from './features/interceptors/manager';
export { DeduplicationManager } from './features/deduplication/manager';
export { MetadataManager } from './features/metadata/manager';

export { BatchManager } from './features/batch/manager';

export type { BatchConfig, BatchRequest } from './types/client-types';

// Export utilities
export { mergeConfig, buildURL } from './client/utils';
