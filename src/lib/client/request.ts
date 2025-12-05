
import type { HttpMethod, VoxaConfig } from '../types/client-types.js';
import { RetryManager } from '../features/retry/manager.js';
import { isPrivateIp, isValidUrl, filterHeaders } from './security.js';

/**
 * Dispatches the actual HTTP request using Fetch API
 * Implements automatic timeout and retry logic
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param data - Request payload
 * @param config - Merged configuration
 * @param baseURL - Base URL for the request
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise resolving to the Response object
 */
/**
 * Dispatches the actual HTTP request using Fetch API
 * Implements SSRF protection, header whitelisting, timeout, and retry logic
 */
export async function dispatchRequest(
    method: HttpMethod,
    endpoint: string,
    data: any,
    config: VoxaConfig,
    baseURL?: string,
    signal?: AbortSignal
): Promise<Response> {
    // Debug logging
    if (config.debug) {
        console.log('[Voxa Debug] Request:', { method, endpoint, baseURL, hasData: !!data });
    }
    
    // Use RetryManager for retry logic
    const retryManager = new RetryManager(config.retry);
    const retryConfig = retryManager.getRetryConfig();
    let lastError: any;
    const maxAttempts = retryConfig.count + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const abortController = new AbortController();
        const timeout = config.timeout || 5000;
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
        // Use provided signal if present, otherwise use our own
        const effectiveSignal = signal || abortController.signal;
        try {
            if (effectiveSignal.aborted) throw new DOMException('Aborted', 'AbortError');
            const url = baseURL ? `${baseURL}${endpoint}` : endpoint;
            // SSRF protection: block private IPs and invalid URLs
            if (!isValidUrl(url)) throw new Error('Blocked: Invalid or malformed URL');
            if (await isPrivateIp(url)) throw new Error('Blocked: SSRF attempt to private IP');
            // Header whitelisting/blacklisting
            const safeHeaders = filterHeaders(config.headers);
            const response = await fetch(url, {
                method: method,
                headers: safeHeaders,
                body: data ? JSON.stringify(data) : undefined,
                signal: effectiveSignal
            });
            clearTimeout(timeoutId);
            // SSRF: block redirects to private IPs
            if (response.redirected && await isPrivateIp(response.url)) {
                throw new Error('Blocked: Redirected to private IP (SSRF protection)');
            }
            
            // Debug logging for successful response
            if (config.debug) {
                console.log('[Voxa Debug] Response:', { 
                    status: response.status, 
                    statusText: response.statusText,
                    redirected: response.redirected,
                    attempt: attempt + 1
                });
            }
            
            if (!response.ok && retryManager.shouldRetryStatus(response.status, retryConfig.statusCodes)) {
                if (attempt < retryConfig.count) {
                    const waitTime = retryManager.calculateRetryDelay(
                        attempt,
                        retryConfig.delay,
                        retryConfig.exponentialBackoff,
                        retryConfig.maxRetry
                    );
                    import('./logging.js').then(({ logSafe }) => logSafe(`⚠️ Request failed with status ${response.status}. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retryConfig.count})`));
                    await retryManager.sleep(waitTime, effectiveSignal);
                    continue;
                }
            }
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;
            if (effectiveSignal.aborted) throw error;
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
                import('./logging.js').then(({ logSafe }) => logSafe(`⚠️ Request failed: ${error.message}. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retryConfig.count})`));
                await retryManager.sleep(waitTime, effectiveSignal);
                continue;
            }
            if (attempt >= retryConfig.count) {
                import('./logging.js').then(({ errorSafe }) => errorSafe(`❌ Request failed after ${maxAttempts} attempts`));
            }
            throw error;
        }
    }
    throw lastError || new Error('Request failed after all retry attempts');
}
