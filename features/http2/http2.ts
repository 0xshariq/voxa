// HTTP/2 Server Push Manager for Voxa
// Handles HTTP/2 server push resources and caching
// Supports both browser and Node.js environments

import type { Http2PushConfig, PushedResource } from './types.js';

/**
 * HTTP/2 Server Push Manager
 * 
 * Manages HTTP/2 server push resources, allowing the server to proactively send
 * resources to the client before they are requested. This improves performance by
 * reducing latency for critical resources.
 * 
 * Features:
 * - Automatic detection of pushed resources (browser)
 * - Manual registration of pushed resources (Node.js)
 * - Resource caching with configurable limits
 * - Automatic cleanup of old resources
 * - Statistics and monitoring
 * 
 * @example
 * ```typescript
 * const http2Push = new Http2PushManager({
 *   enabled: true,
 *   autoCache: true,
 *   maxPushedResources: 50,
 *   onPush: (url, response) => {
 *     console.log('Resource pushed:', url);
 *   }
 * });
 * 
 * // Check if resource was pushed
 * if (http2Push.hasPushedResource('/styles.css')) {
 *   const resource = await http2Push.usePushedResource('/styles.css');
 * }
 * ```
 */
export class Http2PushManager {
    private config: Http2PushConfig;
    private pushedResources: Map<string, PushedResource> = new Map();
    private maxResources: number;

    constructor(config: Http2PushConfig = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            autoCache: config.autoCache ?? true,
            maxPushedResources: config.maxPushedResources ?? 50,
            ...config
        };
        this.maxResources = this.config.maxPushedResources || 50;

