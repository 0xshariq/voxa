import type { VoxaConfig, HttpMethod, VoxaResponse } from '../types/client-types.js';

/**
 * HTTP Methods Mixin
 * Provides all HTTP method implementations
 */
export class HttpMethods {
    /**
     * Core request method (to be implemented by the class using this mixin)
     */
    protected request<T = any>(
        _method: HttpMethod,
        _url: string,
        _data: any,
        _config: VoxaConfig
    ): Promise<VoxaResponse<T>> {
        throw new Error('request method must be implemented');
    }

    /**
     * GET request
     */
    async get<T = any>(endpoint: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('GET', endpoint, null, config);
    }

    /**
     * POST request
     */
    async post<T = any>(endpoint: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('POST', endpoint, data, config);
    }

    /**
     * PUT request
     */
    async put<T = any>(endpoint: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('PUT', endpoint, data, config);
    }

    /**
     * DELETE request
     */
    async delete<T = any>(endpoint: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('DELETE', endpoint, null, config);
    }

    /**
     * PATCH request
     */
    async patch<T = any>(endpoint: string, data?: any, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('PATCH', endpoint, data, config);
    }

    /**
     * HEAD request
     */
    async head<T = any>(endpoint: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('HEAD', endpoint, null, config);
    }

    /**
     * OPTIONS request
     */
    async options<T = any>(endpoint: string, config: VoxaConfig = {}): Promise<VoxaResponse<T>> {
        return this.request<T>('OPTIONS', endpoint, null, config);
    }
}
