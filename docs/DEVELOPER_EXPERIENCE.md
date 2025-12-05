# Developer Experience Guide

Voxa is designed with developer experience as a top priority. This guide covers debugging, logging, configuration access, and other DX features.

## Table of Contents

- [Debug Mode](#debug-mode)
- [Configuration Access](#configuration-access)
- [Public Getters](#public-getters)
- [Logging Utilities](#logging-utilities)
- [Type Safety](#type-safety)
- [Error Handling](#error-handling)
- [Testing Support](#testing-support)

## Debug Mode

Enable comprehensive debug logging to troubleshoot issues and understand request flow.

### Enable Debug Mode

```typescript
import create from '@0xshariq/voxa';

const api = create({
  baseURL: 'https://api.example.com',
  debug: true, // Enable debug logging
  cache: { enabled: true },
  retry: { enabled: true, count: 3 }
});
```

### Debug Output

When debug mode is enabled, you'll see detailed logs:

```
[Voxa Debug] Request: { method: 'GET', endpoint: '/users', baseURL: 'https://api.example.com', hasData: false }
[Voxa Debug] Response: { status: 200, statusText: 'OK', redirected: false, attempt: 1 }
```

### Check Debug Status

```typescript
// Check if debug mode is enabled
if (api.isDebugEnabled()) {
  console.log('Debug mode is active');
}
```

### Runtime Debug Control

```typescript
// Enable debug mode at runtime
api.updateConfig({ debug: true });

// Disable debug mode
api.updateConfig({ debug: false });
```

## Configuration Access

Safely access the current configuration without exposing private properties.

### Get Configuration

```typescript
// Get a read-only copy of the current config
const config = api.getConfig();

console.log('Base URL:', config.baseURL);
console.log('Timeout:', config.timeout);
console.log('Cache enabled:', config.cache?.enabled);
console.log('Retry count:', config.retry?.count);
```

### Why Read-Only?

The `getConfig()` method returns a shallow copy to prevent accidental modification of internal state:

```typescript
const config = api.getConfig();
config.timeout = 10000; // This won't affect the actual instance

// To update config, use updateConfig()
api.updateConfig({ timeout: 10000 });
```

## Public Getters

All feature managers now expose public methods for introspection.

### BatchManager

```typescript
import { BatchManager } from '@0xshariq/voxa';

const batchManager = new BatchManager({
  enabled: true,
  endpoint: '/batch',
  wait: 100,
  maxBatchSize: 10
});

// Get configuration
const config = batchManager.getConfig();
console.log('Endpoint:', config.endpoint);
console.log('Wait time:', config.wait);
console.log('Max batch size:', config.maxBatchSize);

// Get pending request count
const pending = batchManager.getPendingCount();
console.log('Pending requests:', pending);
```

### OfflineQueueManager

```typescript
import { OfflineQueueManager } from '@0xshariq/voxa';

const offlineQueue = new OfflineQueueManager({
  enabled: true,
  storage: 'localStorage'
});

// Get configuration
const config = offlineQueue.getConfig();
console.log('Storage type:', config.storage);

// Get queue size
const size = offlineQueue.getQueueSize();
console.log('Queued requests:', size);

// Get all queued requests (read-only)
const queue = offlineQueue.getQueue();
queue.forEach(req => {
  console.log('Request:', req.method, req.url);
});
```

### Voxa Instance

```typescript
// Get cache statistics
const cacheStats = api.getCacheStats();
console.log('Cache:', cacheStats);

// Get queue statistics
const queueStats = api.getQueueStats();
console.log('Queue:', queueStats);

// Get deduplication statistics
const dedupStats = api.getDeduplicationStats();
console.log('Deduplication:', dedupStats);

// Get metadata statistics
const metadataStats = api.getMetadataStats();
console.log('Metadata:', metadataStats);

// Get specific request metadata
const metadata = api.getRequestMetadata('request-id-123');
console.log('Request metadata:', metadata);
```

## Logging Utilities

Voxa includes safe logging utilities that automatically redact sensitive data.

### Import Logging Functions

```typescript
import { logSafe, warnSafe, errorSafe, debugLog } from '@0xshariq/voxa';
```

### Safe Logging

```typescript
// Automatically redacts sensitive keys
logSafe({
  url: '/api/users',
  headers: {
    authorization: 'Bearer secret-token', // Will be [REDACTED]
    'content-type': 'application/json'
  },
  email: 'user@example.com' // Will be [REDACTED]
});

// Output:
// {
//   url: '/api/users',
//   headers: {
//     authorization: '[REDACTED]',
//     'content-type': 'application/json'
//   },
//   email: '[REDACTED]'
// }
```

### Sensitive Keys

The following keys are automatically redacted:
- authorization
- token, access_token, refresh_token
- password, secret
- apiKey, apikey, x-api-key
- set-cookie, cookie
- email, ssn
- creditcard, cardnumber, cvv, pin

### Debug Logging

```typescript
import { debugLog, setDebugEnabled } from '@0xshariq/voxa';

// Enable debug logging globally
setDebugEnabled(true);

// This will only log if debug is enabled
debugLog('Processing request', { method: 'GET', url: '/api/data' });

// Disable debug logging
setDebugEnabled(false);

// This won't log
debugLog('This message is hidden');
```

### Custom Sanitization

```typescript
import { sanitizeLog } from '@0xshariq/voxa';

const data = {
  username: 'john',
  password: 'secret123', // Will be redacted
  profile: {
    email: 'john@example.com' // Will be redacted
  }
};

const sanitized = sanitizeLog(data);
console.log(sanitized);
// {
//   username: 'john',
//   password: '[REDACTED]',
//   profile: {
//     email: '[REDACTED]'
//   }
// }
```

## Type Safety

Voxa is built with TypeScript-first design.

### Generic Type Support

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Type-safe response
const response = await api.get<User>('/users/1');
const user: User = await response.json(); // TypeScript knows this is a User

// Type-safe array response
const response = await api.get<User[]>('/users');
const users: User[] = await response.json();
```

### Config Type Safety

```typescript
import { VoxaConfig } from '@0xshariq/voxa';

// Full type checking
const config: VoxaConfig = {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  debug: true,
  cache: {
    enabled: true,
    storage: 'memory', // Type error if you use invalid value
    ttl: 300000
  },
  retry: {
    enabled: true,
    count: 3,
    delay: 1000,
    exponentialBackoff: true
  }
};

const api = create(config);
```

### Custom Type Guards

```typescript
function isVoxaError(error: unknown): error is Error {
  return error instanceof Error;
}

try {
  await api.get('/endpoint');
} catch (error) {
  if (isVoxaError(error)) {
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
}
```

## Error Handling

Comprehensive error classification and debugging.

### Error Classification

```typescript
import { ErrorClassifier } from '@0xshariq/voxa';

const api = create({
  errors: { enabled: true }
});

try {
  await api.get('/endpoint');
} catch (error) {
  const classification = api.classifyError(error);
  
  console.log('Error type:', classification.type);
  console.log('Error message:', classification.message);
  console.log('Debug info:', classification.debugMessage);
  
  // Handle based on error type
  switch (classification.type) {
    case 'network':
      console.error('Network issue - check connection');
      break;
    case 'timeout':
      console.error('Request timed out - increase timeout');
      break;
    case 'server':
      console.error('Server error - retry later');
      break;
    case 'client':
      console.error('Client error - check request');
      break;
  }
}
```

### Error Context

```typescript
try {
  await api.get('/endpoint');
} catch (error) {
  if (error instanceof Error) {
    console.error('Message:', error.message);
    console.error('Cause:', error.cause); // Additional context
    console.error('Stack:', error.stack);
  }
}
```

## Testing Support

Features designed to make testing easier.

### Mock Configuration

```typescript
// Test configuration
const testApi = create({
  baseURL: 'https://httpbin.org',
  timeout: 30000,
  debug: false, // Disable debug logs in tests
  cache: { enabled: false }, // Disable cache for fresh data
  retry: { enabled: false }, // Disable retry for faster tests
  metadata: { enabled: true, log: false } // Track but don't log
});
```

### Access Statistics

```typescript
describe('API Tests', () => {
  it('should cache responses', async () => {
    const api = create({
      cache: { enabled: true, storage: 'memory' }
    });
    
    // First request
    await api.get('/users');
    
    // Check cache stats
    const stats = api.getCacheStats();
    expect(stats.size).toBe(1);
    
    // Second request (should be cached)
    await api.get('/users');
    
    // Verify it was served from cache
    const metadata = api.getMetadataStats();
    // Assert based on metadata
  });
  
  it('should queue requests', async () => {
    const api = create({
      queue: { enabled: true, maxConcurrent: 2 }
    });
    
    // Make multiple requests
    const promises = [
      api.get('/endpoint1'),
      api.get('/endpoint2'),
      api.get('/endpoint3')
    ];
    
    // Check queue stats
    const stats = api.getQueueStats();
    expect(stats.activeRequests).toBeLessThanOrEqual(2);
    
    await Promise.all(promises);
  });
});
```

### Standalone Manager Testing

```typescript
import { BatchManager } from '@0xshariq/voxa';

describe('BatchManager', () => {
  it('should expose configuration', () => {
    const manager = new BatchManager({
      enabled: true,
      endpoint: '/batch',
      wait: 100
    });
    
    const config = manager.getConfig();
    expect(config.endpoint).toBe('/batch');
    expect(config.wait).toBe(100);
  });
  
  it('should track pending requests', () => {
    const manager = new BatchManager({ enabled: true });
    
    // Add requests
    manager.add('GET', '/endpoint1', null, {});
    manager.add('POST', '/endpoint2', { data: 'test' }, {});
    
    // Check pending count
    expect(manager.getPendingCount()).toBe(2);
  });
});
```

### Debug Mode in Tests

```typescript
describe('API Tests with Debug', () => {
  let api;
  
  beforeEach(() => {
    api = create({
      debug: process.env.DEBUG_TESTS === 'true', // Enable with env var
      baseURL: 'https://api.example.com'
    });
  });
  
  it('should make request with debug info', async () => {
    // Run: DEBUG_TESTS=true npm test
    // Will show debug logs if enabled
    await api.get('/endpoint');
  });
});
```

## Best Practices

### 1. Use Debug Mode During Development

```typescript
const isDev = process.env.NODE_ENV === 'development';

const api = create({
  baseURL: process.env.API_URL,
  debug: isDev, // Auto-enable in development
  metadata: { enabled: true, log: isDev }
});
```

### 2. Safe Configuration Access

```typescript
// ❌ Bad - Don't access private properties
// const config = api.config; // Error: private property

// ✅ Good - Use public getter
const config = api.getConfig();
console.log('Timeout:', config.timeout);
```

### 3. Leverage Public Getters

```typescript
// ❌ Bad - Don't access internal state
// const queueSize = offlineQueue.queue.length; // Error: private

// ✅ Good - Use public getter
const queueSize = offlineQueue.getQueueSize();
console.log('Queue size:', queueSize);
```

### 4. Always Sanitize Logs

```typescript
import { logSafe } from '@0xshariq/voxa';

// ❌ Bad - Direct logging exposes secrets
console.log('Config:', config); // May expose tokens

// ✅ Good - Use safe logging
logSafe('Config:', config); // Automatically redacts sensitive data
```

### 5. Use Type Assertions

```typescript
// ✅ Type-safe requests
interface ApiResponse {
  success: boolean;
  data: any;
}

const response = await api.get<ApiResponse>('/endpoint');
const result = await response.json();

if (result.success) {
  console.log('Data:', result.data);
}
```

## Environment-Specific Configuration

```typescript
// config/api.ts
import create from '@0xshariq/voxa';

const getApiConfig = () => {
  const env = process.env.NODE_ENV;
  
  const baseConfig = {
    baseURL: process.env.API_URL,
    timeout: 5000
  };
  
  if (env === 'development') {
    return create({
      ...baseConfig,
      debug: true, // Verbose logging
      metadata: { enabled: true, log: true },
      retry: { enabled: true, count: 2 }
    });
  }
  
  if (env === 'production') {
    return create({
      ...baseConfig,
      debug: false, // No debug logs
      metadata: { enabled: true, log: false },
      retry: { enabled: true, count: 5 }
    });
  }
  
  // Test environment
  return create({
    ...baseConfig,
    debug: false,
    cache: { enabled: false },
    retry: { enabled: false }
  });
};

export const api = getApiConfig();
```

## Monitoring and Observability

```typescript
// Track performance
const api = create({
  debug: true,
  metadata: {
    enabled: true,
    customHandler: (metadata) => {
      // Send to monitoring service
      const duration = metadata.endTime - metadata.startTime;
      
      if (duration > 1000) {
        console.warn('Slow request detected:', {
          endpoint: metadata.endpoint,
          method: metadata.method,
          duration: `${duration}ms`
        });
      }
    }
  }
});

// Use interceptors for monitoring
api.interceptors.request.use((config) => {
  config.startTime = Date.now();
  return config;
});

api.interceptors.response.use((response) => {
  const duration = Date.now() - response.config.startTime;
  console.log(`Request completed in ${duration}ms`);
  return response;
});
```

## See Also

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Advanced Features](./ADVANCED.md)
- [Examples](./EXAMPLES.md)
