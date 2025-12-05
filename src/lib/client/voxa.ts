import { randomUUID } from 'node:crypto';
import { VOXA_VERSION } from '../version.js';
import type { VoxaConfig, RequestMetadata, HttpMethod, VoxaResponse } from '../types/client-types.js';
import { mergeConfig } from './utils.js';
import { CacheManager } from '../features/cache/manager.js';
import { QueueManager } from '../features/queue/manager.js';
import { InterceptorManager } from '../features/interceptors/manager.js';
import { DeduplicationManager } from '../features/deduplication/manager.js';
import { MetadataManager } from '../features/metadata/manager.js';
import { HttpMethods } from './http-methods.js';
import type { SchemaValidator } from '../features/schema/validator.js';
import type { RateLimiter } from '../features/rate/limiter.js';
import type { ErrorClassifier } from '../features/errors/classifier.js';

class Voxa extends HttpMethods {
        /**
         * Voxa client version
         */
        static version = VOXA_VERSION;

        /**
         * Optionally check API/SDK version at runtime and warn if mismatched
         * @param apiVersion Version string from API/SDK (if available)
         */
        static checkVersionCompatibility(apiVersion?: string) {
            if (apiVersion && apiVersion !== VOXA_VERSION) {
                // eslint-disable-next-line no-console
                console.warn(`⚠️ Voxa client version (${VOXA_VERSION}) does not match API/SDK version (${apiVersion}). Please ensure compatibility.`);
            }
        }

