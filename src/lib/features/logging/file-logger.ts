import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * File-based logger for persistent logging
 * Stores logs in ~/.voxa/logs/ directory
 */
export class FileLogger {
    private logDir: string;
    private initialized: boolean = false;
    private maxLogSize: number = 10 * 1024 * 1024; // 10MB
    private maxLogFiles: number = 5;

    constructor() {
        // Use ~/.voxa/logs/ for log storage
        this.logDir = join(homedir(), '.voxa', 'logs');
    }

    /**
     * Initialize log directory
     */
    private async init(): Promise<void> {
        if (this.initialized) return;

        try {
            await fs.mkdir(this.logDir, { recursive: true });
            this.initialized = true;
        } catch (error) {
            // Silently fail if can't create log directory
            console.error('Failed to initialize log directory:', error);
        }
    }

    /**
     * Get current log file path
     */
    private getLogFilePath(): string {
        const date = new Date().toISOString().split('T')[0];
        return join(this.logDir, `voxa-${date}.log`);
    }

    /**
     * Rotate log files if needed
     */
    private async rotateLogsIfNeeded(): Promise<void> {
        try {
            const logFile = this.getLogFilePath();
            const stats = await fs.stat(logFile);

            if (stats.size > this.maxLogSize) {
                // Rotate logs
                const timestamp = Date.now();
                const rotatedFile = join(this.logDir, `voxa-${timestamp}.log`);
                await fs.rename(logFile, rotatedFile);

                // Clean up old logs
                await this.cleanupOldLogs();
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                // Ignore if file doesn't exist
            }
        }
    }

    /**
     * Clean up old log files
     */
    private async cleanupOldLogs(): Promise<void> {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(f => f.startsWith('voxa-') && f.endsWith('.log'))
                .map(f => ({
                    name: f,
                    path: join(this.logDir, f)
                }));

            if (logFiles.length > this.maxLogFiles) {
                // Sort by name (timestamp) and remove oldest
                logFiles.sort((a, b) => a.name.localeCompare(b.name));
                const toRemove = logFiles.slice(0, logFiles.length - this.maxLogFiles);
                
                for (const file of toRemove) {
                    await fs.unlink(file.path);
                }
            }
        } catch (error) {
            // Silently fail
        }
    }

    /**
     * Write log entry
     */
    async log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): Promise<void> {
        await this.init();

        try {
            await this.rotateLogsIfNeeded();

            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data: args.length > 0 ? args : undefined
            };

            const logLine = JSON.stringify(logEntry) + '\n';
            const logFile = this.getLogFilePath();

            await fs.appendFile(logFile, logLine, 'utf-8');
        } catch (error) {
            // Silently fail to prevent application crashes
        }
    }

    /**
     * Read recent logs
     */
    async readLogs(limit: number = 100): Promise<any[]> {
        await this.init();

        try {
            const logFile = this.getLogFilePath();
            const content = await fs.readFile(logFile, 'utf-8');
            const lines = content.trim().split('\n').filter(l => l);
            
            const logs = lines
                .slice(-limit)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);

            return logs;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            return [];
        }
    }

    /**
     * Clear all logs
     */
    async clearLogs(): Promise<void> {
        await this.init();

        try {
            const files = await fs.readdir(this.logDir);
            await Promise.all(
                files
                    .filter(f => f.startsWith('voxa-') && f.endsWith('.log'))
                    .map(f => fs.unlink(join(this.logDir, f)))
            );
        } catch (error) {
            // Silently fail
        }
    }
}

// Singleton instance
let fileLoggerInstance: FileLogger | null = null;

export function getFileLogger(): FileLogger {
    if (!fileLoggerInstance) {
        fileLoggerInstance = new FileLogger();
    }
    return fileLoggerInstance;
}
