export interface TokenManagerConfig {
    enabled?: boolean;
    type?: 'oauth2' | 'jwt' | 'bearer';
    tokenEndpoint?: string;
    clientId?: string;
    clientSecret?: string;
    refreshEndpoint?: string;
    storage?: 'memory' | 'localStorage';
    getToken?: () => Promise<string>;
    setToken?: (token: string) => void;
    refreshToken?: () => Promise<string>;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        token?: TokenManagerConfig;
    }
}
