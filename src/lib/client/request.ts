import type { HttpMethod, VoxaConfig } from '../types/client-types.js';
import { RetryManager } from '../features/retry/manager.js';

/**
 * Dispatches the actual HTTP request using Fetch API
 * Implements automatic timeout and retry logic
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param data - Request payload
 * @param config - Merged configuration
 * @param baseURL - Base URL for the request
 * @returns Promise resolving to the Response object
 */
export async function dispatchRequest(
    method: HttpMethod,
    endpoint: string,
    data: any,
    config: VoxaConfig,
    baseURL?: string
): Promise<Response> {
    // Use RetryManager for retry logic
    const retryManager = new RetryManager(config.retry);
    const retryConfig = retryManager.getRetryConfig();
    let lastError: any;
    const maxAttempts = retryConfig.count + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const abortController = new AbortController();
        const timeout = config.timeout || 5000;
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
        try {
            const url = baseURL ? `${baseURL}${endpoint}` : endpoint;
            const response = await fetch(url, {
                method: method,
                headers: config.headers,
                body: data ? JSON.stringify(data) : undefined,
                signal: abortController.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok && retryManager.shouldRetryStatus(response.status, retryConfig.statusCodes)) {
                if (attempt < retryConfig.count) {
                    const waitTime = retryManager.calculateRetryDelay(
                        attempt,
                        retryConfig.delay,
                        retryConfig.exponentialBackoff,
                        retryConfig.maxRetry
                    );
                    console.log(`⚠️ Request failed with status ${response.status}. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retryConfig.count})`);
                    await retryManager.sleep(waitTime);
                    continue;
                }
            }
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;
            const isRetryable = error.name === 'AbortError' || 
                               error.name === 'TypeError' || 
                               error.message.includes('fetch');
            if (isRetryable && attempt < retryConfig.count) {
                const waitTime = retryManager.calculateRetryDelay(
                    attempt,
                    retryConfig.delay,
                    retryConfig.exponentialBackoff,
                    retryConfig.maxRetry
                );
                console.log(`⚠️ Request failed: ${error.message}. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retryConfig.count})`);
                await retryManager.sleep(waitTime);
                continue;
            }
            if (attempt >= retryConfig.count) {
                console.error(`❌ Request failed after ${maxAttempts} attempts`);
            }
            throw error;
        }
    }
    throw lastError || new Error('Request failed after all retry attempts');
}
