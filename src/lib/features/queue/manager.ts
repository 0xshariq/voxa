import type { QueuedRequest, QueueConfig } from '../../types/client-types.js';
import { logSafe } from '../../client/logging.js';

/**
 * Request Queue Manager for prioritization and concurrency control
 */
export class QueueManager {
        /**
         * Dispose and cleanup all state and handlers
         */
        dispose() {
            this.clear();
            this.activeRequests = 0;
            // Add any additional cleanup logic here
        }
    private queue: QueuedRequest[] = [];
    private activeRequests = 0;
    private config: QueueConfig;

    constructor(config: QueueConfig = {}) {
        this.config = {
            enabled: config.enabled ?? false,
            maxConcurrent: config.maxConcurrent ?? 6
        };
    }

    /**
     * Sort queue by priority (highest first)
     */
    private sortQueue() {
        this.queue.sort((a, b) => {
            const priorities: Record<string, number> = {
                critical: 4,
                high: 3,
                normal: 2,
                low: 1
            };
            const priorityDiff = (priorities[b.priority] || 2) - (priorities[a.priority] || 2);
            if (priorityDiff === 0) {
                return a.timestamp - b.timestamp;
            }
            return priorityDiff;
        });
    }

    /**
     * Process next request in queue
     */
    private async processQueue() {
        const maxConcurrent = this.config.maxConcurrent || 6;

        while (this.activeRequests < maxConcurrent && this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item) break;

            this.activeRequests++;
            
            logSafe(`🚀 Processing request ${item.id} (priority: ${item.priority}, active: ${this.activeRequests}/${maxConcurrent})`);

            // Execute request asynchronously
            item.execute()
                .then(response => {
                    item.resolve(response);
                })
                .catch(error => {
                    // Preserve error context
                    item.reject(new Error(error?.message || String(error), { cause: error }));
                })
                .finally(() => {
                    this.activeRequests--;
                    this.processQueue(); // Process next in queue
                });
        }
    }

    /**
     * Add request to queue or execute immediately
     */
    async enqueue(
        execute: () => Promise<Response>,
        priority: 'critical' | 'high' | 'normal' | 'low' = 'normal',
        requestId: string
    ): Promise<Response> {
        if (!this.config.enabled) {
            // Queue disabled, execute immediately
            return execute();
        }

        const maxConcurrent = this.config.maxConcurrent || 6;
        const id = requestId;

        // If under limit, execute immediately
        if (this.activeRequests < maxConcurrent) {
            this.activeRequests++;
            logSafe(`⚡ Executing request ${id} immediately (priority: ${priority}, active: ${this.activeRequests}/${maxConcurrent})`);
            
            try {
                return await execute();
            } finally {
                this.activeRequests--;
                this.processQueue();
            }
        }

        // Otherwise, add to queue
        logSafe(`⏳ Queueing request ${id} (priority: ${priority}, queue size: ${this.queue.length + 1})`);
        
        return new Promise<Response>((resolve, reject) => {
            this.queue.push({
                id,
                priority,
                execute,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.sortQueue();
        });
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            enabled: this.config.enabled,
            queueSize: this.queue.length,
            activeRequests: this.activeRequests,
            maxConcurrent: this.config.maxConcurrent,
            queuedByPriority: {
                critical: this.queue.filter(r => r.priority === 'critical').length,
                high: this.queue.filter(r => r.priority === 'high').length,
                normal: this.queue.filter(r => r.priority === 'normal').length,
                low: this.queue.filter(r => r.priority === 'low').length
            }
        };
    }

    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
    }
}