    /**
     * Implements the core request method for all HTTP verbs
     */
    /**
     * Core request method for all HTTP verbs. Fully typed, supports generics for response data.
     * @template T Response data type
     * @param method HTTP method
     * @param endpoint URL or endpoint
     * @param data Request body
     * @param config VoxaConfig (typed)
     * @returns VoxaResponse<T> (typed)
     */
    protected async request<T = any>(method: HttpMethod, endpoint: string, data: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const mergedConfig = mergeConfig(this.config, config);
        const now = Date.now();
        const expiryMs = 300000;
        // Allow user to inject their own requestId or metadata for tracing
        let userRequestId = (config as any)?.requestId;
        let userMetadata = (config as any)?.metadata;
        const requestId = userRequestId || randomUUID();
        const metadata: RequestMetadata = {
            id: requestId,
            method,
            endpoint,
            priority: mergedConfig.priority || 'normal',
            timestamp: now,
            expiresAt: now + expiryMs,
            ...(userMetadata || {})
        };
        this.metadataManager.set(requestId, metadata);
        let errorClassifier = this.errorClassifier;
        // Run request interceptors (async, with error handling)
        let req = { method, endpoint, data, config: mergedConfig, requestId, metadata };
        try {
            for (const { successFn, errorFn } of this.interceptorManager.getRequestInterceptors()) {
                try {
                    if (successFn) req = await Promise.resolve(successFn(req));
                } catch (err) {
                    if (errorFn) {
                        req = await Promise.resolve(errorFn(err, req));
                    } else {
                        if (errorClassifier) {
                            const classified = errorClassifier.classifyWithMessage(err);
                            throw new Error(`[Request Interceptor Error] ${classified.category}: ${classified.message}`);
                        }
                        throw err;
                    }
                }
            }
            // Main request with streaming/abort support
            let response: Response;
            try {
                // If config.signal is provided, propagate to all features (retry, queue, etc.)
                // This requires all feature managers to respect AbortSignal (not shown here, but assumed)
                const signal: AbortSignal | undefined = (config as any)?.signal;
                response = await import('./request.js').then(m => m.dispatchRequest(
                    req.method,
                    req.endpoint,
                    req.data,
                    req.config,
                    req.config.baseURL,
                    signal
                ));
            } catch (err) {
                if (errorClassifier) {
                    const classified = errorClassifier.classifyWithMessage(err);
                    throw new Error(`[Network Error] ${classified.category}: ${classified.message}`);
                }
                throw err;
            }
            // Run response interceptors (async, with error handling)
            let res: Response = response;
            for (const { successFn, errorFn } of this.interceptorManager.getResponseInterceptors()) {
                try {
                    if (successFn) res = await Promise.resolve(successFn(res));
                } catch (err) {
                    if (errorFn) {
                        res = await Promise.resolve(errorFn(err, res));
                    } else {
                        if (errorClassifier) {
                            const classified = errorClassifier.classifyWithMessage(err);
                            throw new Error(`[Response Interceptor Error] ${classified.category}: ${classified.message}`);
                        }
                        throw err;
                    }
                }
            }
            // Parse response (streaming support)
            let parsed: T | null = null;
            try {
                const contentType = res.headers.get('content-type') || '';
                if ((config as any)?.stream) {
                    // Streaming mode: return the ReadableStream directly
                    parsed = res.body as any as T;
                } else if (contentType.includes('application/json')) {
                    parsed = await res.json() as T;
                } else {
                    parsed = (await res.text()) as any;
                }
            } catch (e) {
                if (errorClassifier) {
                    const classified = errorClassifier.classifyWithMessage(e);
                    throw new Error(`[Parse Error] ${classified.category}: ${classified.message}`);
                }
                parsed = null;
            }
            return {
                response: res,
                data: parsed,
                metadata: this.metadataManager.get(requestId),
                requestId,
                status: res.status,
                statusText: res.statusText
            } as VoxaResponse<T>;
        } catch (err: any) {
            // Final error classification and surfacing
            // Always preserve original error context using cause
            if (errorClassifier) {
                const classified = errorClassifier.classifyWithMessage(err);
                throw new Error(`[Voxa Error] ${classified.category}: ${classified.message}`,{ cause: err });
            }
            throw err;
        }
    }
    private schemaValidator?: SchemaValidator;
    private rateLimiter?: RateLimiter;
    private errorClassifier?: ErrorClassifier;
    private config: VoxaConfig = {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json'
        },
        errors: { enabled: true }
    };
    private interceptorManager: InterceptorManager;
    private deduplicationManager: DeduplicationManager;
    private cacheManager: CacheManager;
    private queueManager: QueueManager;
    private metadataManager: MetadataManager;

    constructor(config: VoxaConfig = {}) {
        super();
        // Default features enabled unless explicitly disabled
        const defaultConfig: VoxaConfig = {
            deduplication: { enabled: true },
            retry: { enabled: true, count: 5 },
            errors: { enabled: true },
            metadata: { enabled: true },
            cache: { enabled: true },
            rate: { enabled: true },
        };
        // Merge defaults, then user config (user config can override enabled: false)
        this.config = mergeConfig(defaultConfig, config);
        
        // Set global debug mode
        if (this.config.debug) {
            import('./logging.js').then(({ setDebugEnabled }) => {
                setDebugEnabled(true);
            });
        }
        
        // Enforce retry count as 5 unless user disables retry
        if (this.config.retry?.enabled !== false) {
            this.config.retry = { ...(this.config.retry || {}), enabled: true, count: 5 };
        }
        this.interceptorManager = new InterceptorManager();
        const dedupConfig = { ...(this.config.deduplication || {}), enabled: this.config.deduplication?.enabled !== false };
        this.deduplicationManager = new DeduplicationManager(dedupConfig);
        this.cacheManager = new CacheManager(this.config.cache);
        this.queueManager = new QueueManager(this.config.queue);
        this.metadataManager = new MetadataManager(this.config.metadata || {});
        // Initialize ErrorClassifier automatically if enabled
        if (this.config.errors?.enabled !== false) {
            import('../features/errors/classifier.js').then(({ ErrorClassifier }) => {
                this.errorClassifier = new ErrorClassifier(this.config.errors!);
            });
        }
    }
    classifyError(error: unknown): string | undefined {
        if (this.errorClassifier && typeof (this.errorClassifier as any).classifyWithMessage === 'function') {
            const result = (this.errorClassifier as any).classifyWithMessage(error);
            return `${result.category}: ${result.message}`;
        }
        return undefined;
    }

    rate() { return this.rateLimiter; }
    schema() { return this.schemaValidator; }

    get interceptors() { return this.interceptorManager.getAPI(); }
    
    /**
     * Get a read-only copy of the current configuration
     */
    getConfig(): Readonly<VoxaConfig> {
        return { ...this.config };
    }
    
    /**
     * Check if debug mode is enabled
     */
    isDebugEnabled(): boolean {
        return this.config.debug === true;
    }
    
    getCacheStats() { return this.cacheManager.getStats(); }
    getQueueStats() { return this.queueManager.getStats(); }
    getDeduplicationStats() { return this.deduplicationManager.getStats(); }
    getMetadataStats() { return this.metadataManager.getStats(); }
    getRequestMetadata(requestId: string): RequestMetadata | undefined {
        return this.metadataManager.get(requestId);
    }
    async clearCache() { await this.cacheManager.clear(); }
    clearQueue() { this.queueManager.clear(); }
    destroy() {
        this.deduplicationManager.destroy();
        this.interceptorManager.clear();
        this.metadataManager.clear();
    }
    static async get<T = any>(url: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.get<T>(url, config);
    }
    static async post<T = any>(url: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.post<T>(url, data, config);
    }
    static async put<T = any>(url: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.put<T>(url, data, config);
    }
    static async delete<T = any>(url: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.delete<T>(url, config);
    }
    static async patch<T = any>(url: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.patch<T>(url, data, config);
    }
    static async head<T = any>(url: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.head<T>(url, config);
    }
    static async options<T = any>(url: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.options<T>(url, config);
    }
}

function create(config: VoxaConfig = {}): Voxa {
    return new Voxa(config);
}

export default create;
export { Voxa };
export type { VoxaConfig, VoxaResponse, CacheAdapter } from '../types/client-types.js';
