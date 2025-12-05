# Troubleshooting Guide

Common issues and solutions when using Voxa HTTP Client.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [Network Issues](#network-issues)
- [Cache Issues](#cache-issues)
- [Authentication Issues](#authentication-issues)
- [TypeScript Issues](#typescript-issues)
- [Performance Issues](#performance-issues)
- [Streaming Issues](#streaming-issues)
- [SSRF Protection](#ssrf-protection)
- [Common Error Messages](#common-error-messages)

## Installation Issues

### Package Not Found

**Problem:** `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@0xshariq%2fvoxa`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install @0xshariq/voxa

# Or use specific registry
npm install @0xshariq/voxa --registry=https://registry.npmjs.org/
```

### Peer Dependency Warnings

**Problem:** Warnings about peer dependencies

**Solution:**
```bash
# Use --legacy-peer-deps flag
npm install @0xshariq/voxa --legacy-peer-deps

# Or with pnpm
pnpm install @0xshariq/voxa
```

### Version Conflicts

**Problem:** Multiple versions of Voxa installed

**Solution:**
```bash
# Check installed versions
npm ls @0xshariq/voxa

# Remove all versions
npm uninstall @0xshariq/voxa

# Install specific version
npm install @0xshariq/voxa@latest
```

## Build Errors

### TS2322: Type 'X' is not assignable to type 'Y'

**Problem:** TypeScript type mismatch errors

**Solution:**
```typescript
// Incorrect - 'memory' not valid for offline storage
const api = create({
  offline: { enabled: true, storage: 'memory' }
});

// Correct - Use 'localStorage' or 'indexedDB'
const api = create({
  offline: { enabled: true, storage: 'localStorage' }
});
```

### TS2341: Property is private

**Problem:** Trying to access private properties

**Solution:**
```typescript
// Incorrect - config is private
const streamingImages = new StreamingImageManager(api.config);

// Correct - Pass empty config or VoxaConfig
const streamingImages = new StreamingImageManager({});
```

### TS1232: Dynamic import cannot be used

**Problem:** Using dynamic imports in synchronous context

**Solution:**
```typescript
// Incorrect
function myFunction() {
  const { logSafe } = await import('./logging.js');
}

// Correct - Use static imports
import { logSafe } from './logging.js';
```

### Module Resolution Errors

**Problem:** `Cannot find module` errors

**Solution:**

Check your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

## Runtime Errors

### TypeError: fetch is not a function

**Problem:** Fetch API not available

**Solution:**
```bash
# Node.js < 18 requires a polyfill
npm install node-fetch

# Or upgrade to Node.js 18+
nvm install 18
nvm use 18
```

For older Node.js versions:
```typescript
import fetch from 'node-fetch';
globalThis.fetch = fetch as any;
```

### Request ID Expiry Issues

**Problem:** Cache conflicts or batch request issues

**Solution:**

Voxa uses request IDs with expiry: `<timestamp>-<expiry>-<random>`

```typescript
// Cache: 5 min expiry (default)
// Batch: 15 min expiry

// Ensure your TTLs match your use case
const api = create({
  cache: { 
    enabled: true, 
    ttl: 300000 // 5 minutes
  },
  batch: { 
    enabled: true, 
    wait: 100 // 100ms batching window
  }
});
```

### Token Refresh Failure

**Problem:** Token refresh hooks not working

**Solution:**
```typescript
const api = create({
  token: {
    enabled: true,
    type: 'bearer',
    storage: 'memory',
    getToken: async () => {
      // Return current token
      return localStorage.getItem('token') || '';
    },
    setToken: (token) => {
      // Store new token
      localStorage.setItem('token', token);
    },
    refreshToken: async () => {
      // Refresh token logic
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Refresh-Token': localStorage.getItem('refreshToken') }
      });
      const { token } = await response.json();
      return token;
    }
  },
  // Handle refresh failures
  onTokenRefreshFailure: (error, context) => {
    console.error('Token refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
  }
});
```

## Network Issues

### ECONNREFUSED / Connection Refused

**Problem:** Cannot connect to server

**Solution:**
```typescript
// Check if server is running
// Verify the URL and port

const api = create({
  baseURL: 'http://localhost:3000', // Ensure server is running on this port
  timeout: 10000 // Increase timeout if needed
});

// Add error handling
try {
  const response = await api.get('/api/data');
} catch (error) {
  console.error('Connection failed:', error);
  // Check if server is running
  // Check firewall settings
  // Check network connectivity
}
```

### ETIMEDOUT / Request Timeout

**Problem:** Request takes too long

**Solution:**
```typescript
// Increase timeout
const api = create({
  timeout: 30000, // 30 seconds
  retry: {
    enabled: true,
    count: 3,
    delay: 1000,
    exponentialBackoff: true
  }
});

// Or disable timeout for specific requests
await api.get('/slow-endpoint', { timeout: 0 });
```

### CORS Errors

**Problem:** CORS policy blocking requests

**Solution:**

Server-side (Express example):
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

Client-side:
```typescript
const api = create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  },
  // Ensure credentials are set if needed
  credentials: 'include'
});
```

### SSL/TLS Certificate Errors

**Problem:** Certificate validation failures

**Solution:**

**Development only (NOT for production):**
```bash
# Node.js
NODE_TLS_REJECT_UNAUTHORIZED=0 node app.js
```

**Production solution:**
- Use valid SSL certificates
- Update root CA certificates
- Use proper certificate chain

## Cache Issues

### Cache Not Working

**Problem:** Responses not being cached

**Solution:**
```typescript
// Verify cache is enabled
const api = create({
  cache: {
    enabled: true, // Must be true
    storage: 'memory',
    ttl: 300000 // 5 minutes
  }
});

// Check cache stats
const stats = api.getCacheStats();
console.log('Cache stats:', stats);

// Verify cache key is being generated
const response = await api.get('/api/data');
console.log('Request ID:', response.requestId);
```

### Cache Growing Too Large

**Problem:** Memory usage increasing

**Solution:**
```typescript
// Set max cache size
const api = create({
  cache: {
    enabled: true,
    storage: 'memory',
    ttl: 300000, // 5 minutes
    maxSize: 100 // Limit to 100 entries
  }
});

// Or implement custom cache with LRU
import { CacheAdapter } from '@0xshariq/voxa';

class LRUCache implements CacheAdapter {
  private cache = new Map();
  private maxSize = 100;
  
  async get(key: string) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  async set(key: string, value: any, ttl: number) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  async delete(key: string) {
    this.cache.delete(key);
  }
  
  async clear() {
    this.cache.clear();
  }
}
```

### Redis Cache Connection Issues

**Problem:** Cannot connect to Redis

**Solution:**
```typescript
// Check Redis connection
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.CACHE_HOST || 'localhost',
  port: parseInt(process.env.CACHE_PORT || '6379'),
  password: process.env.CACHE_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

// Use with Voxa
const api = create({
  cache: {
    enabled: true,
    storage: 'custom',
    adapter: redis
  }
});
```

## Authentication Issues

### 401 Unauthorized

**Problem:** Authentication failing

**Solution:**
```typescript
// Check token is being sent
const api = create({
  token: {
    enabled: true,
    type: 'bearer',
    getToken: async () => {
      const token = localStorage.getItem('auth_token');
      console.log('Token:', token); // Debug log
      return token || '';
    }
  }
});

// Or use interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});
```

### Token Not Refreshing

**Problem:** Token expiry not handled

**Solution:**
```typescript
const api = create({
  token: {
    enabled: true,
    type: 'bearer',
    refreshToken: async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await fetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
          throw new Error('Refresh failed');
        }
        
        const { token } = await response.json();
        localStorage.setItem('auth_token', token);
        return token;
      } catch (error) {
        console.error('Token refresh error:', error);
        // Redirect to login
        window.location.href = '/login';
        throw error;
      }
    }
  }
});
```

## TypeScript Issues

### Type Inference Not Working

**Problem:** Response types not inferred

**Solution:**
```typescript
// Define interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Use generic type
const response = await api.get<User>('/users/1');
const user: User = await response.json();

// Or assert type
const data = (await response.json()) as User;
```

### Config Type Errors

**Problem:** Config object type errors

**Solution:**
```typescript
import { VoxaConfig } from '@0xshariq/voxa';

// Type-safe config
const config: VoxaConfig = {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  cache: { enabled: true, storage: 'memory', ttl: 300000 },
  retry: { enabled: true, count: 3, delay: 1000 }
};

const api = create(config);
```

## Performance Issues

### Slow Response Times

**Problem:** Requests taking too long

**Solution:**
```typescript
// Enable caching
const api = create({
  cache: {
    enabled: true,
    storage: 'memory',
    ttl: 300000
  },
  // Enable deduplication
  deduplication: {
    enabled: true,
    ttl: 300000
  },
  // Use priority queue
  queue: {
    enabled: true,
    maxConcurrent: 5 // Adjust based on needs
  }
});

// Use batch requests
const api = create({
  batch: {
    enabled: true,
    endpoint: '/batch',
    wait: 100,
    maxBatchSize: 10
  }
});
```

### Memory Leaks

**Problem:** Memory usage growing over time

**Solution:**
```typescript
// Clear cache periodically
setInterval(() => {
  api.clearCache();
}, 3600000); // Every hour

// Limit queue size
const api = create({
  queue: {
    enabled: true,
    maxConcurrent: 5,
    maxQueueSize: 100 // Limit pending requests
  },
  metadata: {
    enabled: true,
    maxEntries: 100 // Limit metadata storage
  }
});

// Clean up managers when done
// (Note: Voxa doesn't expose destroy() yet, but you can clear references)
```

### High CPU Usage

**Problem:** CPU usage too high

**Solution:**
```typescript
// Reduce retry attempts
const api = create({
  retry: {
    enabled: true,
    count: 2, // Lower retry count
    delay: 1000,
    exponentialBackoff: true
  },
  // Reduce concurrent requests
  queue: {
    enabled: true,
    maxConcurrent: 2 // Lower concurrency
  }
});
```

## Streaming Issues

### Upload Progress Not Updating

**Problem:** Progress callback not firing

**Solution:**
```typescript
// Ensure onProgress is passed
const streamingImages = new StreamingImageManager({
  streamingImages: {
    onProgress: (sent, total) => {
      console.log(`Progress: ${sent}/${total}`);
    }
  }
});

// Or pass directly to upload
await streamingImages.upload(
  url,
  file,
  headers,
  (sent, total) => {
    console.log(`${sent}/${total} bytes`);
  }
);
```

### Large File Upload Fails

**Problem:** Upload timeout or memory issues

**Solution:**
```typescript
// Increase timeout
const api = create({
  timeout: 300000, // 5 minutes
  retry: {
    enabled: true,
    count: 2
  }
});

// Use chunked uploads
async function uploadInChunks(file: File, chunkSize = 1024 * 1024) {
  const chunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await streamingImages.upload(
      `/api/upload?chunk=${i}&total=${chunks}`,
      chunk,
      { 'Content-Range': `bytes ${start}-${end}/${file.size}` }
    );
  }
}
```

### Download Stream Hangs

**Problem:** Download not completing

**Solution:**
```typescript
// Add timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await streamingImages.download(
    url,
    {},
    (received, total) => {
      console.log(`Downloaded: ${received}/${total}`);
    }
  );
  clearTimeout(timeoutId);
  
  const blob = await response.blob();
  // Use blob...
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Download timeout');
  }
}
```

## SSRF Protection

### Localhost Requests Blocked

**Problem:** `SSRF protection: Private IP address detected`

**Solution:**

SSRF protection blocks requests to private IPs for security. To test locally:

```typescript
// Option 1: Use public test APIs
const api = create({
  baseURL: 'https://httpbin.org' // Public test API
});

