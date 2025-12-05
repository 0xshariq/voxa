/**
 * Request priority levels
 */
export type RequestPriority = 'critical' | 'high' | 'normal' | 'low';


/**
 * Supported HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';


/**
 * Response type (mirrors the DOM fetch Response.type values)
 */
export type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';


/**
 * Configuration options for Voxa HTTP client instance
 */
export interface VoxaConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    debug?: boolean; // Enable debug logging (default: false)
    deduplication?: DeduplicationConfig;
    retry?: RetryConfig;
    priority?: RequestPriority;
    cache?: CacheConfig;
    queue?: QueueConfig;
    rate?: RateLimiterConfig;
    schema?: SchemaValidatorConfig;
    errors?: ErrorClassifierConfig;
    metadata?: MetadataConfig;
}

/**
 * Metadata configuration for request tracking
 */
export interface MetadataConfig {
    enabled?: boolean; // Enable metadata tracking (default: true)
    log?: boolean; // Log metadata events to console
    fields?: Array<'id' | 'method' | 'endpoint' | 'priority' | 'timestamp' | 'startTime' | 'endTime'>; // Which fields to track
    maxEntries?: number; // Max number of metadata entries to keep
    customHandler?: (metadata: RequestMetadata) => void; // Custom handler for metadata events
}

/**
 * Schema validator config for request/response validation
 */
export interface SchemaValidatorConfig {
    enabled?: boolean;
    requestSchema?: any;
    responseSchema?: any;
    library?: 'zod' | 'yup';
}

/**
 * Error classifier config for automatic error classification
 */
export interface ErrorClassifierConfig {
    enabled?: boolean;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
    enabled?: boolean;             // Enable retry mechanism (default: false)
    count?: number;                 // How many times to retry (default: 5, max: 5)
    delay?: number;                 // Initial wait time in ms (default: 1000)
    exponentialBackoff?: boolean;   // Should wait time double each retry? (default: true)
    statusCodes?: number[];         // Only retry on specific errors (default: [429, 500, 502, 503, 504])
    maxRetry?: number;              // Maximum retry delay in ms (default: 30000)
}

/**
 * Cache adapter interface for custom cache implementations
 * Allows users to use any caching platform (Redis, Memcached, DynamoDB, etc.)
 */
export interface CacheAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/**
 * Cache configuration for response caching
 */
export interface CacheConfig {
    enabled?: boolean;              // Enable caching (default: false)
    ttl?: number;                   // Time to live in ms (default: 300000 = 5 minutes)
    storage?: 'memory' | 'file' | 'custom';   // Storage type (default: 'memory')
    adapter?: CacheAdapter;         // Custom cache adapter (required if storage='custom')
    cacheEnvs?: {
        CACHE_URL?: string;
        CACHE_PASSWORD?: string;
        CACHE_HOST?: string;
        CACHE_PORT?: number;
        CACHE_DB?: number;
    };
}

/**
 * Queue configuration for request prioritization
 */
export interface QueueConfig {
    enabled?: boolean;              // Enable queue (default: false)
    maxConcurrent?: number;         // Max concurrent requests (default: 6)
}

/**
 * Queued request for priority management
 */
export interface QueuedRequest {
    id: string;                     // Unique request ID (requestId)
    priority: 'critical' | 'high' | 'normal' | 'low';
    execute: (signal?: AbortSignal) => Promise<Response>;
    resolve: (value: Response) => void;
    reject: (error: any) => void;
    timestamp: number;              // When request was queued
    signal?: AbortSignal;          // AbortSignal for request cancellation
}

/**
 * Request metadata for tracking
 */
export interface RequestMetadata {
    id: string;                     // Unique request ID (format: <timestamp>-<expiry>-<random>)
    method: HttpMethod;
    endpoint: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    timestamp: number;
    expiresAt?: number;
    startTime?: number;
    endTime?: number;
}

/**
 * Cache entry with TTL
 */
export interface CacheEntry {
    response: Response;
    timestamp: number;
    ttl: number;
    expiresAt: number;
    requestId?: string; // Format: <timestamp>-<expiry>-<random>
}

/**
 * Deduplication configuration
 */
export interface DeduplicationConfig {
    enabled?: boolean;              // Enable deduplication (default: false)
    ttl?: number;
}

/**
 * Rate limiter config for automatic rate limiting & throttling
 */
export interface RateLimiterConfig {
    enabled?: boolean;
    maxRequests?: number;
    perMilliseconds?: number;
}

/**     
 * Interceptor with success and error handlers
 */
export interface Interceptor {
    successFn: any;
    errorFn: any;
}

/**
 * VoxaResponse: enriched response object, not extending Response
 */
export interface VoxaResponse<T = any> {
    response: Response;
    data: T | null;
    metadata: RequestMetadata;
    requestId: string;
    status: number;
    statusText: string;
}
