import type { VoxaConfig, VoxaResponse, RequestMetadata, HttpMethod } from '../types/client-types.js';
import { mergeConfig } from './utils.js';
import { CacheManager } from '../features/cache/manager.js';
import { QueueManager } from '../features/queue/manager.js';
import { InterceptorManager } from '../features/interceptors/manager.js';
import { DeduplicationManager } from '../features/deduplication/manager.js';
import { MetadataManager } from '../features/metadata/manager.js';
import { HttpMethods } from './http-methods.js';
import type { CancelManager } from '../features/cancel/manager.js';
import type { SchemaValidator } from '../features/schema/validator.js';
import type { RateLimiter } from '../features/rate/limiter.js';
import type { ErrorClassifier } from '../features/errors/classifier.js';
import type { MetricsManager } from '../features/metrics/manager.js';
import type { OfflineQueueManager } from '../features/offline/manager.js';
import type { CircuitBreakerManager } from '../features/circuitbreaker/manager.js';
import type { BatchManager } from '../features/batch/manager.js';
import type { TokenManager } from '../features/token/manager.js';

class Voxa extends HttpMethods {
    /**
     * Implements the core request method for all HTTP verbs
     */
    protected async request<T = any>(method: HttpMethod, endpoint: string, data: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        // Merge instance config with request config
        const mergedConfig = mergeConfig(this.config, config);
        // Ensure requestId is a string
        const requestId = typeof mergedConfig.requestId === 'string' ? mergedConfig.requestId : '';
        // Dispatch the actual HTTP request
        const response = await import('./request.js').then(m => m.dispatchRequest(
            method,
            endpoint,
            data,
            mergedConfig,
            mergedConfig.baseURL
        ));
        // Cast response to VoxaResponse<T> and attach metadata
        const voxaResponse = response as VoxaResponse<T>;
        voxaResponse.metadata = this.metadataManager.get(requestId);
        return voxaResponse;
    }
    private cancelManager?: CancelManager;
    private schemaValidator?: SchemaValidator;
    private rateLimiter?: RateLimiter;
    private errorClassifier?: ErrorClassifier;
    private metricsManager?: MetricsManager;
    private config: VoxaConfig = {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    private interceptorManager: InterceptorManager;
    private deduplicationManager: DeduplicationManager;
    private cacheManager: CacheManager;
    private queueManager: QueueManager;
    private metadataManager: MetadataManager;
    private offlineQueueManager?: OfflineQueueManager;
    private circuitBreakerManager?: CircuitBreakerManager;
    private batchManager?: BatchManager;
    private tokenManager?: TokenManager;

    constructor(config: VoxaConfig = {}) {
        super();
        this.config = mergeConfig(this.config, config);
        this.interceptorManager = new InterceptorManager();
        this.deduplicationManager = new DeduplicationManager();
        this.cacheManager = new CacheManager(config.cache);
        this.queueManager = new QueueManager(config.queue);
        this.metadataManager = new MetadataManager();
        // Initialize ErrorClassifier automatically if config.errors is provided
        if (config.errors) {
            // @ts-ignore: dynamic import for demonstration
            const { ErrorClassifier } = require('../features/errors/classifier');
            this.errorClassifier = new ErrorClassifier(config.errors);
        }
    }
    classifyError(error: unknown): string | undefined {
        if (this.errorClassifier) {
            return this.errorClassifier.classify(error);
        }
        return undefined;
    }

    batch() { return this.batchManager; }
    offline() { return this.offlineQueueManager; }
    circuitBreaker() { return this.circuitBreakerManager; }
    token() { return this.tokenManager; }
    metrics() { return this.metricsManager; }
    rate() { return this.rateLimiter; }
    schema() { return this.schemaValidator; }
    cancel() { return this.cancelManager; }

    get interceptors() { return this.interceptorManager.getAPI(); }
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
    static async trace<T = any>(url: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.trace<T>(url, config);
    }
    static async connect<T = any>(url: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        const instance = new Voxa(config);
        return instance.connect<T>(url, data, config);
    }
}

function create(config: VoxaConfig = {}): Voxa {
    return new Voxa(config);
}

export default create;
export { Voxa };
export type { VoxaConfig, VoxaResponse, CacheAdapter } from '../types/client-types';