// Option 2: Disable SSRF protection (development only)
// Note: This requires modifying security.ts - not recommended

// Option 3: Use ngrok or similar for local testing
// ngrok http 3000
// Then use: https://your-subdomain.ngrok.io
```

### API Domain Blocked

**Problem:** Valid domain blocked by SSRF protection

**Solution:**

Some public APIs may resolve to private IPs. Whitelist them:

```typescript
// In security.ts (if you have access)
const WHITELISTED_DOMAINS = [
  'api.example.com',
  'jsonplaceholder.typicode.com'
];

// Or contact maintainer to add to whitelist
```

## Common Error Messages

### "Invalid image/video payload"

**Cause:** Payload validation failed

**Fix:**
```typescript
// Check payload type
const validatePayload = (payload: any) => {
  return payload instanceof Blob || 
         payload instanceof File || 
         payload instanceof FormData;
};

const streamingImages = new StreamingImageManager({
  streamingImages: { validatePayload }
});
```

### "Property 'config' is private"

**Cause:** Trying to access private property

**Fix:**
```typescript
// Don't access private properties
// Use public methods or pass empty config
const manager = new StreamingImageManager({});
```

### "getQueueSize is not a function"

**Cause:** Method doesn't exist on manager

**Fix:**
```typescript
// OfflineQueueManager doesn't expose getQueueSize
// Access queue via api stats instead
const stats = api.getQueueStats();
console.log('Queue size:', stats.queueSize);
```

### "Module not found"

**Cause:** Import path incorrect

**Fix:**
```typescript
// Use correct import paths
import create from '@0xshariq/voxa';
import { StreamingImageManager } from '@0xshariq/voxa';

