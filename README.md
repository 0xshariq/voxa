<h1 align="center">Voxa HTTP Client</h1>

<p align="center">
  <em>Modern, feature-rich HTTP client for Node.js and browsers, built on the native Fetch API. Modular architecture with separate feature packages for optimal bundle size.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@voxa-http/voxa-core"><img src="https://img.shields.io/npm/v/@voxa-http/voxa-core.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

## 📊 Why Voxa?

Voxa isn't just another HTTP client—it's a **complete request management system** with a **modular architecture**. Install only the features you need, keeping your bundle size minimal while having access to advanced capabilities that Axios, Fetch, and other popular clients simply don't have.

### 🎯 Modular Design

Voxa is split into multiple packages:

- **@voxa-http/voxa** (~140KB) - Essential HTTP client with caching, retry, queue, rate limiting, and deduplication
- **@voxa-http/voxa-streaming-images** - Image streaming with progress tracking
- **@voxa-http/voxa-streaming-videos** - Video streaming with progress tracking
- **@voxa-http/voxa-http2** - HTTP/2 Server Push support
- **@voxa-http/voxa-graphql** - GraphQL query support
- **@voxa-http/voxa-batch** - Request batching
- **@voxa-http/voxa-offline** - Offline queue management
- **@voxa-http/voxa-circuit-breaker** - Circuit breaker pattern
- **@voxa-http/voxa-token** - OAuth/JWT token management
- **@voxa-http/voxa-metrics** - Performance metrics tracking
- **@voxa-http/voxa-cancel** - Advanced request cancellation

---

## Future Plans

- Voxa CLI (Under Development)
- Voxa API (Private API only for trusted users and organizations) (Done)
- Voxa SDKs (Go,Rust,Python and Ruby) (Not Planned Yet)

---

## Feature Comparison

| Feature                           |    Voxa     |  Axios   |  Fetch   |    ky    |     Got     | node-fetch |
| --------------------------------- | :---------: | :------: | :------: | :------: | :---------: | :--------: |
| **Bundle Size (Minified)**        |    21 KB    | 32.1 KB  |   0KB    | 14.6 KB  |   180 KB    |   18 KB    |
| **Bundle Size (Gzipped)**         |   5.8 KB    | 12.1 KB  |   0KB    |  4.8 KB  |    52 KB    |   6.5 KB   |
| **Dependencies**                  |      0      |    4     |    0     |    0     |     15      |     0      |
| **Modular Architecture**          |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **TypeScript First**              |     ✅      |    ✅    |    ✅    |    ✅    |     ✅      |     ⚠️     |
| **Browser + Node.js**             |     ✅      |    ✅    |    ✅    |    ✅    |     ❌      |     ❌     |
| **Automatic Retry**               |     ✅      |    ❌    |    ❌    |    ✅    |     ✅      |     ❌     |
| **Response Caching**              | ✅ Advanced |    ❌    |    ❌    | ✅ Basic | ✅ Advanced |     ❌     |
| **Request Deduplication**         |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Priority Queue**                |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Batch Requests**                |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Token Management**              | ✅ Advanced |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Offline Queue**                 |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **GraphQL Support**               |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Streaming Progress**            | ✅ Advanced | ✅ Basic | ✅ Basic |    ✅    |     ✅      |     ✅     |
| **Request/Response Interceptors** |     ✅      |    ✅    |    ❌    |    ✅    |     ✅      |     ❌     |
| **Circuit Breaker**               |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Rate Limiting**                 |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **SSRF Protection**               |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Debug Mode**                    |     ✅      |    ⚠️    |    ❌    |    ⚠️    |     ✅      |     ❌     |
| **Cancel Requests**               |     ✅      |    ✅    |    ✅    |    ✅    |     ✅      |     ✅     |
| **Schema Validation**             |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |
| **Error Classification**          |     ✅      |    ⚠️    |    ❌    |    ⚠️    |     ✅      |     ❌     |
| **Metadata Tracking**             |     ✅      |    ❌    |    ❌    |    ❌    |     ❌      |     ❌     |

---

## ✨ Core Features (in @voxa-http/voxa)

- 🔄 **Automatic Retry** (exponential backoff)
- 💾 **Response Caching** (memory/file/custom)
- 🎯 **Request Deduplication**
- ⚡ **Priority Queue**
- 🔒 **TypeScript First**
- 🔌 **Interceptors**
- 📊 **Request Tracking & Metadata**
- ⏱️ **Timeout Control**
- 🚀 **Static Methods**
- 📡 **Schema Validation**
- 🔐 **SSRF Protection**
- 🐛 **Debug Mode**
- 🧪 **Automatic JSON Parsing**
- ⚖️ **Rate Limiting**

