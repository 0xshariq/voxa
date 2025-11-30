# Voxa HTTP Client

A modern, feature-rich HTTP client built on Native Fetch API with advanced capabilities for enterprise applications.

[![npm version](https://img.shields.io/npm/v/@0xshariq/voxa.svg)](https://www.npmjs.com/package/@0xshariq/voxa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔄 **Automatic Retry** - Exponential backoff with configurable retry logic (max 5 retries)
- 💾 **Response Caching** - Memory/Redis/Custom cache adapters with 5-minute TTL
- 🎯 **Request Deduplication** - Prevent duplicate concurrent requests automatically
- ⚡ **Priority Queue** - Request prioritization with configurable concurrency limits
- 🔒 **TypeScript First** - Full type safety with native generics support
- 🔌 **Interceptors** - Request/Response interceptor support
- 📊 **Request Tracking** - Metadata tracking with unique request IDs
- ⏱️ **Timeout Control** - Configurable timeouts with automatic abortion
- 🚀 **Static Methods** - Make requests without creating instances
- 🛑 **CancelManager** - Request cancellation with reasons and opt-in config
- 📡 **OfflineQueueManager** - Offline request queueing and retry when online
- 🪪 **TokenManager** - OAuth2/JWT/Bearer token management with pluggable storage

## 📦 Installation

```bash
npm install @0xshariq/voxa
# or
pnpm install @0xshariq/voxa
# or
yarn add @0xshariq/voxa
```

## 🚀 Usage

### Using Voxa with an Instance

Create a client instance to reuse configuration and features:

```typescript
import voxa from "@0xshariq/voxa";

const api = voxa.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  // ...other options
});

// Make requests
const response = await api.get("/users/1");
const user = await response.json();

// You can also use other HTTP methods:
await api.post("/users", { name: "John" });
await api.put("/users/1", { name: "Jane" });
await api.delete("/users/1");
```

### Using Voxa Without an Instance (Static Methods)

Call static methods directly for one-off requests:

```typescript
import { Voxa } from "@0xshariq/voxa";

const response = await Voxa.get("https://api.example.com/users/1");
const user = await response.json();

// Other static methods:
await Voxa.post("https://api.example.com/users", { name: "John" });
await Voxa.put("https://api.example.com/users/1", { name: "Jane" });
await Voxa.delete("https://api.example.com/users/1");
```

Use an instance for advanced features (caching, queueing, interceptors, etc.), or static methods for simple requests.

## 🚀 Quick Start

### Complete Instance Example

```typescript
import voxa from "@0xshariq/voxa";

const api = voxa.create({
  baseURL: "https://api.example.com", // string
  timeout: 5000, // number (ms)
  headers: {
    "Content-Type": "application/json", // string
    Authorization: "Bearer <token>", // string
  },
  retry: {
    count: 5, // number (max retries, always 5)
    delay: 1000, // number (ms, initial delay)
    exponentialBackoff: true, // boolean
    maxRetry: 10000, // number (ms, max delay)
    statusCodes: [429, 500, 502, 503, 504], // number[]
  },
  graphql: {
    enabled: true, // boolean
    endpoint: "https://graphqlzero.almansi.me/api", // string
    logErrors: true, // boolean
  },
  cache: {
    enabled: true, // boolean
    type: "memory", // 'memory' | 'redis' | 'custom'
    ttl: 300000, // number (ms)
    storage: "memory", // 'memory' | 'localStorage' | 'custom'
  },
  queue: {
    enabled: true, // boolean
    maxConcurrent: 5, // number
    strategy: "fifo", // 'fifo' | 'lifo' | 'priority'
  },
  interceptors: {
    request: [
      (config) => {
        /* modify config */ return config;
      },
    ],
    response: [
      (response) => {
        /* log/modify response */ return response;
      },
    ],
  },
  errors: {
    enabled: true, // boolean
    classify: (err) => "network", // function
  },
  cancel: {
    enabled: true, // boolean
  },
  offline: {
    enabled: true, // boolean
    storage: "localStorage", // 'localStorage' | 'indexedDB'
  },
  token: {
    enabled: true, // boolean
    type: "bearer", // 'bearer' | 'oauth2' | 'jwt'
    tokenEndpoint: "/auth/token", // string
    clientId: "client-id", // string
    clientSecret: "client-secret", // string
    refreshEndpoint: "/auth/refresh", // string
    storage: "memory", // 'memory' | 'localStorage'
    getToken: async () => "token", // function
    setToken: (token: string) => {}, // function
    refreshToken: async () => "new-token", // function
  },
  batch: {
    enabled: true, // boolean
    maxBatchSize: 10, // number
    interval: 1000, // number (ms)
  },
  metrics: {
    enabled: true, // boolean
    provider: "prometheus", // string
    endpoint: "/metrics", // string
  },
  schema: {
    enabled: true, // boolean
    validator: (data) => true, // function
  },
  rate: {
    enabled: true, // boolean
    maxRequests: 100, // number
    windowMs: 60000, // number (ms)
  },
  deduplication: {
    enabled: true, // boolean
    ttl: 300000, // number (ms)
  },
  circuitBreaker: {
    enabled: true, // boolean
    threshold: 5, // number
    timeout: 10000, // number (ms)
  },
  metadata: {
    enabled: true, // boolean
  },
});

// All options above are shown with possible values in comments.
// You can use only the options you need.
```

### TypeScript Generics

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Type-safe responses
const response = await api.get<User>("/users/1");
const user: User = await response.json();
```

## 📖 Documentation

### Core Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Configuration Guide](./docs/CONFIGURATION.md)** - Configuration options and environment variables
- **[Examples](./docs/EXAMPLES.md)** - Practical usage examples

### Advanced Features

- **[Advanced Features](./docs/ADVANCED.md)** - Caching, deduplication, queue management, interceptors
- **[Custom Cache Adapters](./docs/CUSTOM_CACHE.md)** - Implementing custom cache backends
- **[CLI Tool](./docs/CLI.md)** - Command-line interface (coming soon)

## 🎯 Key Features

### Automatic Retry with Exponential Backoff

```typescript
const api = voxa.create({
  baseURL: "https://api.example.com",
  retry: {
    count: 3, // Max 3 retries
    delay: 1000, // Initial delay: 1s
    exponentialBackoff: true, // 1s → 2s → 4s
    maxRetry: 10000, // Max delay: 10s
  },
});
```

### Response Caching

```typescript
// Memory cache (default)
const api = voxa.create({
  cache: {
    enabled: true,
    type: "memory",
    ttl: 300000, // 5 minutes
  },
});

// Redis cache
const api = voxa.create({
  cache: {
    enabled: true,
    type: "redis",
    ttl: 300000,
  },
});
```

### Request Prioritization

```typescript
// High priority request
await api.get("/critical-data", { priority: "critical" });

// Normal priority (default)
await api.get("/regular-data");

// Low priority
await api.get("/background-data", { priority: "low" });
```

### Request Interceptors

```typescript
// Add authentication header
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${getToken()}`,
  };
  return config;
});

// Log responses
api.interceptors.response.use((response) => {
  console.log("Response:", response.status);
  return response;
});
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Cache Configuration (Generic - works with any cache backend)
CACHE_URL=redis://localhost:6379
CACHE_PASSWORD=your-password
CACHE_HOST=localhost
CACHE_PORT=6379
CACHE_DB=0

# HTTP Configuration
HTTP_TIMEOUT=5000
HTTP_BASE_URL=https://api.example.com
```

See [Configuration Guide](./docs/CONFIGURATION.md) for detailed options.

## 📊 Monitoring & Statistics

```typescript
// Get cache statistics
const cacheStats = api.getCacheStats();
console.log(cacheStats); // { storage: 'memory', size: 10, entries: [...] }

// Get queue statistics
const queueStats = api.getQueueStats();
console.log(queueStats); // { queueSize: 2, activeRequests: 3, maxConcurrent: 5 }

// Get request metadata
const metadata = api.getRequestMetadata("request-id-123");
console.log(metadata); // { id, method, endpoint, duration, ... }
```

## 🧪 Testing

```bash
# Run test file directly
pnpm test

# Or using development mode
pnpm dev
```

## 📝 HTTP Methods

Voxa supports all standard HTTP methods:

```typescript
await api.get("/users");
await api.post("/users", { name: "John" });
await api.put("/users/1", { name: "Jane" });
await api.patch("/users/1", { email: "new@example.com" });
await api.delete("/users/1");
await api.head("/users");
await api.options("/users");
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Sharique Chaudhary](https://github.com/0xshariq)

## 🔗 Links

- [GitHub Repository](https://github.com/0xshariq/voxa)
- [npm Package](https://www.npmjs.com/package/@0xshariq/voxa)
- [Issue Tracker](https://github.com/0xshariq/voxa/issues)

## 🌟 Credits

Built with inspiration from Axios and modern web standards.

---

**Note:** This project is built on the native Fetch API and requires Node.js 18+ or a modern browser environment.
