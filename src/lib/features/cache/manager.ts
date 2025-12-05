import type { CacheConfig, CacheEntry, CacheAdapter } from '../../types/client-types.js';
import { warnSafe, logSafe, errorSafe } from '../../client/logging.js';
import { FileStorage } from './file-storage.js';

/**
 * Cache Manager for storing and retrieving cached responses
 * Supports in-memory, file-based, and custom adapter storage
 */
export class CacheManager {
        /**
         * Dispose and cleanup all cache state
         */
        async dispose() {
            if (this.fileStorage) {
                await this.fileStorage.cleanup();
            }
            await this.clear();
            this.customAdapter = null;
            this.fileStorage = null;
        }
    private memoryCache: Map<string, CacheEntry> = new Map();
    private config: CacheConfig;
    private customAdapter: CacheAdapter | null = null;
    private fileStorage: FileStorage | null = null;

    constructor(config: CacheConfig = {}) {
        this.config = {
            enabled: config.enabled ?? false,
            ttl: config.ttl ?? 300000, // 5 minutes default
            storage: config.storage ?? 'memory',
            ...config
        };

        // Initialize based on storage type
        if (this.config.enabled) {
            if (this.config.storage === 'file') {
                this.fileStorage = new FileStorage();
                logSafe('✅ Using file-based cache storage in ~/.voxa/cache/');
            } else if (this.config.storage === 'custom') {
                if (!this.config.adapter) {
                    warnSafe('⚠️ Custom storage selected but no adapter provided. Falling back to memory cache.');
                    this.config.storage = 'memory';
                } else {
                    this.customAdapter = this.config.adapter;
                    logSafe('✅ Using custom cache adapter');
                }
            }
        }
    }


    /**
     * Generate cache key from request parameters
     */
    getCacheKey(method: string, endpoint: string, data?: any): string {
        return `voxa:${method}:${endpoint}:${JSON.stringify(data || {})}`;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry): boolean {
        return Date.now() < entry.expiresAt;
    }

