import type { BatchRequest, BatchConfig, HttpMethod } from './types.js';

export class BatchManager {
    private requests: BatchRequest[] = [];
    private batchTimeout: any;
    private config: BatchConfig;

    constructor(config: BatchConfig = {}) {
        this.config = config;
    }

    /**
     * Get batch configuration
     */
    getConfig(): Readonly<BatchConfig> {
        return { ...this.config };
    }

    /**
     * Get current number of pending batch requests
     */
    getPendingCount(): number {
        return this.requests.length;
    }

    add(method: HttpMethod, url: string, data: any, config: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Generate requestId with 15 min expiry for batch
            const now = Date.now();
            const expiryMs = 900000; // 15 min
            const expiresAt = now + expiryMs;
            const batchRequestId = `batch_${now}_${expiresAt}_${Math.random().toString(36).slice(2, 10)}`;
            this.requests.push({ method, url, data, config, resolve, reject, ids: [batchRequestId] });
            clearTimeout(this.batchTimeout);
            this.batchTimeout = setTimeout(() => {
                this.execute();
            }, this.config.wait ?? 50);
        });
    }

    async execute() {
        if (this.requests.length === 0) return;
        const batch = this.requests.splice(0, this.config.maxBatchSize ?? this.requests.length);
        try {
            // Send as batch to server
            const endpoint = this.config.endpoint ?? '/batch';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: batch[0]?.config?.headers || { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: batch.map(r => ({
                        method: r.method,
                        url: r.url,
                        data: r.data
                    }))
                })
            });
            const results = await response.json();
            (results as any[]).forEach((result: any, index: number) => {
                batch[index].resolve(result);
            });
        } catch (error) {
            batch.forEach(req => req.reject(new Error(error instanceof Error ? error.message : String(error), { cause: error })));
        }
    }
}
