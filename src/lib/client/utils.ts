import type { VoxaConfig } from '../types/client-types.js';

/**
 * Merges instance config with request-specific config
 * Request config takes precedence over instance config
 * 
 * @param baseConfig - Instance configuration
 * @param requestConfig - Request-specific configuration
 * @returns Merged configuration object
 */
export function mergeConfig(baseConfig: VoxaConfig, requestConfig: VoxaConfig): VoxaConfig {
    return {
        ...baseConfig,
        ...requestConfig,
        headers: {
            ...(baseConfig.headers || {}),
            ...(requestConfig?.headers || {})
        },
        retry: requestConfig.retry || baseConfig.retry
    };
}

/**
 * Build complete URL from base and endpoint
 * 
 * @param baseURL - Base URL (optional)
 * @param endpoint - Endpoint path
 * @returns Complete URL
 */
export function buildURL(baseURL: string | undefined, endpoint: string): string {
    if (!baseURL) return endpoint;
    
    // Remove trailing slash from baseURL and leading slash from endpoint
    const cleanBase = baseURL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    return `${cleanBase}/${cleanEndpoint}`;
}

// Retry logic moved to RetryManager
