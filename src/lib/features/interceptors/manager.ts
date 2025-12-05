import type { Interceptor } from '../../types/client-types.js';

/**
 * Interceptor Manager for handling request and response interceptors
 */
export class InterceptorManager {
        /**
         * Dispose and cleanup all interceptors
         */
        dispose(): void {
            this.clear();
            // Add any additional cleanup logic here
        }
    private requestInterceptors: Interceptor[] = [];
    private responseInterceptors: Interceptor[] = [];

    /**
     * Register a request interceptor
     */
    addRequestInterceptor(successFn: any, errorFn?: any): void {
        this.requestInterceptors.push({ 
            successFn, 
            errorFn: errorFn || null 
        });
    }

    /**
     * Register a response interceptor
     */
    addResponseInterceptor(successFn: any, errorFn?: any): void {
        this.responseInterceptors.push({ 
            successFn, 
            errorFn: errorFn || null 
        });
    }

    /**
     * Get all request interceptors
     */
    getRequestInterceptors(): Interceptor[] {
        return this.requestInterceptors;
    }

    /**
     * Get all response interceptors
     */
    getResponseInterceptors(): Interceptor[] {
        return this.responseInterceptors;
    }

    /**
     * Clear all interceptors
     */
    clear(): void {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }

    /**
     * Get public API for interceptor registration
     */
    getAPI() {
        return {
            request: {
                use: (successFn: any, errorFn?: any) => 
                    this.addRequestInterceptor(successFn, errorFn)
            },
            response: {
                use: (successFn: any, errorFn?: any) => 
                    this.addResponseInterceptor(successFn, errorFn)
            }
        };
    }
}
