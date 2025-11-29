// CancelManager for request cancellation with reasons
export interface CancelManagerConfig {
    enabled?: boolean;
}

export class CancelManager {
    private config: CancelManagerConfig;
    private controllers: Map<string, AbortController> = new Map();
    private reasons: Map<string, string> = new Map();

    constructor(config: CancelManagerConfig = {}) {
        this.config = config;
    }

    /** Only create controller if cancellation is enabled */
    createController(requestId: string, reason?: string): AbortController | undefined {
        if (!this.config.enabled) return undefined;
        const controller = new AbortController();
        this.controllers.set(requestId, controller);
        if (reason) this.reasons.set(requestId, reason);
        return controller;
    }

    /** Only cancel if cancellation is enabled */
    cancel(requestId: string, reason?: string) {
        if (!this.config.enabled) return;
        const controller = this.controllers.get(requestId);
        if (controller) {
            controller.abort();
            if (reason) this.reasons.set(requestId, reason);
        }
    }

    getReason(requestId: string): string | undefined {
        return this.reasons.get(requestId);
    }

    clear(requestId: string) {
        this.controllers.delete(requestId);
        this.reasons.delete(requestId);
    }
}
