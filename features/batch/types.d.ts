export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface BatchConfig {
    enabled?: boolean;
    endpoint?: string;
    wait?: number;
    maxBatchSize?: number;
    ids?: string[];
}

export interface BatchRequest {
    method: HttpMethod;
    url: string;
    data?: any;
    config?: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    ids: string[];
    priority?: 'critical' | 'high' | 'normal' | 'low';
    signal?: AbortSignal;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        batch?: BatchConfig;
    }
}
