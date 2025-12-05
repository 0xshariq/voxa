# Advanced Features

Deep dive into Voxa's advanced capabilities.

## Table of Contents

- [Request Deduplication](#request-deduplication)
- [Queue Management](#queue-management)
- [Request Metadata](#request-metadata)
- [Retry Logic](#retry-logic)
- [Interceptors](#interceptors)
- [Caching Strategies](#caching-strategies)
- [Security](#security)
- [Error Context Preservation](#error-context-preservation)
- [Feature Toggle Cleanup](#feature-toggle-cleanup)
- [Streaming Upload/Download Support](#streaming-uploaddownload-support)

## Request Deduplication

Voxa automatically prevents duplicate concurrent requests to the same endpoint.

### How It Works

```typescript
// Multiple components make the same request
const request1 = api.get("/users/1");
const request2 = api.get("/users/1");
const request3 = api.get("/users/1");

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

## Batch & Queue Edge Cases

### What Happens if a Batch Fails Partially?

If a batch request contains multiple sub-requests and some fail while others succeed:

- **Successful requests**: Their responses are returned as normal.
- **Failed requests**: Errors are surfaced in the corresponding response slot (with error details and status).
- **No global rollback**: Voxa does not roll back successful sub-requests if others fail.
- **Error handling**: Use the `metadata` and `status` fields in each response to correlate and handle errors per sub-request.

**Example:**

```typescript
const batchResponse = await api.batch().execute();
batchResponse.results.forEach((res, idx) => {
  if (res.status >= 400) {
    console.error(`Request ${idx} failed:`, res.error);
  } else {
    console.log(`Request ${idx} succeeded:`, res.data);
  }
});
```

### Per-Request Batch Size/Timeout

You can override batch size and timeout for individual batch executions:

```typescript
// Override batch size and wait time for this batch
await api.batch().execute({
  maxBatchSize: 5, // Only 5 requests per batch
  wait: 200, // Wait 200ms before sending batch
});
```

See [Batch Usage Guide](./BATCH_USAGE.md) for more details and best practices.

Control concurrent request limits and prioritize important requests.

### Basic Configuration

```typescript
const api = voxa.create({
  queue: {
    enabled: true,
    maxConcurrent: 3, // Only 3 requests at a time
  },
});
```

### Priority Levels

```typescript
// 1. Critical - Processed immediately
await api.post("/payment", data, { priority: "critical" });

// 2. High - Processed after critical
await api.post("/order", data, { priority: "high" });

// 3. Normal - Default priority
await api.get("/products", { priority: "normal" });

// 4. Low - Processed last
await api.post("/analytics", data, { priority: "low" });
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
  const paymentPromise = api.post("/checkout/payment", paymentDetails, {
    priority: "critical",
    requestId: "payment-001",
  });

  // High: Create order
  const orderPromise = api.post(
    "/orders",
    { cartId },
    {
      priority: "high",
      requestId: "order-001",
    }
  );

  // Normal: Update inventory
  const inventoryPromise = api.patch(
    "/inventory/deduct",
    { cartId },
    {
      priority: "normal",
    }
  );

  // Low: Send analytics
  const analyticsPromise = api.post(
    "/analytics/checkout",
    { cartId },
    {
      priority: "low",
    }
  );

  await Promise.all([
    paymentPromise,
    orderPromise,
    inventoryPromise,
    analyticsPromise,
  ]);
};
```

## Request Metadata

Track detailed information about every request.

### Tracking Requests

```typescript
const response = await api.get("/users", {
  requestId: "get-users-001",
});

const metadata = api.getRequestMetadata("get-users-001");
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
const response = await api.get("/users");
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
    count: 5, // Max 5 retries
    delay: 1000, // Start with 1s
    exponentialBackoff: true, // 1s → 2s → 4s → 8s → 16s
    statusCodes: [429, 500, 502, 503, 504],
    maxRetry: 30000, // Max 30s delay
  },
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
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
});
```

## Interceptors

Modify requests and responses globally.

### Request Interceptors

```typescript
// Add authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add timestamp
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    "X-Request-Time": Date.now().toString(),
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
    console.error("Response error:", error);
    return Promise.reject(error);
  }
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
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
  console.log("Interceptor 1");
  return config;
});

// Executed second
api.interceptors.request.use((config) => {
  console.log("Interceptor 2");
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
    storage: "memory",
  },
});
```

### Redis Cache

Distributed caching for production:

```typescript
const api = voxa.create({
  cache: {
    enabled: true,
    ttl: 300000,
    storage: "redis",
    redis: {
      host: process.env.REDIS_HOST,
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
    },
  },
});
```

### Cache Key Generation

Cache keys are automatically generated based on:

- HTTP method
- URL
- Request body (for POST/PUT/PATCH)

```typescript
// These create different cache keys
await api.get("/users");
await api.get("/users?page=2");
await api.post("/users", { name: "John" });
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
const response = await api.get("/users", {
  cache: { enabled: false },
});

// Custom TTL for specific request
const response = await api.get("/products", {
  cache: { enabled: true, ttl: 60000 }, // 1 minute
});
```

## Security

### SSRF Protection

- Voxa blocks requests and redirects to private IPs (e.g., 127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, etc.) by default.
- All URLs are validated before requests are made. Invalid or malformed URLs are blocked.
- If a redirect occurs, Voxa checks the final URL and blocks if it resolves to a private IP.

### Header Whitelisting/Blacklisting

- Only safe headers are allowed by default (e.g., Accept, Content-Type, Authorization, X-API-Key, etc.).
- Custom headers can be allowed by extending the SAFE_HEADERS list in `security.ts`.
- Sensitive headers (e.g., Cookie, Set-Cookie) are always blocked.

### Sensitive Data Redaction

- Voxa will redact tokens, passwords, and PII from logs, even in debug mode (see Logging Policy).

### HTTPS Required

- HTTPS is required in production. Voxa will warn if an insecure protocol is used.

### Extending Security

- You can extend SSRF protection and header filtering by providing your own validation logic or updating the `security.ts` utility.

---

For more details, see the [README.md](../README.md#security) and [SECURITY.md](../SECURITY.md).

## Error Context Preservation

All errors surfaced by Voxa (including those from queue, batch, and interceptors) preserve the original error context and stack trace using the `cause` property. This makes debugging production issues much easier and ensures you always have access to the root cause of failures.

**Example:**

```typescript
try {
  await api.get("/users/1");
} catch (err) {
  console.error("Error:", err.message);
  if (err.cause) {
    console.error("Original error:", err.cause);
  }
}
```

For more details, see [Error Handling & Debugging](../README.md#error-handling--debugging).

## Feature Toggle Cleanup

All feature managers (queue, cache, interceptors, metadata, etc.) now implement a `dispose()` method to clean up state and handlers when toggled at runtime. This prevents memory leaks and stale event handlers.

**Example:**

```typescript
// Disable queue and clean up
api.queueManager.dispose();
api.updateConfig({ queue: { enabled: false } });

// Dispose cache when disabling
api.cacheManager.dispose();
api.updateConfig({ cache: { enabled: false } });
```

Always call `dispose()` before disabling a feature at runtime to ensure proper cleanup.

## Logging Policy & Sensitive Data Redaction

All logs in Voxa use a logging sanitizer utility to redact tokens, passwords, and PII—even in debug mode. This ensures sensitive information is never exposed in logs, error messages, or monitoring tools.

**Example:**
```typescript
import { logSafe, warnSafe, errorSafe } from './client/logging';
logSafe('User login', { email: 'user@example.com', token: 'abc123' }); // token is redacted
```

**Best Practices:**
- Never log raw request/response objects containing secrets.
- Always use safe logging functions for all debug, info, warning, and error logs.
- Review logs regularly for compliance and security.

For more details, see [SECURITY.md](../SECURITY.md).

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

## Abort/Timeout Propagation in Queue & Batch

All queued and batched requests now support `AbortSignal` for immediate cancellation and timeout control. Pass an `AbortSignal` to any queued or batched request to abort it at any time:

**Example:**
```typescript
const controller = new AbortController();
api.queueManager.enqueue(
  (signal) => api.get('/users', { signal }),
  'high',
  'get-users-123',
  controller.signal
);
// To abort:
controller.abort();
```

This works for batch requests as well:
```typescript
const controller = new AbortController();
api.batchManager.add('POST', '/batch', data, config, controller.signal);
controller.abort(); // Aborts the batch request
```

This ensures that all async flows (retry, queue, batch) respect abort signals and timeouts, halting operations immediately when requested.

## Streaming Upload/Download Support

Voxa supports streaming uploads and downloads using `FormData`, `Blob`, and `ReadableStream`. This enables efficient handling of large files and real-time data.

**Upload Example:**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
```

**Download Example:**
```typescript
const response = await api.get('/large-file', { stream: true });
const reader = response.body.getReader();
// Read chunks as they arrive
```

**Node.js Streaming:**
```typescript
import fs from 'fs';
const stream = fs.createReadStream('bigfile.zip');
await api.post('/upload', stream, { headers: { 'Content-Type': 'application/zip' } });
```

See [Performance Tips](#performance) for best practices on streaming and large file handling.
