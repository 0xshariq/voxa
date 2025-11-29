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

    classify(error: any): ErrorCategory {
        if (!this.config.enabled) return 'unknown';
        if (error?.name === 'AbortError' || error?.message?.includes('timeout')) return 'timeout';
        if (error?.status === 401 || error?.status === 403) return 'auth';
        if (error?.status === 0 || error?.message?.includes('NetworkError')) return 'network';
        if (error?.status >= 500) return 'server';
        if (error?.status >= 400) return 'client';
        if (typeof navigator !== 'undefined' && (navigator as any).onLine === false) return 'offline';
        return 'unknown';
    }
}
