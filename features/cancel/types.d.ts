export interface CancelManagerConfig {
    enabled?: boolean;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        cancel?: CancelManagerConfig;
    }
}
