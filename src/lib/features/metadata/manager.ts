import type { RequestMetadata } from '../../types/client-types.js';

/**
 * Metadata Manager for tracking request information
 */
export class MetadataManager {
    private metadata: Map<string, RequestMetadata> = new Map();

    /**
     * Store request metadata
     */
    set(id: string, metadata: RequestMetadata): void {
        this.metadata.set(id, metadata);
    }

    /**
     * Get request metadata by ID
     */
    get(id: string): RequestMetadata | undefined {
        return this.metadata.get(id);
    }

    /**
     * Update metadata (e.g., add end time)
     */
    update(id: string, updates: Partial<RequestMetadata>): void {
        const existing = this.metadata.get(id);
        if (existing) {
            this.metadata.set(id, { ...existing, ...updates });
        }
    }

    /**
     * Delete metadata
     */
    delete(id: string): void {
        this.metadata.delete(id);
    }

    /**
     * Get all metadata
     */
    getAll(): Map<string, RequestMetadata> {
        return new Map(this.metadata);
    }

    /**
     * Clear all metadata
     */
    clear(): void {
        this.metadata.clear();
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalRequests: this.metadata.size,
            requests: Array.from(this.metadata.values())
        };
    }
}
