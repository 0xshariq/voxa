// Offline Queue Manager for Voxa
// Saves failed requests to localStorage and retries when online

export interface OfflineQueueConfig {
    enabled?: boolean;
    storage?: 'localStorage' | 'indexedDB' | 'memory';
}

export interface QueuedOfflineRequest {
    method: string;
    url: string;
    data: any;
    config: any;
    requestId?: string;
}

export class OfflineQueueManager {
    private queue: QueuedOfflineRequest[] = [];
    private config: OfflineQueueConfig;
    private storageKey = 'voxa_offline_queue';

    constructor(config: OfflineQueueConfig = {}) {
        this.config = config;
        this.loadQueue();
        const g = globalThis as any;
        if (typeof g.addEventListener === "function" && typeof this.processQueue === "function") {
            g.addEventListener("online", () => this.processQueue());
        }
    }

    /**
     * Get offline queue configuration
     */
    getConfig(): Readonly<OfflineQueueConfig> {
        return { ...this.config };
    }

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Get all queued requests (read-only)
     */
    getQueue(): ReadonlyArray<Readonly<QueuedOfflineRequest>> {
        return this.queue.map(req => ({ ...req }));
    }

    addRequest(method: string, url: string, data: any, config: any, requestId: string) {
        if (!this.config.enabled) return;
        this.queue.push({ method, url, data, config, requestId });
        this.saveQueue();
    }

    private saveQueue() {
        if (this.config.storage === 'localStorage' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
            globalThis.localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } else if (this.config.storage === 'memory') {
            // No-op for memory, queue stays in memory
        }
    }

    private loadQueue() {
        let saved: string | null = null;
        if (this.config.storage === 'localStorage' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
            saved = globalThis.localStorage.getItem(this.storageKey);
        }
        if (saved) {
            this.queue = JSON.parse(saved);
        }
        // For 'memory', do nothing (queue is already in memory)
    }

    async processQueue() {
        if ((typeof navigator !== 'undefined' && (navigator as any).onLine === false) || !this.config.enabled) return;
        while (this.queue.length > 0) {
            const req = this.queue.shift()!;
            try {
                await fetch(req.url, {
                    method: req.method,
                    body: req.data ? JSON.stringify(req.data) : undefined,
                    headers: req.config.headers || {}
                });
            } catch (error) {
                this.queue.unshift(req);
                break;
            }
        }
        this.saveQueue();
    }
}
