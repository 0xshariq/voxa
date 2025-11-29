/**
 * Request priority levels
 */
export type RequestPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Configuration options for Voxa HTTP client instance
 */
export interface VoxaConfig {
    baseURL?: string;
    timeout?: number;
    requestId?: string; // Optional request ID for tracking
    headers?: Record<string, string>;
    retry?: RetryConfig;
    priority?: RequestPriority;
    cache?: CacheConfig;
    queue?: QueueConfig;
    batch?: BatchConfig;
    token?: TokenManagerConfig;
    offline?: OfflineQueueConfig;
    circuitBreaker?: CircuitBreakerConfig;
    metrics?: MetricsManagerConfig;
    errors?: ErrorClassifierConfig;
    rate?: RateLimiterConfig;
    schema?: SchemaValidatorConfig;
    cancel?: CancelManagerConfig;
}

/**
 * Cancel manager config for request cancellation with reasons
 */
export interface CancelManagerConfig {
    enabled?: boolean;
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
 * Rate limiter config for automatic rate limiting & throttling
 */
export interface RateLimiterConfig {
    enabled?: boolean;
    maxRequests?: number;
    perMilliseconds?: number;
}

/**
 * Error classifier config for automatic error classification
 */
export interface ErrorClassifierConfig {
    enabled?: boolean;
}

/**
 * Metrics manager config for performance analytics
 */
export interface MetricsManagerConfig {
    enabled?: boolean;
}
/**
 * Token manager config for OAuth2/JWT
 */
export interface TokenManagerConfig {
    enabled?: boolean;
    type?: 'oauth2' | 'jwt' | 'bearer';
    tokenEndpoint?: string;
    clientId?: string;
    clientSecret?: string;
    refreshEndpoint?: string;
    storage?: 'memory' | 'localStorage';
    getToken?: () => Promise<string>;
    setToken?: (token: string) => void;
    refreshToken?: () => Promise<string>;
}

export interface OfflineQueueConfig {
    enabled?: boolean;
    storage?: 'localStorage' | 'indexedDB';
}

export interface CircuitBreakerConfig {
    enabled?: boolean;
    threshold?: number;
    timeout?: number;
    onOpen?: () => void;
}

/**
 * Batch configuration for request batching
 */
export interface BatchConfig {
    enabled?: boolean;
    endpoint?: string; // Server endpoint for batch requests (e.g. '/batch')
    wait?: number;     // Wait time in ms to collect requests (default: 50)
    maxBatchSize?: number; // Max requests per batch (optional)
}

/**
 * Batch request type
 */
export interface BatchRequest {
    method: HttpMethod;
    url: string;
    data?: any;
    config?: VoxaConfig;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
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
    storage?: 'memory' | 'redis' | 'custom';   // Storage type (default: 'memory')
    adapter?: CacheAdapter;         // Custom cache adapter (required if storage='custom')
    redis?: {                       // Redis configuration (optional, only for storage='redis')
        host?: string;              // Redis host (default: 'localhost')
        port?: number;              // Redis port (default: 6379)
        password?: string;          // Redis password
        db?: number;                // Redis database (default: 0)
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
    id: string;                     // Unique request ID
    priority: 'critical' | 'high' | 'normal' | 'low';
    execute: () => Promise<Response>;
    resolve: (value: Response) => void;
    reject: (error: any) => void;
    timestamp: number;              // When request was queued
}

/**
 * Request metadata for tracking
 */
export interface RequestMetadata {
    id: string;                     // Unique request ID
    method: HttpMethod;
    endpoint: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    timestamp: number;
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
}

/**
 * Supported HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

/**
 * Interceptor with success and error handlers
 */
export interface Interceptor {
    successFn: any;
    errorFn: any;
}

/**
 * Extended Response with TypeScript generics support
 */
export interface VoxaResponse<T = any> extends Response {
    json(): Promise<T>;
    data?: T;
    metadata?: RequestMetadata;
}
