export interface Http2PushConfig {
    enabled?: boolean;
    autoCache?: boolean;
    maxPushedResources?: number;
    onPush?: (url: string, response: Response) => void;
}

export interface PushedResource {
    url: string;
    response: Response;
    timestamp: number;
    headers: Record<string, string>;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        http2Push?: Http2PushConfig;
    }
}
