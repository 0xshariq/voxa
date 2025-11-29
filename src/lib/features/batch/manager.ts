import type { BatchRequest, BatchConfig, HttpMethod } from '../../types/client-types.js';

export class BatchManager {
    private requests: BatchRequest[] = [];
    private batchTimeout: any;
    private config: BatchConfig;

    constructor(config: BatchConfig = {}) {
        this.config = config;
    }

    add(method: HttpMethod, url: string, data: any, config: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.requests.push({ method, url, data, config, resolve, reject });
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
            batch.forEach(req => req.reject(error));
        }
    }
}
