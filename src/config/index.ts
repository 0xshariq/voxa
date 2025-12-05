/**
 * Configuration loader from environment variables
 * Supports both project-level (.env) and global (system) environment variables
 * 
 * Priority order:
 * 1. VOXA_* prefixed variables (global CLI usage)
 * 2. Non-prefixed variables (project .env file)
 * 3. Default values
 * 
 * All cache data is stored locally in ~/.voxa/ directory.
 * No external dependencies or services required.
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
     * Load cache configuration from environment
     */
    static getCacheConfig() {
        return {
            enabled: this.getEnvBool('CACHE_ENABLED', false),
            ttl: this.getEnvInt('CACHE_TTL', 300000),
            storage: (this.getEnv('CACHE_STORAGE', 'memory')) as 'memory' | 'file' | 'custom'
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
            cache: this.getCacheConfig(),
            queue: this.getQueueConfig(),
            retry: this.getRetryConfig(),
            http: this.getHttpConfig()
        };
    }
}

