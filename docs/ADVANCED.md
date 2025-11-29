# Advanced Features

Deep dive into Voxa's advanced capabilities.

## Table of Contents
- [Request Deduplication](#request-deduplication)
- [Queue Management](#queue-management)
- [Request Metadata](#request-metadata)
- [Retry Logic](#retry-logic)
- [Interceptors](#interceptors)
- [Caching Strategies](#caching-strategies)

## Request Deduplication

Voxa automatically prevents duplicate concurrent requests to the same endpoint.

### How It Works

```typescript
// Multiple components make the same request
const request1 = api.get('/users/1');
const request2 = api.get('/users/1');
const request3 = api.get('/users/1');

// Only 1 actual HTTP request is made
// All three get the same response
const [user1, user2, user3] = await Promise.all([request1, request2, request3]);
```

### TTL (Time To Live)

Duplicate requests are cached for 5 minutes by default:

```typescript
const stats = api.getDeduplicationStats();
// { pendingCount: 3, ttl: 300000 }
```

### When to Use

- React components mounting simultaneously
- Parallel requests in different parts of your application
- Preventing race conditions

## Queue Management

Control concurrent request limits and prioritize important requests.

### Basic Configuration

```typescript
const api = voxa.create({
    queue: {
        enabled: true,
        maxConcurrent: 3  // Only 3 requests at a time
    }
});
```

### Priority Levels

```typescript
// 1. Critical - Processed immediately
await api.post('/payment', data, { priority: 'critical' });

// 2. High - Processed after critical
await api.post('/order', data, { priority: 'high' });

// 3. Normal - Default priority
await api.get('/products', { priority: 'normal' });

// 4. Low - Processed last
await api.post('/analytics', data, { priority: 'low' });
```

### Queue Statistics

```typescript
const stats = api.getQueueStats();
console.log(stats);
// {
//   enabled: true,
//   queueSize: 5,
//   activeRequests: 3,
//   maxConcurrent: 3,
//   queuedByPriority: {
//     critical: 1,
//     high: 2,
//     normal: 2,
//     low: 0
//   }
// }
```

### Real-World Example: E-commerce

```typescript
const checkout = async (cartId: string, paymentDetails: any) => {
    // Critical: Process payment first
    const paymentPromise = api.post('/checkout/payment', paymentDetails, {
        priority: 'critical',
        requestId: 'payment-001'
    });

    // High: Create order
    const orderPromise = api.post('/orders', { cartId }, {
        priority: 'high',
        requestId: 'order-001'
    });

    // Normal: Update inventory
    const inventoryPromise = api.patch('/inventory/deduct', { cartId }, {
        priority: 'normal'
    });

    // Low: Send analytics
    const analyticsPromise = api.post('/analytics/checkout', { cartId }, {
        priority: 'low'
    });

    await Promise.all([paymentPromise, orderPromise, inventoryPromise, analyticsPromise]);
};
```

## Request Metadata

Track detailed information about every request.

### Tracking Requests

```typescript
const response = await api.get('/users', {
    requestId: 'get-users-001'
});

const metadata = api.getRequestMetadata('get-users-001');
console.log(metadata);
// {
//   id: 'get-users-001',
//   method: 'GET',
//   endpoint: '/users',
//   priority: 'normal',
//   timestamp: 1234567890,
//   startTime: 1234567890,
//   endTime: 1234567900
// }
```

### Automatic Request IDs

If no `requestId` is provided, Voxa generates one automatically:

```typescript
const response = await api.get('/users');
console.log(response.metadata?.id); // Auto-generated UUID
```

### Metadata Statistics

```typescript
const stats = api.getMetadataStats();
console.log(stats);
// {
//   totalRequests: 10,
//   requests: [
//     {
//       id: 'request-001',
//       method: 'GET',
//       endpoint: '/users',
//       priority: 'normal',
//       timestamp: 1234567890,
//       startTime: 1234567890,
//       endTime: 1234567900
//     },
//     // ...more requests
//   ]
// }
```

## Retry Logic

Automatic exponential backoff retry for failed requests.

### Configuration

```typescript
const api = voxa.create({
    retry: {
        count: 5,                    // Max 5 retries
        delay: 1000,                 // Start with 1s
        exponentialBackoff: true,    // 1s → 2s → 4s → 8s → 16s
        statusCodes: [429, 500, 502, 503, 504],
        maxRetry: 30000             // Max 30s delay
    }
});
```

### Retry Sequence

```
Attempt 1: Fails → Wait 1s
Attempt 2: Fails → Wait 2s
Attempt 3: Fails → Wait 4s
Attempt 4: Fails → Wait 8s
Attempt 5: Fails → Wait 16s
Attempt 6: Give up, throw error
```

### Custom Status Codes

```typescript
const api = voxa.create({
    retry: {
        count: 3,
        statusCodes: [408, 429, 500, 502, 503, 504]
    }
});
```

## Interceptors

Modify requests and responses globally.

### Request Interceptors

```typescript
// Add authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add timestamp
api.interceptors.request.use((config) => {
    config.headers = {
        ...config.headers,
        'X-Request-Time': Date.now().toString()
    };
    return config;
});
```

### Response Interceptors

```typescript
// Log responses
api.interceptors.response.use(
    (response) => {
        console.log(`${response.status} - ${response.url}`);
        return response;
    },
    (error) => {
        console.error('Response error:', error);
        return Promise.reject(error);
    }
);

// Handle errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

### Multiple Interceptors

Interceptors are executed in the order they are added:

```typescript
// Executed first
api.interceptors.request.use((config) => {
    console.log('Interceptor 1');
    return config;
});

// Executed second
api.interceptors.request.use((config) => {
    console.log('Interceptor 2');
    return config;
});
```

## Caching Strategies

### Memory Cache

Fast, in-memory caching (good for development):

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        ttl: 300000,
        storage: 'memory'
    }
});
```

### Redis Cache

Distributed caching for production:

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        ttl: 300000,
        storage: 'redis',
        redis: {
            host: process.env.REDIS_HOST,
            port: 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0
        }
    }
});
```

### Cache Key Generation

Cache keys are automatically generated based on:
- HTTP method
- URL
- Request body (for POST/PUT/PATCH)

```typescript
// These create different cache keys
await api.get('/users');
await api.get('/users?page=2');
await api.post('/users', { name: 'John' });
```

### Cache Management

```typescript
// Check cache stats
const stats = api.getCacheStats();
console.log(stats);
// {
//   storage: 'redis',
//   size: 10,
//   entries: [...]
// }

// Clear cache
await api.clearCache();
```

### Per-Request Cache Control

```typescript
// Disable cache for specific request
const response = await api.get('/users', {
    cache: { enabled: false }
});

// Custom TTL for specific request
const response = await api.get('/products', {
    cache: { enabled: true, ttl: 60000 } // 1 minute
});
```

## Performance Tips

1. **Use Request IDs** for tracking important requests
2. **Set appropriate priorities** to ensure critical requests are processed first
3. **Enable caching** for frequently accessed data
4. **Configure queue limits** based on your server's capacity
5. **Use Redis cache** in production for distributed systems
6. **Monitor statistics** to optimize configuration

## Next Steps

- [API Reference](./API.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Examples](./EXAMPLES.md)
