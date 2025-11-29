import type { CacheConfig, CacheEntry, CacheAdapter } from '../../types/client-types.js';
import { createClient, RedisClientType } from 'redis';

/**
 * Cache Manager for storing and retrieving cached responses
 * Supports both in-memory and Redis storage
 */
export class CacheManager {
    private memoryCache: Map<string, CacheEntry> = new Map();
    private config: CacheConfig;
    private redisClient: RedisClientType | null = null;
    private customAdapter: CacheAdapter | null = null;

    constructor(config: CacheConfig = {}) {
        this.config = {
            enabled: config.enabled ?? false,
            ttl: config.ttl ?? 300000, // 5 minutes default
            storage: config.storage ?? 'memory',
            ...config
        };

        // Initialize based on storage type
        if (this.config.enabled) {
            if (this.config.storage === 'redis') {
                this.initRedis();
            } else if (this.config.storage === 'custom') {
                if (!this.config.adapter) {
                    console.warn('⚠️ Custom storage selected but no adapter provided. Falling back to memory cache.');
                    this.config.storage = 'memory';
                } else {
                    this.customAdapter = this.config.adapter;
                    console.log('✅ Using custom cache adapter');
                }
            }
        }
    }

    /**
     * Initialize Redis connection
     */
    private async initRedis() {
        try {
            this.redisClient = createClient({
                socket: {
                    host: this.config.redis?.host || 'localhost',
                    port: this.config.redis?.port || 6379
                },
                password: this.config.redis?.password,
                database: this.config.redis?.db || 0
            });

            this.redisClient.on('error', (err: any) => {
                console.error('❌ Redis Client Error:', err.message);
                // Don't auto-fallback on connection errors to allow retry
            });

            await this.redisClient.connect();
            console.log('✅ Connected to Redis cache');
        } catch (error: any) {
            console.warn('⚠️ Redis connection failed:', error.message);
            console.log('💡 Falling back to memory cache. Voxa will work without Redis.');
            this.config.storage = 'memory';
            this.redisClient = null;
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

                console.log('📦 Cache HIT (Custom):', key);
                return new Response(JSON.stringify(entry.response), {
                    status: 200,
                    headers: { 'X-Cache': 'HIT' }
                });
            } catch (error: any) {
                console.error('Custom adapter get error:', error.message);
                return null;
            }
        }

        // Redis
        if (this.config.storage === 'redis' && this.redisClient) {
            try {
                const cached = await this.redisClient.get(key);
                if (!cached) return null;

                const entry: CacheEntry = JSON.parse(cached);
                
                if (!this.isValid(entry)) {
                    await this.delete(key);
                    return null;
                }

                console.log('📦 Cache HIT (Redis):', key);
                // Reconstruct Response from cached data
                return new Response(JSON.stringify(entry.response), {
                    status: 200,
                    headers: { 'X-Cache': 'HIT' }
                });
            } catch (error) {
                console.error('Redis get error:', error);
                return null;
            }
        } else {
            // Memory cache
            const entry = this.memoryCache.get(key);
            if (!entry) return null;

            if (!this.isValid(entry)) {
                this.memoryCache.delete(key);
                return null;
            }

            console.log('📦 Cache HIT (Memory):', key);
            return entry.response.clone();
        }
    }

    /**
     * Store response in cache
     */
    async set(key: string, response: Response, ttl?: number): Promise<void> {
        if (!this.config.enabled) return;

        const cacheTTL = ttl || this.config.ttl || 300000;
        const timestamp = Date.now();
        
        const entry: CacheEntry = {
            response: response.clone(),
            timestamp,
            ttl: cacheTTL,
            expiresAt: timestamp + cacheTTL
        };

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
                console.log('💾 Cached with custom adapter:', key, `(TTL: ${cacheTTL}ms)`);
            } catch (error: any) {
                console.error('Custom adapter set error:', error.message);
            }
            return;
        }

        // Redis
        if (this.config.storage === 'redis' && this.redisClient) {
            try {
                // Clone response and extract body for storage
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

                await this.redisClient.setEx(
                    key,
                    Math.ceil(cacheTTL / 1000), // Convert to seconds
                    JSON.stringify(storableEntry)
                );
                console.log('💾 Cached in Redis:', key, `(TTL: ${cacheTTL}ms)`);
            } catch (error) {
                console.error('Redis set error:', error);
            }
        } else {
            // Memory cache
            this.memoryCache.set(key, entry);
            console.log('💾 Cached in Memory:', key, `(TTL: ${cacheTTL}ms)`);

            // Auto cleanup expired entries
            setTimeout(() => {
                if (this.memoryCache.has(key)) {
                    const cachedEntry = this.memoryCache.get(key);
                    if (cachedEntry && !this.isValid(cachedEntry)) {
                        this.memoryCache.delete(key);
                    }
                }
            }, cacheTTL);
        }
    }

    /**
     * Delete cache entry
     */
    async delete(key: string): Promise<void> {
        if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                await this.customAdapter.delete(key);
            } catch (error: any) {
                console.error('Custom adapter delete error:', error.message);
            }
        } else if (this.config.storage === 'redis' && this.redisClient) {
            try {
                await this.redisClient.del(key);
            } catch (error: any) {
                console.error('Redis delete error:', error.message);
            }
        } else {
            this.memoryCache.delete(key);
        }
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        if (this.config.storage === 'custom' && this.customAdapter) {
            try {
                await this.customAdapter.clear();
            } catch (error: any) {
                console.error('Custom adapter clear error:', error.message);
            }
        } else if (this.config.storage === 'redis' && this.redisClient) {
            try {
                await this.redisClient.flushDb();
            } catch (error: any) {
                console.error('Redis clear error:', error.message);
            }
        } else {
            this.memoryCache.clear();
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
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
            storage: 'redis',
            connected: this.redisClient?.isOpen || false
        };
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.redisClient && this.redisClient.isOpen) {
            await this.redisClient.disconnect();
        }
    }
}
