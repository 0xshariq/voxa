# Migration Guide: Axios to Voxa

This guide helps you migrate from Axios to Voxa HTTP Client. Voxa provides modern features built on the native Fetch API while maintaining a familiar API surface.

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Quick Start](#quick-start)
- [API Comparison](#api-comparison)
- [Feature Mapping](#feature-mapping)
- [Common Patterns](#common-patterns)
- [Breaking Changes](#breaking-changes)
- [Migration Checklist](#migration-checklist)

---

## Why Migrate?

### Voxa Advantages Over Axios

| Feature | Axios | Voxa |
|---------|-------|------|
| **Native Fetch API** | ❌ XMLHttpRequest | ✅ Modern Fetch |
| **HTTP/2 Support** | ❌ | ✅ Server Push |
| **Streaming** | ⚠️ Limited | ✅ Full Support |
| **TypeScript** | ⚠️ Community Types | ✅ Native Types |
| **Circuit Breaker** | ❌ | ✅ Built-in |
| **Request Deduplication** | ❌ | ✅ Automatic |
| **Rate Limiting** | ❌ | ✅ Built-in |
| **SSRF Protection** | ❌ | ✅ Built-in |
| **Smart Caching** | ⚠️ Basic | ✅ Multi-layer |
| **Bundle Size** | ~13KB | ~8KB |

---

## Quick Start

### Installation

```bash
# Remove Axios
npm uninstall axios

# Install Voxa
npm install @0xshariq/voxa
```

### Basic Setup

**Before (Axios):**
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**After (Voxa):**
```typescript
import { VoxaClient } from '@0xshariq/voxa';

const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## API Comparison

### Basic Requests

#### GET Request

**Axios:**
```typescript
const response = await axios.get('/users/123');
const data = response.data;
```

**Voxa:**
```typescript
const response = await client.get('/users/123');
const data = await response.json();
```

#### POST Request

**Axios:**
```typescript
const response = await axios.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

**Voxa:**
```typescript
const response = await client.post('/users', {
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});
```

#### Request with Headers

**Axios:**
```typescript
const response = await axios.get('/users', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});
```

**Voxa:**
```typescript
const response = await client.get('/users', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});
```

### Request Configuration

#### Timeout

**Axios:**
```typescript
axios.get('/data', { timeout: 3000 });
```

**Voxa:**
```typescript
client.get('/data', { timeout: 3000 });
```

#### Query Parameters

**Axios:**
```typescript
axios.get('/search', {
  params: { q: 'typescript', limit: 10 }
});
```

**Voxa:**
```typescript
client.get('/search?q=typescript&limit=10');
// Or use URLSearchParams
const params = new URLSearchParams({ q: 'typescript', limit: '10' });
client.get(`/search?${params}`);
```

#### Request Cancellation

**Axios:**
```typescript
const source = axios.CancelToken.source();

axios.get('/data', {
  cancelToken: source.token
});

source.cancel('Cancelled by user');
```

**Voxa:**
```typescript
const controller = new AbortController();

client.get('/data', {
  signal: controller.signal
});

controller.abort();
```

---

## Feature Mapping

### Interceptors

**Axios:**
```typescript
axios.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

**Voxa:**
```typescript
const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  interceptors: {
    request: async (url, options) => {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
      return { url, options };
    },
    response: async (response) => {
      if (!response.ok && response.status === 401) {
        // Handle unauthorized
      }
      return response;
    }
  }
});
```

### Retry Logic

**Axios (with axios-retry):**
```typescript
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});
```

**Voxa (built-in):**
```typescript
const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});
```

### Response Transformation

**Axios:**
```typescript
axios.get('/users', {
  transformResponse: [(data) => {
    return JSON.parse(data).users;
  }]
});
```

**Voxa:**
```typescript
const response = await client.get('/users');
const json = await response.json();
const users = json.users;
```

### Progress Tracking

**Axios:**
```typescript
axios.post('/upload', formData, {
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(percentCompleted);
  }
});
```

**Voxa:**
```typescript
const response = await client.post('/upload', {
  body: formData,
  streaming: {
    enabled: true,
    onProgress: (progress) => {
      console.log(progress.percentage);
    }
  }
});
```

---

## Common Patterns

### Authentication

#### Bearer Token

**Axios:**
```typescript
const client = axios.create({
  baseURL: 'https://api.example.com'
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Voxa:**
```typescript
const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    getToken: async () => {
      return localStorage.getItem('token');
    }
  }
});
```

#### Token Refresh

**Axios:**
```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

client.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      failedQueue.forEach(req => req.resolve(newToken));
      failedQueue = [];
      isRefreshing = false;
      
      return client(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

**Voxa (built-in):**
```typescript
const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    getToken: async () => localStorage.getItem('token'),
    refreshToken: async () => {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      const { token } = await response.json();
      localStorage.setItem('token', token);
      return token;
    },
    shouldRefresh: (response) => response.status === 401
  }
});
```

### Caching

**Axios (manual):**
```typescript
const cache = new Map();

