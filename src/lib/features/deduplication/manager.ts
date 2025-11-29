/**
 * Request Deduplication Manager
 * Prevents duplicate concurrent requests with 5-minute TTL
 */
export class DeduplicationManager {
    private pendingRequests: Map<string, { promise: Promise<Response>; timestamp: number }> = new Map();
    private readonly TTL = 300000; // 5 minutes
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Auto cleanup every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
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
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now()
        });
    }

    /**
     * Remove pending request
     */
    removePending(key: string): void {
        this.pendingRequests.delete(key);
    }

    /**
     * Clean up expired pending requests
     */
    private cleanup(): void {
        const now = Date.now();
        
        for (const [key, entry] of this.pendingRequests.entries()) {
            if (now - entry.timestamp >= this.TTL) {
                this.pendingRequests.delete(key);
                console.log(`🧹 Cleaned up stale pending request: ${key}`);
            }
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            pendingCount: this.pendingRequests.size,
            ttl: this.TTL
        };
    }

    /**
     * Clear all pending requests and cleanup interval
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.pendingRequests.clear();
    }
}
