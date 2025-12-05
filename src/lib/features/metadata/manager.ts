import type { RequestMetadata, MetadataConfig } from '../../types/client-types.js';
import { logSafe } from '../../client/logging.js';

/**
 * Metadata Manager for tracking request information
 * Supports config options: enabled, log, fields, maxEntries, customHandler
 */
export class MetadataManager {
        /**
         * Dispose and cleanup all metadata state
         */
        dispose(): void {
            this.clear();
            // Add any additional cleanup logic here
        }
    private metadata: Map<string, RequestMetadata> = new Map();
    private config: MetadataConfig;
    private enabled: boolean;

    constructor(config: MetadataConfig = {}) {
        this.config = config;
        this.enabled = config.enabled !== false;
    }

    /**
     * Store request metadata with config enforcement
     */
    set(id: string, metadata: RequestMetadata): void {
        if (!this.enabled) return;
        let meta = metadata;
        // Only keep specified fields
        if (this.config.fields && this.config.fields.length > 0) {
            meta = Object.fromEntries(Object.entries(metadata).filter(([k]) => this.config.fields!.includes(k as any))) as RequestMetadata;
        }
        // Custom handler
        if (this.config.customHandler) {
            this.config.customHandler(meta);
        }
        // Logging
        if (this.config.log) {
            logSafe('[Metadata]', meta);
        }
        // Max entries
        if (typeof this.config.maxEntries === 'number' && this.metadata.size >= this.config.maxEntries) {
            // Remove oldest
            const oldestKey = this.metadata.keys().next().value;
            if (typeof oldestKey === 'string') {
                this.metadata.delete(oldestKey);
            }
        }
        this.metadata.set(id, meta);
    }

    /**
     * Get request metadata by ID
     */
    get(id: string): RequestMetadata {
        if (!this.enabled) {
            // Always return a minimal metadata object with id
            return { id, method: 'GET', endpoint: '', priority: 'normal', timestamp: Date.now() };
        }
        const meta = this.metadata.get(id);
        if (meta) return meta;
        // Always return a minimal metadata object with id
        return { id, method: 'GET', endpoint: '', priority: 'normal', timestamp: Date.now() };
    }

    /**
     * Update metadata (e.g., add end time)
     */
    update(id: string, updates: Partial<RequestMetadata>): void {
        if (!this.enabled) return;
        const existing = this.metadata.get(id);
        if (existing) {
            const updated = { ...existing, ...updates };
            this.set(id, updated);
        }
    }

    /**
     * Delete metadata
     */
    delete(id: string): void {
        if (!this.enabled) return;
        this.metadata.delete(id);
    }

    /**
     * Get all metadata
     */
    getAll(): Map<string, RequestMetadata> {
        if (!this.enabled) return new Map();
        return new Map(this.metadata);
    }

    /**
     * Clear all metadata
     */
    clear(): void {
        if (!this.enabled) return;
        this.metadata.clear();
    }

    /**
     * Get statistics and filtered metadata
     */
    getStats() {
        if (!this.enabled) return { totalRequests: 0, requests: [] };
        let requests = Array.from(this.metadata.values());
        if (this.config.fields && this.config.fields.length > 0) {
            requests = requests.map(meta => Object.fromEntries(Object.entries(meta).filter(([k]) => this.config.fields!.includes(k as any))) as RequestMetadata);
        }
        return {
            totalRequests: this.metadata.size,
            requests
        };
    }

    /**
     * Utility: get recent metadata entries
     */
    getRecent(n: number): RequestMetadata[] {
        if (!this.enabled) return [];
        return Array.from(this.metadata.values()).slice(-n);
    }

    /**
     * Utility: find metadata by field value
     */
    findByField<K extends keyof RequestMetadata>(field: K, value: RequestMetadata[K]): RequestMetadata[] {
        if (!this.enabled) return [];
        return Array.from(this.metadata.values()).filter(meta => meta[field] === value);
    }
}
