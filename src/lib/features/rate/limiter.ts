// RateLimiter for automatic rate limiting & throttling
// Removed unused VoxaConfig import

export interface RateLimiterConfig {
    enabled?: boolean;
    maxRequests?: number; // e.g. 100
    perMilliseconds?: number; // e.g. 60000 (1 minute)
}

interface QueuedRateRequest {
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    requestId?: string;
}

export class RateLimiter {
    private config: RateLimiterConfig;
    private requestTimestamps: number[] = [];
    private queue: QueuedRateRequest[] = [];
    private timer: any;

    constructor(config: RateLimiterConfig = {}) {
        this.config = config;
    }

    async enqueue(fn: () => Promise<any>, requestId?: string): Promise<any> {
        if (!this.config.enabled) return fn();
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject, requestId: requestId || '' });
            this.processQueue();
        });
    }

    private processQueue() {
        if (!this.config.enabled) return;
        const now = Date.now();
        // Remove timestamps outside window
        this.requestTimestamps = this.requestTimestamps.filter(ts => now - ts < (this.config.perMilliseconds ?? 60000));
        while (this.queue.length > 0 && this.requestTimestamps.length < (this.config.maxRequests ?? 100)) {
            const req = this.queue.shift()!;
            this.requestTimestamps.push(now);
            req.fn().then(req.resolve).catch(req.reject);
        }
        if (this.queue.length > 0 && !this.timer) {
            this.timer = setTimeout(() => {
                this.timer = null;
                this.processQueue();
            }, 100);
        }
    }
}
