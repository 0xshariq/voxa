// MetricsManager for performance metrics & analytics
import type { RequestMetadata } from './types.js';

export interface MetricsManagerConfig {
    enabled?: boolean;
}

export interface RequestMetrics {
    id: string;
    endpoint: string;
    method: string;
    duration: number;
    bytesSent: number;
    bytesReceived: number;
    timestamp: number;
    requestId?: string;
}

export class MetricsManager {
    private config: MetricsManagerConfig;
    private metrics: RequestMetrics[] = [];

    constructor(config: MetricsManagerConfig = {}) {
        this.config = config;
    }

    record(metadata: RequestMetadata, duration: number, bytesSent: number, bytesReceived: number) {
        if (!this.config.enabled) return;
        this.metrics.push({
            id: metadata.id,
            endpoint: metadata.endpoint,
            method: metadata.method,
            duration,
            bytesSent,
            bytesReceived,
            timestamp: Date.now(),
            requestId: metadata.id // Always use requestId from metadata
        });
    }

    getAll() {
        return this.metrics;
    }

    getStats() {
        return {
            totalRequests: this.metrics.length,
            avgDuration: this.metrics.length ? this.metrics.reduce((a, m) => a + m.duration, 0) / this.metrics.length : 0,
            slowest: this.metrics.reduce((max, m) => m.duration > max ? m.duration : max, 0),
            fastest: this.metrics.reduce((min, m) => m.duration < min ? m.duration : min, Infinity),
        };
    }
}
