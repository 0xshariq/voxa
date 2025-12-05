export interface MetricsManagerConfig {
    enabled?: boolean;
}

export interface RequestMetadata {
    id: string;
    method: string;
    endpoint: string;
    priority: string;
    timestamp: number;
    startTime?: number;
    endTime?: number;
    duration?: number;
    status?: number;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        metrics?: MetricsManagerConfig;
    }
}
