import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { logSafe, errorSafe } from '../../client/logging.js';

/**
 * File-based cache storage for persistent caching
 * Stores cache in ~/.voxa/cache/ directory
 */
export class FileStorage {
    private cacheDir: string;
    private initialized: boolean = false;

    constructor() {
        // Use ~/.voxa/cache/ for cache storage
        this.cacheDir = join(homedir(), '.voxa', 'cache');
    }

    /**
     * Initialize cache directory
     */
    private async init(): Promise<void> {
        if (this.initialized) return;

        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            this.initialized = true;
            logSafe('📁 File cache directory initialized:', this.cacheDir);
        } catch (error: any) {
            errorSafe('Failed to initialize cache directory:', error.message);
            throw error;
        }
    }

    /**
     * Get file path for a cache key
     */
    private getFilePath(key: string): string {
        // Create safe filename from key
        const safeKey = Buffer.from(key).toString('base64')
            .replace(/[/+=]/g, '_')
            .substring(0, 255);
        return join(this.cacheDir, `${safeKey}.json`);
    }

    /**
     * Get cached value
     */
    async get(key: string): Promise<string | null> {
        await this.init();

        try {
            const filePath = this.getFilePath(key);
            const data = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(data);

            // Check expiration
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.delete(key);
                return null;
            }

            return parsed.value;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            errorSafe('File cache get error:', error.message);
            return null;
        }
    }

    /**
     * Set cached value with TTL
     */
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        await this.init();

        try {
            const filePath = this.getFilePath(key);
            const data = {
                value,
                timestamp: Date.now(),
                expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
            };

            await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
        } catch (error: any) {
            errorSafe('File cache set error:', error.message);
        }
    }

    /**
     * Delete cached value
     */
    async delete(key: string): Promise<void> {
        await this.init();

        try {
            const filePath = this.getFilePath(key);
            await fs.unlink(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                errorSafe('File cache delete error:', error.message);
            }
        }
    }

    /**
     * Clear all cached values
     */
    async clear(): Promise<void> {
        await this.init();

        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => fs.unlink(join(this.cacheDir, file)))
            );
            logSafe('🗑️ File cache cleared');
        } catch (error: any) {
            errorSafe('File cache clear error:', error.message);
        }
    }

    /**
     * Clean up expired entries
     */
    async cleanup(): Promise<void> {
        await this.init();

        try {
            const files = await fs.readdir(this.cacheDir);
            const now = Date.now();
            
            for (const file of files) {
                try {
                    const filePath = join(this.cacheDir, file);
                    const data = await fs.readFile(filePath, 'utf-8');
                    const parsed = JSON.parse(data);
                    
                    if (parsed.expiresAt && now > parsed.expiresAt) {
                        await fs.unlink(filePath);
                    }
                } catch (error: any) {
                    // Skip individual file errors
                }
            }
        } catch (error: any) {
            errorSafe('File cache cleanup error:', error.message);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ size: number; files: string[] }> {
        await this.init();

        try {
            const files = await fs.readdir(this.cacheDir);
            return {
                size: files.length,
                files
            };
        } catch (error: any) {
            return { size: 0, files: [] };
        }
    }
}
