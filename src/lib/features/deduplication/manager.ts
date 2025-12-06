import { DeduplicationConfig } from "../../types/client-types.js";
import { logSafe } from '../../client/logging.js';
import { DEFAULT_CACHE_TTL_MS } from '../../utils/constants.js';

/**
 * Request Deduplication Manager
 * Prevents duplicate concurrent requests with 5-minute TTL
 */
export class DeduplicationManager {
    private pendingRequests: Map<string, { promise: Promise<Response>; timestamp: number }> = new Map();
    private readonly TTL: number;
    private readonly enabled: boolean;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(config: DeduplicationConfig = {}) {
        this.TTL = typeof config.ttl === 'number' ? config.ttl : DEFAULT_CACHE_TTL_MS;
        this.enabled = config.enabled !== false;
        // Auto cleanup every minute if enabled
        if (this.enabled) {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        }
    }

    /**
     * Generate cache key for deduplication
     */
    generateKey(method: string, endpoint: string, data?: any): string {
        return `${method}:${endpoint}:${JSON.stringify(data || {})}`;
    }

    /**
     * Check if request is pending and return it
     */
    getPending(key: string): Promise<Response> | null {
        if (!this.enabled) return null;
        const pending = this.pendingRequests.get(key);
        if (!pending) {
            return null;
        }
        const age = Date.now() - pending.timestamp;
        if (age >= this.TTL) {
            // Expired, remove it
            this.pendingRequests.delete(key);
            return null;
        }
        return pending.promise;
    }

    /**
     * Store pending request
     */
    setPending(key: string, promise: Promise<Response>): void {
        if (!this.enabled) return;
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now()
        });
    }

    /**
     * Remove pending request
     */
    removePending(key: string): void {
        if (!this.enabled) return;
        this.pendingRequests.delete(key);
    }

    /**
     * Clean up expired pending requests
     */
    private cleanup(): void {
        if (!this.enabled) return;
        const now = Date.now();
        for (const [key, entry] of this.pendingRequests.entries()) {
            if (now - entry.timestamp >= this.TTL) {
                this.pendingRequests.delete(key);
                logSafe(`🧹 Cleaned up stale pending request: ${key}`);
            }
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            pendingCount: this.pendingRequests.size,
            ttl: this.TTL,
            enabled: this.enabled
        };
    }

    /**
     * Clear all pending requests and cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        this.pendingRequests.clear();
    }
}
