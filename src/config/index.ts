/**
 * Configuration loader from environment variables
 * Supports both project-level (.env) and global (system) environment variables
 * 
 * Priority order:
 * 1. VOXA_* prefixed variables (global CLI usage)
 * 2. Non-prefixed variables (project .env file)
 * 3. Default values
 * 
 * This configuration is generic and can work with any caching platform,
 * not just Redis. Users can provide custom cache adapters.
 */
export class ConfigLoader {
    /**
     * Get environment variable with priority: VOXA_* → regular → default
     */
    private static getEnv(key: string, defaultValue: string = ''): string {
        return process.env[`VOXA_${key}`] || process.env[key] || defaultValue;
    }

    /**
     * Get environment variable as integer
     */
    private static getEnvInt(key: string, defaultValue: number): number {
        const value = this.getEnv(key);
        const parsed = parseInt(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Get environment variable as boolean
     */
    private static getEnvBool(key: string, defaultValue: boolean = false): boolean {
        const value = this.getEnv(key);
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }

    /**
     * Parse cache URL format (host:port)
     * Supports formats like:
     * - redis-host.example.com:6379
     * - redis://redis-host.example.com:6379
     * - localhost:6379
     */
    private static parseCacheUrl(url: string): { host: string; port: number } | null {
        if (!url) return null;

        const urlPattern = /^(?:redis:\/\/)?([^:]+):(\d+)/;
        const match = url.match(urlPattern);

        if (match) {
            return {
                host: match[1],
                port: parseInt(match[2])
            };
        }

        return null;
    }

    /**
     * Load generic cache backend configuration
     * Works with Redis, Memcached, or any other cache URL-based service
     */
    static getCacheBackendConfig() {
        // Check for cache URL first (for cloud services)
        const cacheUrl = this.getEnv('CACHE_URL') || this.getEnv('CACHE_PUBLIC_URL') || 
                         this.getEnv('REDIS_URL') || this.getEnv('REDIS_PUBLIC_URL');
        
        if (cacheUrl) {
            const parsed = this.parseCacheUrl(cacheUrl);
            if (parsed) {
                return {
                    host: parsed.host,
                    port: parsed.port,
                    password: this.getEnv('CACHE_PASSWORD') || this.getEnv('REDIS_PASSWORD'),
                    db: this.getEnvInt('CACHE_DB', 0) || this.getEnvInt('REDIS_DB', 0)
                };
            }
        }

        // Fallback to individual host/port
        return {
            host: this.getEnv('CACHE_HOST') || this.getEnv('REDIS_HOST', 'localhost'),
            port: this.getEnvInt('CACHE_PORT', 0) || this.getEnvInt('REDIS_PORT', 6379),
            password: this.getEnv('CACHE_PASSWORD') || this.getEnv('REDIS_PASSWORD'),
            db: this.getEnvInt('CACHE_DB', 0) || this.getEnvInt('REDIS_DB', 0)
        };
    }

    /**
     * Load cache configuration from environment
     */
    static getCacheConfig() {
        return {
            enabled: this.getEnvBool('CACHE_ENABLED', false),
            ttl: this.getEnvInt('CACHE_TTL', 300000),
            storage: (this.getEnv('CACHE_STORAGE', 'memory')) as 'memory' | 'redis' | 'custom',
            redis: this.getCacheBackendConfig() // Generic backend config (works for Redis or other services)
        };
    }

    /**
     * Load queue configuration from environment
     */
    static getQueueConfig() {
        return {
            enabled: this.getEnvBool('QUEUE_ENABLED', false),
            maxConcurrent: this.getEnvInt('QUEUE_MAX_CONCURRENT', 6)
        };
    }

    /**
     * Load retry configuration from environment
     */
    static getRetryConfig() {
        return {
            count: this.getEnvInt('RETRY_COUNT', 5),
            delay: this.getEnvInt('RETRY_DELAY', 1000),
            exponentialBackoff: this.getEnvBool('RETRY_EXPONENTIAL_BACKOFF', true)
        };
    }

    /**
     * Load HTTP configuration from environment
     */
    static getHttpConfig() {
        return {
            timeout: this.getEnvInt('HTTP_TIMEOUT', 5000) || this.getEnvInt('DEFAULT_TIMEOUT', 5000),
            baseURL: this.getEnv('HTTP_BASE_URL') || this.getEnv('DEFAULT_BASE_URL')
        };
    }

    /**
     * Load default Voxa configuration from environment
     */
    static getDefaultConfig() {
        const httpConfig = this.getHttpConfig();
        
        return {
            timeout: httpConfig.timeout,
            baseURL: httpConfig.baseURL || undefined,
            cache: this.getCacheConfig(),
            queue: this.getQueueConfig(),
            retry: this.getRetryConfig()
        };
    }

    /**
     * Get all environment variables for debugging
     */
    static getDebugInfo() {
        return {
            cache: {
                enabled: this.getEnvBool('CACHE_ENABLED'),
                storage: this.getEnv('CACHE_STORAGE', 'memory'),
                ttl: this.getEnvInt('CACHE_TTL', 300000),
                backend: this.getCacheBackendConfig()
            },
            queue: this.getQueueConfig(),
            retry: this.getRetryConfig(),
            http: this.getHttpConfig()
        };
    }
}

