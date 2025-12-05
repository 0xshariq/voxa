// GraphQLManager: Handles GraphQL queries for Voxa
import type { GraphQLConfig } from './types.js';
import type { VoxaConfig, VoxaResponse } from '@0xshariq/voxa-core';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
  url?: string;
  headers?: Record<string, string>;
}

export interface GraphQLResponse<T = any> {
  data: T;
  errors?: any[];
}

export class GraphQLManager {
  private config: VoxaConfig;
  private gqlConfig: GraphQLConfig;
  private post: (url: string, body: any, config?: VoxaConfig) => Promise<VoxaResponse<any>>;

  constructor(config: VoxaConfig, postFn: (url: string, body: any, config?: VoxaConfig) => Promise<VoxaResponse<any>>) {
    this.config = config;
    this.gqlConfig = config.graphql || {};
    this.post = postFn;
  }

  async request<T = any>(options: GraphQLRequest): Promise<GraphQLResponse<T>> {
    if (!this.gqlConfig.enabled) {
      throw new Error('GraphQL is disabled in Voxa config');
    }
    const endpoint = options.url || this.gqlConfig.endpoint || '/graphql';
    const headers = { ...this.gqlConfig.headers, ...options.headers };
    // Optionally add timeout, cache, retry logic here
    const postConfig: VoxaConfig = {
      ...this.config,
      headers,
      timeout: this.gqlConfig.timeout,
    };
    if (typeof this.gqlConfig.cache === 'object') {
      postConfig.cache = this.gqlConfig.cache;
    }
    if (typeof this.config.retry === 'object') {
      postConfig.retry = this.config.retry;
    }
    const response = await this.post(endpoint, {
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }, postConfig);

    // VoxaResponse.data may be { data: ... } or just ...
    let result: GraphQLResponse<T>;
    if (response && response.data && typeof response.data === 'object' && 'data' in response.data) {
      // Unwrap the inner data property
      result = {
        data: response.data.data,
        errors: response.data.errors
      };
    } else {
      result = {
        data: response.data,
        errors: (response as any).errors
      };
    }

    if (result && result.errors && this.gqlConfig.logErrors) {
      console.error('GraphQL Errors:', result.errors);
    }
    return result;
  }
}