    /**
     * Get cached response
     */
    async get(key: string): Promise<Response | null> {
        if (!this.config.enabled) return null;

        // File storage
        if (this.config.storage === 'file' && this.fileStorage) {
            try {
                const cached = await this.fileStorage.get(key);
                if (!cached) return null;

                const entry: CacheEntry = JSON.parse(cached);
                
                if (!this.isValid(entry)) {
                    await this.delete(key);
                    return null;
                }

                logSafe('📦 Cache HIT (File):', key);
                return new Response(JSON.stringify(entry.response), {
                    status: 200,
                    headers: { 'X-Cache': 'HIT' }
                });
            } catch (error: any) {
                errorSafe('File storage get error:', error instanceof Error ? error.message : String(error));
                return null;
            }
        }
        
        // Custom adapter
        if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                const cached = await this.customAdapter.get(key);
                if (!cached) return null;

                const entry: CacheEntry = JSON.parse(cached);
                
                if (!this.isValid(entry)) {
                    await this.delete(key);
                    return null;
                }

                logSafe('📦 Cache HIT (Custom):', key);
                return new Response(JSON.stringify(entry.response), {
                    status: 200,
                    headers: { 'X-Cache': 'HIT' }
                });
            } catch (error: any) {
                errorSafe('Custom adapter get error:', error instanceof Error ? error.message : String(error));
                return null;
            }
        }
        
        // Memory cache
        const entry = this.memoryCache.get(key);
        if (!entry) return null;

        if (!this.isValid(entry)) {
            this.memoryCache.delete(key);
            return null;
        }

        logSafe('📦 Cache HIT (Memory):', key);
        return entry.response.clone();
    }

    /**
    * Store response in cache
    */
    async set(key: string, response: Response, requestId: string, ttl?: number): Promise<void> {
        if (!this.config.enabled) return;

        const cacheTTL = ttl || this.config.ttl || 300000;
        const timestamp = Date.now();
        const entry: CacheEntry = {
            response: response.clone(),
            timestamp,
            ttl: cacheTTL,
            expiresAt: timestamp + cacheTTL,
            requestId
        };

        // File storage
        if (this.config.storage === 'file' && this.fileStorage) {
            try {
                const clonedResponse = response.clone();
                const body = await clonedResponse.text();
                const storableEntry = {
                    response: {
                        body,
                        status: clonedResponse.status,
                        statusText: clonedResponse.statusText,
                        headers: Object.fromEntries(clonedResponse.headers.entries())
                    },
                    timestamp: entry.timestamp,
                    ttl: entry.ttl,
                    expiresAt: entry.expiresAt,
                    requestId
                };
                await this.fileStorage.set(
                    key,
                    JSON.stringify(storableEntry),
                    Math.ceil(cacheTTL / 1000)
                );
                logSafe('💾 Cached in File:', key, `(TTL: ${cacheTTL}ms)`);
            } catch (error: any) {
                errorSafe('File storage set error:', error instanceof Error ? error.message : String(error));
            }
            return;
        }
        
        // Custom adapter
        if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                const clonedResponse = response.clone();
                const body = await clonedResponse.text();
                const storableEntry = {
                    response: {
                        body,
                        status: clonedResponse.status,
                        statusText: clonedResponse.statusText,
                        headers: Object.fromEntries(clonedResponse.headers.entries())
                    },
                    timestamp: entry.timestamp,
                    ttl: entry.ttl,
                    expiresAt: entry.expiresAt
                };
                await this.customAdapter.set(
                    key,
                    JSON.stringify(storableEntry),
                    Math.ceil(cacheTTL / 1000)
                );
                logSafe('💾 Cached with custom adapter:', key, `(TTL: ${cacheTTL}ms)`);
            } catch (error: any) {
                errorSafe('Custom adapter set error:', error instanceof Error ? error.message : String(error));
            }
            return;
        }
        
        // Memory cache
        this.memoryCache.set(key, entry);
        logSafe('💾 Cached in Memory:', key, `(TTL: ${cacheTTL}ms)`);
        setTimeout(() => {
            if (this.memoryCache.has(key)) {
                const cachedEntry = this.memoryCache.get(key);
                if (cachedEntry && !this.isValid(cachedEntry)) {
                    this.memoryCache.delete(key);
                }
            }
        }, cacheTTL);
    }

    /**
     * Delete cache entry
     */
    async delete(key: string): Promise<void> {
        if (this.config.storage === 'file' && this.fileStorage) {
            try {
                await this.fileStorage.delete(key);
            } catch (error: any) {
                errorSafe('File storage delete error:', error instanceof Error ? error.message : String(error));
            }
        } else if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                await this.customAdapter.delete(key);
            } catch (error: any) {
                errorSafe('Custom adapter delete error:', error instanceof Error ? error.message : String(error));
            }
        } else {
            this.memoryCache.delete(key);
        }
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        if (this.config.storage === 'file' && this.fileStorage) {
            try {
                await this.fileStorage.clear();
            } catch (error: any) {
                errorSafe('File storage clear error:', error instanceof Error ? error.message : String(error));
            }
        } else if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                await this.customAdapter.clear();
            } catch (error: any) {
                errorSafe('Custom adapter clear error:', error instanceof Error ? error.message : String(error));
            }
        } else {
            this.memoryCache.clear();
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (this.config.storage === 'file' && this.fileStorage) {
            const stats = await this.fileStorage.getStats();
            return {
                storage: 'file',
                size: stats.size,
                location: '~/.voxa/cache/'
            };
        }
        if (this.config.storage === 'custom') {
            return {
                storage: 'custom',
                adapterProvided: !!this.customAdapter
            };
        }
        if (this.config.storage === 'memory') {
            return {
                storage: 'memory',
                size: this.memoryCache.size,
                entries: Array.from(this.memoryCache.keys())
            };
        }
        return {
            storage: 'none',
            connected: false
        };
    }

    /**
     * Cleanup and dispose cache manager
     */
    async disconnect() {
        await this.dispose();
    }
}
