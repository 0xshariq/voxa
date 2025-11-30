// GraphQLManager: Handles GraphQL queries for Voxa
import type { VoxaConfig, VoxaResponse, GraphQLConfig } from '../../types/client-types.js';

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
    const result = await response.json();
    if (result.errors && this.gqlConfig.logErrors) {
      console.error('GraphQL Errors:', result.errors);
    }
    return result;
  }
}
