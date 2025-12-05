// Circuit Breaker Manager for Voxa
// Prevents repeated requests to failing endpoints

export interface CircuitBreakerConfig {
    threshold?: number; // Number of failures before opening circuit
    timeout?: number;   // Cooldown period in ms
    onOpen?: () => void;
}

export enum CircuitState {
    CLOSED,      // Normal operation
    OPEN,        // Circuit is open, requests are blocked
    HALF_OPEN    // Testing if server recovered
}

export class CircuitBreakerManager {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private lastFailureTime = 0;
    private config: CircuitBreakerConfig;

    constructor(config: CircuitBreakerConfig = {}) {
        this.config = config;
    }
    // Remove requestId generation; always use requestId passed from Voxa

    shouldOpenCircuit(): boolean {
        const threshold = this.config.threshold ?? 5;
        return this.failureCount >= threshold;
    }

    canAttemptRequest(): boolean {
        if (this.state === CircuitState.CLOSED) return true;
        if (this.state === CircuitState.OPEN) {
            const timeout = this.config.timeout ?? 30000;
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > timeout) {
                this.state = CircuitState.HALF_OPEN;
                return true;
            }
            return false;
        }
        return this.state === CircuitState.HALF_OPEN;
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.shouldOpenCircuit()) {
            this.state = CircuitState.OPEN;
            if (this.config.onOpen) this.config.onOpen();
        }
    }

    recordSuccess() {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }

    getState() {
        return this.state;
    }
}