## 🎁 Optional Feature Packages

Install only what you need:

- 📹 **@voxa-http/voxa-streaming-images** - Image upload/download with progress
- 🎬 **@voxa-http/voxa-streaming-videos** - Video upload/download with progress
- ⚡ **@voxa-http/voxa-http2** - HTTP/2 Server Push
- 🔍 **@voxa-http/voxa-graphql** - GraphQL queries
- 📦 **@voxa-http/voxa-batch** - Request batching
- 📴 **@voxa-http/voxa-offline** - Offline queue
- 🔌 **@voxa-http/voxa-circuit-breaker** - Circuit breaker pattern
- 🎫 **@voxa-http/voxa-token** - OAuth/JWT token management
- 📊 **@voxa-http/voxa-metrics** - Performance metrics
- 🛑 **@voxa-http/voxa-cancel** - Advanced cancellation

---

## 📦 Installation

### Core Package (Required)

```bash
npm install @voxa-http/voxa
# or
pnpm install @voxa-http/voxa
# or
yarn add @voxa-http/voxa
```

### Feature Packages (Optional)

```bash
# Install only the features you need
npm install @voxa-http/voxa-graphql @voxa-http/voxa-streaming-images
```

---

## 🚀 Quick Start

### Basic Usage (Core Only)

```typescript
import { Voxa } from "@voxa-http/voxa";

const client = new Voxa({
  baseURL: "https://api.example.com",
  timeout: 5000,
  cache: {
    enabled: true,
    ttl: 60000,
  },
  retry: {
    enabled: true,
    count: 3,
  },
});

const response = await client.get("/users");
console.log(response.data);
```

### With Feature Packages

```typescript
import { Voxa } from "@voxa-http/voxa";
import "@voxa-http/voxa-graphql"; // Types auto-merge
import "@voxa-http/voxa-batch";
import { StreamingImageManager } from "@voxa-http/voxa-streaming-images";

const client = new Voxa({
  baseURL: "https://api.example.com",
  graphql: {
    // TypeScript knows about this!
    enabled: true,
    endpoint: "/graphql",
  },
  batch: {
    enabled: true,
    wait: 100,
  },
});

// Use streaming
const imageManager = new StreamingImageManager();
await imageManager.upload("/upload", imageFile, {}, (sent, total) => {
  console.log(`Progress: ${((sent / total) * 100).toFixed(2)}%`);
});
```

---

### Complete Instance Example

```typescript
import { Voxa } from "@voxa-http/voxa";

const api = new Voxa({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json", // string
    Authorization: "Bearer <token>", // string
  },
  priority: "high", // 'critical' | 'high' | 'normal' | 'low'
  retry: {
    enabled: true, // boolean (default: true)
    count: 5, // number (max: 5)
    delay: 1000, // number (ms)
    exponentialBackoff: true, // boolean
    maxRetry: 10000, // number (ms)
    statusCodes: [429, 500, 502, 503, 504], // number[]
  },
  deduplication: {
    enabled: true, // boolean (default: true)
    ttl: 300000, // number (ms)
  },
  cache: {
    enabled: true, // boolean (default: true)
    ttl: 300000, // number (ms, default: 5 min)
    storage: "memory", // 'memory' | 'custom'
    adapter: undefined, // custom cache adapter (optional)
  },
  queue: {
    enabled: true, // boolean
    maxConcurrent: 5, // number
  },
  batch: {
    enabled: true, // boolean
    endpoint: "/batch", // string (optional)
    wait: 100, // number (ms, optional)
    maxBatchSize: 10, // number (optional)
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
  // Token refresh failure hook
  onTokenRefreshFailure: (error, context) => {
    // Custom logic: log, alert, or trigger re-authentication
    console.error("Token refresh failed:", error, context);
    // Optionally, redirect user or clear session
  },

  // Multi-tenant/multi-user support example
  getToken: async (userId) => {
    // Fetch token for a specific user/tenant
    return await fetchTokenForUser(userId);
  },
  setToken: (token, userId) => {
    // Store token for a specific user/tenant
    saveTokenForUser(token, userId);
  },
  refreshToken: async (userId) => {
    // Refresh token for a specific user/tenant
    return await refreshUserToken(userId);
  },

  // Usage:
  // await api.get('/resource', { userId: 'user-42' });
  offline: {
    enabled: true, // boolean (default: true)
    storage: "localStorage", // 'localStorage' | 'indexedDB'
  },
  circuitBreaker: {
    enabled: true, // boolean
    threshold: 5, // number
    timeout: 10000, // number (ms)
    onOpen: () => {}, // function (optional)
  },
  metrics: {
    enabled: true, // boolean
  },
  errors: {
    enabled: true, // boolean (default: true)
  },
  rate: {
    enabled: true, // boolean (default: true)
    maxRequests: 100, // number
    perMilliseconds: 60000, // number (ms)
  },
  schema: {
    enabled: true, // boolean
    requestSchema: undefined, // any (optional)
    responseSchema: undefined, // any (optional)
    library: "zod", // 'zod' | 'yup' (optional)
  },
  cancel: {
    enabled: true, // boolean (default: true)
  },
  graphql: {
    enabled: true, // boolean
    endpoint: "https://graphqlzero.almansi.me/api", // string
    logErrors: true, // boolean
    headers: undefined, // Record<string, string> (optional)
    timeout: undefined, // number (optional)
    cache: undefined, // boolean (optional)
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
  metadata: {
    enabled: true, // boolean (default: true)
    log: true, // boolean (log metadata events)
    fields: [
      "id",
      "method",
      "endpoint",
      "priority",
      "timestamp",
      "startTime",
      "endTime",
    ], // string[] (fields to track)
    maxEntries: 100, // number (max entries to keep)
    customHandler: (meta) => {}, // function (custom handler)
  },
});
```