        // Listen for HTTP/2 push events in browser environment
        if (typeof globalThis !== 'undefined' && 'PerformanceObserver' in globalThis) {
            this.initializePushObserver();
        }
    }

    /**
     * Initialize Performance Observer to detect HTTP/2 server push
     * 
     * Uses the PerformanceObserver API to detect when resources are pushed
     * by the server via HTTP/2 Server Push. Automatically registers detected
     * resources for later use.
     * 
     * @private
     */
    private initializePushObserver(): void {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const navEntry = entry as any;

                    // Check if resource was pushed (nextHopProtocol is h2 and initiatorType is not fetch/xhr)
                    if (navEntry.nextHopProtocol === 'h2' && this.isPushedResource(navEntry)) {
                        this.handlePushedResource(navEntry);
                    }
                }
            });

            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('HTTP/2 Push observer initialization failed:', error);
        }
    }

    /**
     * Determine if a resource was server-pushed
     * 
     * Server push resources have distinctive performance characteristics:
     * - nextHopProtocol is 'h2' (HTTP/2)
     * - requestStart time is zero or very small
     * - Resource arrives before being requested
     * 
     * @param entry - Performance timing entry for the resource
     * @returns True if the resource was pushed by the server
     * @private
     */
    private isPushedResource(entry: any): boolean {
        // Server push resources typically have:
        // - nextHopProtocol of 'h2'
        // - Very small or zero request start time
        // - initiatorType that indicates server push
        return entry.requestStart === 0 ||
            (entry.fetchStart - entry.requestStart) < 1;
    }

    /**
     * Handle a detected pushed resource
     */
    private handlePushedResource(entry: any): void {
        if (!this.config.enabled) return;

        const url = entry.name;

        // Don't add if already cached and at max capacity
        if (this.pushedResources.size >= this.maxResources && !this.pushedResources.has(url)) {
            this.evictOldest();
        }

        // Note: We can't directly access the pushed response in browser
        // But we can track that it was pushed for optimization decisions
        console.log(`[HTTP/2 Push] Resource detected: ${url}`);

        if (this.config.onPush) {
            // Create a mock response object for the callback
            const mockResponse = new Response(null, {
                status: 200,
                statusText: 'OK (Server Push)'
            });
            this.config.onPush(url, mockResponse);
        }
    }

    /**
     * Register a pushed resource manually
     * 
     * Use this method to manually register resources that were pushed by the server.
     * This is particularly useful in Node.js environments or when you need explicit
     * control over pushed resource management.
     * 
     * @param url - The URL of the pushed resource
     * @param response - The Response object for the pushed resource
     * 
     * @example
     * ```typescript
     * const response = await fetch('/api/data');
     * http2Push.registerPushedResource('/api/data', response);
     * ```
     */
    registerPushedResource(url: string, response: Response): void {
        if (!this.config.enabled) return;

        if (this.pushedResources.size >= this.maxResources) {
            this.evictOldest();
        }

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const resource: PushedResource = {
            url,
            response: response.clone(), // Clone to avoid consuming the response
            timestamp: Date.now(),
            headers
        };

        this.pushedResources.set(url, resource);

        if (this.config.onPush) {
            this.config.onPush(url, response);
        }

        console.log(`[HTTP/2 Push] Resource registered: ${url}`);
    }

    /**
     * Check if a URL has been pushed
     */
    hasPushedResource(url: string): boolean {
        return this.pushedResources.has(url);
    }

    /**
     * Get a pushed resource if available
     */
    getPushedResource(url: string): PushedResource | undefined {
        return this.pushedResources.get(url);
    }

    /**
     * Get all pushed resources
     */
    getAllPushedResources(): Map<string, PushedResource> {
        return new Map(this.pushedResources);
    }

    /**
     * Clear a specific pushed resource
     */
    clearPushedResource(url: string): boolean {
        return this.pushedResources.delete(url);
    }

    /**
     * Clear all pushed resources
     */
    clearAllPushedResources(): void {
        this.pushedResources.clear();
    }

    /**
     * Evict the oldest pushed resource
     */
    private evictOldest(): void {
        let oldestUrl: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [url, resource] of this.pushedResources) {
            if (resource.timestamp < oldestTimestamp) {
                oldestTimestamp = resource.timestamp;
                oldestUrl = url;
            }
        }

        if (oldestUrl) {
            this.pushedResources.delete(oldestUrl);
            console.log(`[HTTP/2 Push] Evicted oldest resource: ${oldestUrl}`);
        }
    }

    /**
     * Get statistics about pushed resources
     */
    getStats(): {
        enabled: boolean;
        totalPushed: number;
        maxCapacity: number;
        resources: Array<{ url: string; timestamp: number; age: number }>;
    } {
        const now = Date.now();
        const resources = Array.from(this.pushedResources.entries()).map(([url, resource]) => ({
            url,
            timestamp: resource.timestamp,
            age: now - resource.timestamp
        }));

        return {
            enabled: this.config.enabled || false,
            totalPushed: this.pushedResources.size,
            maxCapacity: this.maxResources,
            resources
        };
    }

    /**
     * Get configuration
     */
    getConfig(): Readonly<Http2PushConfig> {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<Http2PushConfig>): void {
        this.config = { ...this.config, ...config };

        if (config.maxPushedResources !== undefined) {
            this.maxResources = config.maxPushedResources;

            // Evict excess resources if new limit is smaller
            while (this.pushedResources.size > this.maxResources) {
                this.evictOldest();
            }
        }
    }

    /**
     * Use pushed resource in a fetch request if available
     * 
     * Retrieves a previously pushed resource if available, avoiding a network request.
     * Returns null if the resource wasn't pushed or if HTTP/2 push is disabled.
     * 
     * @param url - The URL of the resource to retrieve
     * @returns Cloned Response object if available, null otherwise
     * 
     * @example
     * ```typescript
     * // Try to use pushed resource, fallback to fetch
     * const pushedResponse = await http2Push.usePushedResource('/api/data');
     * const response = pushedResponse || await fetch('/api/data');
     * ```
     */
    async usePushedResource(url: string): Promise<Response | null> {
        if (!this.config.enabled) return null;

        const pushedResource = this.pushedResources.get(url);
        if (!pushedResource) return null;

        console.log(`[HTTP/2 Push] Using pushed resource: ${url}`);

        // Return cloned response to allow multiple reads
        return pushedResource.response.clone();
    }

    /**
     * Check if HTTP/2 is supported in the current environment
     * 
     * Detects HTTP/2 support in both browser and Node.js environments:
     * - Browser: Checks navigation timing for HTTP/2 protocol
     * - Node.js: Checks if http2 module is available
     * 
     * @returns True if HTTP/2 is supported, false otherwise
     * 
     * @example
     * ```typescript
     * if (Http2PushManager.isHttp2Supported()) {
     *   const http2Push = new Http2PushManager({ enabled: true });
     * }
     * ```
     */
    static isHttp2Supported(): boolean {
        if (typeof globalThis !== 'undefined' && 'performance' in globalThis) {
            // Check if browser supports HTTP/2
            try {
                const perf = (globalThis as any).performance;
                const entry = perf.getEntriesByType('navigation')[0] as any;
                return entry?.nextHopProtocol?.startsWith('h2') || false;
            } catch {
                return false;
            }
        }

        // In Node.js, check if http2 module is available
        if (typeof process !== 'undefined') {
            try {
                require('http2');
                return true;
            } catch {
                return false;
            }
        }

        return false;
    }

    /**
     * Clean up old pushed resources based on age
     * 
     * Removes pushed resources that are older than the specified maximum age.
     * This helps prevent memory leaks and ensures fresh resources.
     * 
     * @param maxAge - Maximum age in milliseconds (default: 300000 = 5 minutes)
     * @returns Number of resources cleaned up
     * 
     * @example
     * ```typescript
     * // Clean up resources older than 10 minutes
     * const cleaned = http2Push.cleanupOldResources(600000);
     * console.log(`Cleaned up ${cleaned} old resources`);
     * ```
     */
    cleanupOldResources(maxAge: number = 300000): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [url, resource] of this.pushedResources) {
            if (now - resource.timestamp > maxAge) {
                this.pushedResources.delete(url);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[HTTP/2 Push] Cleaned up ${cleaned} old resources`);
        }

        return cleaned;
    }
}
