// Token Manager Module for Voxa
// Manages authentication tokens, including retrieval, storage, and refresh
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

export class TokenManager {
    private config: TokenManagerConfig;
    private token: string | null = null;
    private refreshInProgress = false;

    constructor(config: TokenManagerConfig = {}) {
        this.config = config;
        if (config.storage === 'localStorage' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
            this.token = globalThis.localStorage.getItem('voxa_token');
        }
    }

    async getToken(): Promise<string | null> {
        if (this.config.getToken) {
            return this.config.getToken();
        }
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        if (this.config.setToken) {
            this.config.setToken(token);
        }
        if (this.config.storage === 'localStorage' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
            globalThis.localStorage.setItem('voxa_token', token);
        }
    }

    async refreshToken(): Promise<string | null> {
        if (this.refreshInProgress) return this.token;
        this.refreshInProgress = true;
        try {
            if (this.config.refreshToken) {
                const newToken = await this.config.refreshToken();
                this.setToken(newToken);
                return newToken;
            }
            // Default refresh logic (OAuth2)
            if (this.config.refreshEndpoint && this.token) {
                const response = await fetch(this.config.refreshEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: this.token })
                });
                const data = await response.json();
                if ((data as any).token) {
                    this.setToken((data as any).token);
                    return (data as any).token;
                }
            }
            return null;
        } finally {
            this.refreshInProgress = false;
        }
    }

    clearToken() {
        this.token = null;
        if (this.config.storage === 'localStorage' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
            globalThis.localStorage.removeItem('voxa_token');
        }
    }
}