---

## 🚀 Usage

### 🧩 Feature Modularity & Extensibility

Voxa's features (cache, retry, queue, batch, deduplication, interceptors, etc.) are fully modular and can be enabled, disabled, or extended at runtime.

---

### Enabling/Disabling Features at Runtime

You can toggle features on/off by updating the instance configuration:

```typescript
// Disable cache and queue at runtime
api.updateConfig({
  cache: { enabled: false },
  queue: { enabled: false },
});

// Enable retry and set new retry count
api.updateConfig({
  retry: { enabled: true, count: 10 },
});
```

> **Note:** Not all features support dynamic reconfiguration in-flight. For critical changes, create a new instance with the desired config.

---

### Extending with Plugins (Custom Features)

You can add your own features or override built-in ones by attaching custom managers or hooks:

```typescript
// Example: Add a custom logging plugin
api.usePlugin({
  onRequest(config) {
    console.log("Request:", config.url);
    return config;
  },
  onResponse(response) {
    console.log("Response:", response.status);
    return response;
  },
});
```

---

#### Plugin Interface

A plugin is an object with any of these hooks:

- `onRequest(config)`
- `onResponse(response)`
- `onError(error)`
- `onBatch(batch)`
- `onCacheEvent(event)`

You can register multiple plugins. They are called in the order added.

---

#### Disabling a Feature for a Single Request

```typescript
// Disable cache for a single request
await api.get('/users', { cache: { enabled: false } });

// Set custom queue priority for a single request
await api.post('/orders', { ... }, { priority: 'critical' });
```

See [Advanced Features](./docs/ADVANCED.md) for more on feature modularity and plugins.

---

### Using Voxa with an Instance

### Injecting Custom requestId & Metadata

RequestId will generate automatically and will use in features (like retry,batching,etc..):

```typescript
// Provide a custom requestId and metadata for tracing
const response = await api.get("/users/1", {
  requestId: "trace-abc-123", // requestid will generate per request
  metadata: {
    traceId: "trace-abc-123",
    userId: "user-42",
    customField: "my-value",
  },
});
console.log(response.metadata); // includes your custom fields
```

> **Note:** The `requestId` generates automatically and use in all features.

Create a client instance to reuse configuration and advanced features:

```typescript
import voxa from "@voxa-http/voxa";

const api = voxa.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  // ...other options
});

// Make requests (response is always parsed JSON)
const response = await api.get<User>("/users/1");
console.log(response.data); // { id, name, ... }

// You can also use other HTTP methods:
await api.post("/users", { name: "John" });
await api.put("/users/1", { name: "Jane" });
await api.delete("/users/1");
```

---

### Using Voxa Without an Instance (Static Methods)

Call static methods directly for one-off requests:

```typescript
import { Voxa } from "@voxa-http/voxa";

const response = await Voxa.get<User>("https://api.example.com/users/1");
console.log(response.data);

// Other static methods:
await Voxa.post("https://api.example.com/users", { name: "John" });
await Voxa.put("https://api.example.com/users/1", { name: "Jane" });
await Voxa.delete("https://api.example.com/users/1");
```

Use an instance for advanced features (caching, queueing, interceptors, GraphQL, etc.), or static methods for simple requests.

---

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

---

### Streaming Upload/Download

