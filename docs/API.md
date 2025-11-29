# Voxa API Reference

Complete API reference for Voxa HTTP Client.

## Table of Contents
- [Creating an Instance](#creating-an-instance)
- [HTTP Methods](#http-methods)
- [Interceptors](#interceptors)
- [Statistics](#statistics)
- [Utilities](#utilities)
- [TypeScript Types](#typescript-types)

## Creating an Instance

### `voxa.create(config)`

Creates a new Voxa instance with the provided configuration.

```typescript
import voxa from '@0xshariq/voxa';

const api = voxa.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
});
```

## HTTP Methods

All HTTP methods support TypeScript generics for type-safe responses.

### `get<T>(url, config?)`

Performs a GET request.

```typescript
interface User {
    id: number;
    name: string;
}

const response = await api.get<User>('/users/1');
const user = await response.json();
```

### `post<T>(url, data?, config?)`

Performs a POST request.

```typescript
const response = await api.post<User>('/users', {
    name: 'John Doe',
    email: 'john@example.com'
});
```

### `put<T>(url, data?, config?)`

Performs a PUT request.

```typescript
const response = await api.put<User>('/users/1', {
    name: 'Jane Doe'
});
```

### `delete<T>(url, config?)`

Performs a DELETE request.

```typescript
const response = await api.delete('/users/1');
```

### `patch<T>(url, data?, config?)`

Performs a PATCH request.

```typescript
const response = await api.patch<User>('/users/1', {
    email: 'newemail@example.com'
});
```

### Other Methods

- `head<T>(url, config?)` - HEAD request
- `options<T>(url, config?)` - OPTIONS request
- `trace<T>(url, config?)` - TRACE request
- `connect<T>(url, data?, config?)` - CONNECT request

## Static Methods

Use static methods for one-off requests without creating an instance.

```typescript
import { Voxa } from '@0xshariq/voxa';

const response = await Voxa.get<User>('https://api.example.com/users/1');
const user = await response.json();
```

All HTTP methods are available as static methods:
- `Voxa.get<T>(url, config?)`
- `Voxa.post<T>(url, data?, config?)`
- `Voxa.put<T>(url, data?, config?)`
- `Voxa.delete<T>(url, config?)`
- `Voxa.patch<T>(url, data?, config?)`
- `Voxa.head<T>(url, config?)`
- `Voxa.options<T>(url, config?)`
- `Voxa.trace<T>(url, config?)`
- `Voxa.connect<T>(url, data?, config?)`

## Interceptors

### Request Interceptors

```typescript
api.interceptors.request.use(
    (config) => {
        // Modify config before request is sent
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
        return config;
    },
    (error) => {
        // Handle request error
        return Promise.reject(error);
    }
);
```

### Response Interceptors

```typescript
api.interceptors.response.use(
    (response) => {
        // Process response data
        console.log('Status:', response.status);
        return response;
    },
    (error) => {
        // Handle response error
        if (error.response?.status === 401) {
            // Handle unauthorized
        }
        return Promise.reject(error);
    }
);
```

## Statistics

### `getCacheStats()`

Get cache statistics.

```typescript
const stats = api.getCacheStats();
// {
//   storage: 'memory',
//   size: 5,
//   entries: [...]
// }
```

### `getQueueStats()`

Get queue statistics.

```typescript
const stats = api.getQueueStats();
// {
//   enabled: true,
//   queueSize: 2,
//   activeRequests: 3,
//   maxConcurrent: 6,
//   queuedByPriority: { critical: 1, high: 0, normal: 1, low: 0 }
// }
```

### `getDeduplicationStats()`

Get deduplication statistics.

```typescript
const stats = api.getDeduplicationStats();
// {
//   pendingCount: 3,
//   ttl: 300000
// }
```

### `getMetadataStats()`

Get metadata statistics.

```typescript
const stats = api.getMetadataStats();
// {
//   totalRequests: 10,
//   requests: [...]
// }
```

### `getRequestMetadata(requestId)`

Get metadata for a specific request.

```typescript
const metadata = api.getRequestMetadata('request-123');
// {
//   id: 'request-123',
//   method: 'GET',
//   endpoint: '/users',
//   priority: 'normal',
//   timestamp: 1234567890,
//   startTime: 1234567890,
//   endTime: 1234567900
// }
```

## Utilities

### `clearCache()`

Clear all cached responses.

```typescript
await api.clearCache();
```

### `clearQueue()`

Clear the request queue.

```typescript
api.clearQueue();
```

### `destroy()`

Cleanup all managers and intervals.

```typescript
api.destroy();
```

## TypeScript Types

### VoxaConfig

```typescript
interface VoxaConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    retry?: RetryConfig;
    cache?: CacheConfig;
    queue?: QueueConfig;
    priority?: RequestPriority;
    requestId?: string;
}
```

### RetryConfig

```typescript
interface RetryConfig {
    count?: number;
    delay?: number;
    exponentialBackoff?: boolean;
    statusCodes?: number[];
    maxRetry?: number;
}
```

### CacheConfig

```typescript
interface CacheConfig {
    enabled?: boolean;
    ttl?: number;
    storage?: 'memory' | 'redis';
    redis?: {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
    };
}
```

### QueueConfig

```typescript
interface QueueConfig {
    enabled?: boolean;
    maxConcurrent?: number;
}
```

### RequestPriority

```typescript
type RequestPriority = 'critical' | 'high' | 'normal' | 'low';
```

### VoxaResponse

```typescript
interface VoxaResponse<T = any> extends Response {
    json(): Promise<T>;
    data?: T;
    metadata?: RequestMetadata;
}
```

### RequestMetadata

```typescript
interface RequestMetadata {
    id: string;
    method: HttpMethod;
    endpoint: string;
    priority: RequestPriority;
    timestamp: number;
    startTime?: number;
    endTime?: number;
}
```

## Next Steps

- [Configuration Guide](./CONFIGURATION.md)
- [Examples](./EXAMPLES.md)
- [Advanced Features](./ADVANCED.md)