// Not:
// import create from '@0xshariq/voxa/dist/index.js';
```

## Getting Help

If you're still experiencing issues:

1. **Check the documentation:**
   - [Advanced Features](./ADVANCED.md)
   - [Configuration Guide](./CONFIGURATION.md)
   - [Streaming Guide](./STREAMING.md)
   - [Examples](./EXAMPLES.md)

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/0xshariq/voxa/issues)

3. **Create a new issue:**
   - Include Voxa version
   - Include Node.js/browser version
   - Provide minimal reproduction
   - Include error messages and stack traces

4. **Ask the community:**
   - [GitHub Discussions](https://github.com/0xshariq/voxa/discussions)

## Debug Mode

Enable verbose logging for troubleshooting:

```typescript
const api = create({
  baseURL: 'https://api.example.com',
  metadata: {
    enabled: true,
    log: true // Enable logging
  }
});

// Check request metadata
api.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('Response:', response.status);
  return response;
});
```

## Performance Profiling

```typescript
// Measure request performance
api.interceptors.request.use((config) => {
  config.startTime = Date.now();
  return config;
});

api.interceptors.response.use((response) => {
  const duration = Date.now() - response.config.startTime;
  console.log(`Request took ${duration}ms`);
  return response;
});

// Get metrics
const metrics = api.getMetrics();
console.log('Metrics:', metrics);
```

## See Also

- [Configuration Guide](./CONFIGURATION.md)
- [Advanced Features](./ADVANCED.md)
- [Streaming Guide](./STREAMING.md)
- [Custom Cache](./CUSTOM_CACHE.md)
- [Batch Usage](./BATCH_USAGE.md)
