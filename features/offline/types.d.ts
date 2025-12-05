export interface OfflineQueueConfig {
    enabled?: boolean;
    storage?: 'localStorage' | 'indexedDB';
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        offline?: OfflineQueueConfig;
    }
}
