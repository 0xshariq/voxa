export interface GraphQLConfig {
    enabled?: boolean;
    endpoint?: string;
    headers?: Record<string, string>;
    logErrors?: boolean;
    timeout?: number;
    cache?: boolean;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        graphql?: GraphQLConfig;
    }
}
