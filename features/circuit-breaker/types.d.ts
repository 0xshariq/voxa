export interface CircuitBreakerConfig {
    enabled?: boolean;
    threshold?: number;
    timeout?: number;
    onOpen?: () => void;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        circuitBreaker?: CircuitBreakerConfig;
    }
}