```typescript
import { StreamingImageManager, StreamingVideoManager } from "@voxa-http/voxa";

// Upload image with progress tracking
const streamingImages = new StreamingImageManager({});

const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await streamingImages.upload(
  "https://api.example.com/images/upload",
  file,
  { "Content-Type": "image/jpeg" },
  (sentBytes, totalBytes) => {
    const percentage = (sentBytes / totalBytes) * 100;
    console.log(`Upload progress: ${percentage.toFixed(2)}%`);
  },
);

// Download video with progress
const streamingVideos = new StreamingVideoManager({});

const response = await streamingVideos.download(
  "https://api.example.com/videos/12345",
  {},
  (receivedBytes, totalBytes) => {
    console.log(`Downloaded: ${receivedBytes}/${totalBytes} bytes`);
  },
);

const blob = await response.blob();
const videoUrl = URL.createObjectURL(blob);
```

See [Streaming Guide](./docs/STREAMING.md) for complete examples and advanced usage.

---

## 📖 Documentation

### Core Documentation

**Documentation:**

- [Configuration Guide](./docs/CONFIGURATION.md) — All config options.
- [Advanced Features](./docs/ADVANCED.md) — Caching, deduplication, queueing, interceptors, GraphQL, etc.
- [Streaming Guide](./docs/STREAMING.md) — Image/video upload/download with progress tracking.
- [Developer Experience](./docs/DEVELOPER_EXPERIENCE.md) — Debug mode, logging, public getters, type safety.
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — Common issues and solutions.
- [Custom Cache](./docs/CUSTOM_CACHE.md) — Custom cache implementation.
- [Batch Usage](./docs/BATCH_USAGE.md) — Batch request patterns.
- [Examples](./docs/EXAMPLES.md) — Usage patterns and code samples.
- [Migration](./docs/MIGRATION.md) - Migration from axios to voxa.

See docs/ for full details and up-to-date usage.

---

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

---

### Response Structure

```typescript
{
  response: Response, // Http Response object
  data: {}, // Api Data will store here
  metadata: {
    id: "string", // requestId used everywhere
    method: "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'",
    endpoint: "string",
    priority: "'critical' | 'high' | 'normal' | 'low'",
    timestamp: 2000,
    startTime: 2000,
    endTime: 2000
  },
  requestId: string, // Unique requestId, used in all features (queue, batch, cache, metrics, etc.)
  status: 200,
  statusText: "Ok"
}
```

See [Response Structure](./src/lib/types/client-types.ts) for detailed info.

---

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

---

### Request Prioritization

```typescript
// High priority request
await api.get("/critical-data", { priority: "critical" });

// Normal priority (default)
await api.get("/regular-data");

// Low priority
await api.get("/background-data", { priority: "low" });
```

---

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

---

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

---

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

---

## Request ID Format and Expiry

Each request is assigned a unique `requestId` for tracking and feature management. The format is:

```
<timestamp>-<expiry>-<random>
```

- `timestamp`: When the request was created
- `expiry`: When the requestId expires (used for cache/batch conflict avoidance)
- `random`: Random string for uniqueness

- **Cache feature** uses a 5 minute expiry (default).
- **Batch feature** uses a 15 minute expiry.

This prevents conflicts when the same request is sent at different times. Always use the generated requestId for all features (cache, batch, queue, etc.).

---

## Error Classification & Debugging

Voxa now provides detailed error classification and debugging messages for every request. Use `api.classifyError(error)` to get both the error category and a helpful message for easier troubleshooting.

---

### Feature Manager Access

All feature managers (cache, queue, deduplication, metadata, circuit breaker, batch, rate limiter, metrics, schema, error classifier) are accessible via public methods or stats getters:

- `api.getCacheStats()`
- `api.getQueueStats()`
- `api.getDeduplicationStats()`
- `api.getMetadataStats()`
- `api.circuitBreaker()`
- `api.batch()`
- `api.rate()`
- `api.metrics()`
- `api.schema()`
- `api.classifyError(error)`

---

## 🧪 Testing

```bash
# Run test file directly
pnpm test

# Or using development mode
pnpm dev
```

---

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

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See the [Contributing Guide](./CONTRIBUTING.md)

---

## 📄 License

MIT © [Sharique Chaudhary](https://github.com/0xshariq)

---

## 🔗 Links

- [GitHub Repository](https://github.com/0xshariq/voxa)
- [npm Package](https://www.npmjs.com/package/@voxa-http/voxa)
- [Issue Tracker](https://github.com/0xshariq/voxa/issues)

---

**Note:** This project is built on the native Fetch API and requires Node.js 18+ or a modern browser environment.