async function getCachedData(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await axios.get(url);
  cache.set(url, response.data);
  
  setTimeout(() => cache.delete(url), 60000); // 1 minute TTL
  
  return response.data;
}
```

**Voxa (built-in):**
```typescript
const client = new VoxaClient({
  baseURL: 'https://api.example.com',
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
    strategy: 'memory'
  }
});

// Cached automatically
const response = await client.get('/data');
```

### Error Handling

**Axios:**
```typescript
try {
  const response = await axios.get('/data');
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
  }
  throw error;
}
```

**Voxa:**
```typescript
try {
  const response = await client.get('/data');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Error:', error);
  }
  throw error;
}
```

### Concurrent Requests

**Axios:**
```typescript
const [users, posts] = await Promise.all([
  axios.get('/users'),
  axios.get('/posts')
]);
```

**Voxa:**
```typescript
const [users, posts] = await Promise.all([
  client.get('/users'),
  client.get('/posts')
]);
```

### File Upload

**Axios:**
```typescript
const formData = new FormData();
formData.append('file', file);

await axios.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (event) => {
    console.log(Math.round((event.loaded * 100) / event.total));
  }
});
```

**Voxa:**
```typescript
const formData = new FormData();
formData.append('file', file);

await client.post('/upload', {
  body: formData,
  streaming: {
    enabled: true,
    type: 'upload',
    onProgress: (progress) => {
      console.log(progress.percentage);
    }
  }
});
```

---

## Breaking Changes

### Response Object

**Axios:**
- `response.data` - Response body
- `response.status` - HTTP status code
- `response.statusText` - Status message
- `response.headers` - Response headers
- `response.config` - Request config

**Voxa (native Response):**
- `response.json()` - Parse JSON body
- `response.text()` - Get text body
- `response.blob()` - Get blob body
- `response.status` - HTTP status code
- `response.statusText` - Status message
- `response.headers` - Response headers
- `response.ok` - Status in range 200-299

### Error Handling

**Axios:**
```typescript
catch (error) {
  if (axios.isAxiosError(error)) {
    error.response.status
    error.response.data
  }
}
```

**Voxa:**
```typescript
catch (error) {
  if (!response.ok) {
    // HTTP error
    response.status
    await response.json()
  } else {
    // Network error
    error instanceof TypeError
  }
}
```

### Base URL Trailing Slash

**Axios:** Automatically handles trailing slashes
```typescript
baseURL: 'https://api.example.com/'  // Works
baseURL: 'https://api.example.com'   // Works
```

**Voxa:** Be explicit with trailing slashes
```typescript
baseURL: 'https://api.example.com'   // No trailing slash
// Then use: client.get('/users')
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install Voxa: `npm install @0xshariq/voxa`
- [ ] Review [API Comparison](#api-comparison)
- [ ] Check Node.js version (18+ required)
- [ ] Update TypeScript config for ESM modules

### Phase 2: Replace Client Creation
- [ ] Replace `axios.create()` with `new VoxaClient()`
- [ ] Update base URL configuration
- [ ] Migrate default headers
- [ ] Update timeout settings

### Phase 3: Update Request Methods
- [ ] Replace `axios.get()` with `client.get()`
- [ ] Replace `axios.post()` with `client.post()`
- [ ] Update response handling: `response.data` → `response.json()`
- [ ] Update error handling patterns

### Phase 4: Migrate Interceptors
- [ ] Convert request interceptors to Voxa format
- [ ] Convert response interceptors to Voxa format
- [ ] Test interceptor execution order

### Phase 5: Replace Plugins
- [ ] Replace `axios-retry` with built-in retry
- [ ] Replace cache libraries with built-in cache
- [ ] Remove axios-specific middleware

### Phase 6: Update Advanced Features
- [ ] Migrate cancel tokens to AbortController
- [ ] Update progress tracking
- [ ] Migrate authentication logic
- [ ] Update query parameter handling

### Phase 7: Testing
- [ ] Test all GET requests
- [ ] Test all POST/PUT/PATCH requests
- [ ] Test file uploads
- [ ] Test error scenarios
- [ ] Test timeout behavior
- [ ] Test concurrent requests
- [ ] Performance testing

### Phase 8: Cleanup
- [ ] Remove Axios dependency: `npm uninstall axios`
- [ ] Remove axios-retry and other plugins
- [ ] Update documentation
- [ ] Remove unused imports

---

## Advanced Migration

### Custom Axios Adapters

If you're using custom Axios adapters, you'll need to implement custom logic with Voxa:

**Axios:**
```typescript
const adapter = (config) => {
  // Custom request logic
  return new Promise((resolve, reject) => {
    // ...
  });
};

axios.defaults.adapter = adapter;
```

**Voxa:**
```typescript
// Use interceptors for custom logic
const client = new VoxaClient({
  interceptors: {
    request: async (url, options) => {
      // Custom pre-request logic
      return { url, options };
    },
    response: async (response) => {
      // Custom post-response logic
      return response;
    }
  }
});
```

### Axios Instances

**Axios:**
```typescript
const api1 = axios.create({ baseURL: 'https://api1.example.com' });
const api2 = axios.create({ baseURL: 'https://api2.example.com' });
```

**Voxa:**
```typescript
const api1 = new VoxaClient({ baseURL: 'https://api1.example.com' });
const api2 = new VoxaClient({ baseURL: 'https://api2.example.com' });
```

---

## Getting Help

### Resources
- [Documentation](./README.md)
- [Examples](./docs/EXAMPLES.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/0xshariq/voxa/issues)

### Common Issues

**Issue:** Response doesn't have `.data` property
```typescript
// ❌ Axios way
const users = response.data;

// ✅ Voxa way
const users = await response.json();
```

**Issue:** Query parameters not working
```typescript
// ❌ Wrong
client.get('/search', { params: { q: 'test' } });

// ✅ Correct
client.get('/search?q=test');
```

**Issue:** Cancel token not working
```typescript
// ❌ Axios way
const source = axios.CancelToken.source();

// ✅ Voxa way
const controller = new AbortController();
client.get('/data', { signal: controller.signal });
controller.abort();
```

---

## Need More Features?

Voxa provides many features Axios doesn't have:

- **Circuit Breaker**: Automatic failure detection
- **Request Deduplication**: Prevent duplicate requests
- **Rate Limiting**: Built-in rate limiting
- **SSRF Protection**: Security by default
- **HTTP/2 Push**: Modern protocol support
- **Smart Caching**: Multi-layer caching

See [FEATURES.md](./FEATURES.md) for complete feature documentation.

---

## Feedback

Found an issue during migration? [Open an issue](https://github.com/0xshariq/voxa/issues) or contribute to this guide!
