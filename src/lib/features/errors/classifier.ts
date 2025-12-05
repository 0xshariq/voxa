// ErrorClassifier for automatic error classification
export type ErrorCategory = 'network' | 'timeout' | 'server' | 'client' | 'auth' | 'offline' | 'unknown';

export interface ErrorClassifierConfig {
    enabled?: boolean;
}

export class ErrorClassifier {
    private config: ErrorClassifierConfig;
    constructor(config: ErrorClassifierConfig = {}) {
        this.config = config;
    }

    /**
     * Classify error and return a detailed message for debugging
     */
    classifyWithMessage(error: any): { category: ErrorCategory; message: string } {
        let category: ErrorCategory = 'unknown';
        let message = 'Unknown error occurred.';
        if (!this.config.enabled) {
            message = 'Error classification is disabled.';
        } else if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
            category = 'timeout';
            message = `Timeout: The request took too long to complete. Details: ${error?.message ?? error}`;
        } else if (error?.status === 401 || error?.status === 403) {
            category = 'auth';
            message = `Authentication error: Access denied (status ${error?.status}). Details: ${error?.message ?? error}`;
        } else if (error?.status === 0 || error?.message?.includes('NetworkError')) {
            category = 'network';
            message = `Network error: Unable to reach the server. Details: ${error?.message ?? error}`;
        } else if (error?.status >= 500) {
            category = 'server';
            message = `Server error: The server responded with status ${error?.status}. Details: ${error?.message ?? error}`;
        } else if (error?.status >= 400) {
            category = 'client';
            message = `Client error: The request was invalid (status ${error?.status}). Details: ${error?.message ?? error}`;
        } else if (typeof navigator !== 'undefined' && (navigator as any).onLine === false) {
            category = 'offline';
            message = 'Offline: The browser is offline.';
        }
        return { category, message };
    }
}
