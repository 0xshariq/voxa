# Custom Cache Adapters

Voxa supports **any caching platform** through custom cache adapters. While we provide built-in support for Redis, you can easily integrate other caching solutions.

## Table of Contents
- [Overview](#overview)
- [Cache Adapter Interface](#cache-adapter-interface)
- [Built-in Adapters](#built-in-adapters)
- [Custom Adapter Examples](#custom-adapter-examples)
- [Best Practices](#best-practices)

## Overview

## Cache Invalidation Hooks & HTTP Validation

### Invalidation Hooks/Events

Voxa allows you to listen for cache invalidation events and hook into cache lifecycle actions:

- `onCacheSet(key, value)`: Called when a value is set in the cache.
- `onCacheDelete(key)`: Called when a value is deleted from the cache.
- `onCacheClear()`: Called when the cache is cleared.

You can provide these hooks in your config:

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'memory',
        onCacheSet: (key, value) => { console.log('Set', key); },
        onCacheDelete: (key) => { console.log('Deleted', key); },
        onCacheClear: () => { console.log('Cache cleared'); }
    }
});
```

### ETag/If-None-Match HTTP Cache Validation

Voxa supports HTTP validation using ETag headers:

- If a cached response contains an `ETag`, Voxa will send `If-None-Match` on subsequent requests.
- If the server responds with `304 Not Modified`, Voxa will return the cached response instead of re-fetching.

This reduces bandwidth and ensures cache freshness. Enable this by default or set `cache.httpValidation: true` in your config.

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        httpValidation: true // enables ETag/If-None-Match support
    }
});
```

See [Advanced Features](./ADVANCED.md) for more details.

Voxa's caching system is completely **optional** and **platform-agnostic**:

✅ **Works without caching** - All features work perfectly without any cache  
✅ **Memory cache** - Built-in, no setup required  
✅ **Redis support** - First-party Redis integration  
✅ **Custom adapters** - Use any platform (Memcached, DynamoDB, MongoDB, etc.)

## Cache Adapter Interface

To use a custom cache platform, implement the `CacheAdapter` interface:

```typescript
interface CacheAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
```

## Built-in Adapters

### 1. Memory Cache (Default)

No configuration needed, works out of the box:

```typescript
import voxa from '@0xshariq/voxa';

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'memory',  // Default
        ttl: 300000         // 5 minutes
    }
});
```

### 2. Redis Cache

Built-in Redis support:

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'redis',
        ttl: 300000,
        redis: {
            host: 'localhost',
            port: 6379,
            password: 'your-password',
            db: 0
        }
    }
});
```

## Custom Adapter Examples

### Memcached Adapter

```typescript
import Memcached from 'memcached';
import voxa, { CacheAdapter } from '@0xshariq/voxa';

class MemcachedAdapter implements CacheAdapter {
    private client: Memcached;

    constructor(servers: string[]) {
        this.client = new Memcached(servers);
    }

    async get(key: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) reject(err);
                else resolve(data || null);
            });
        });
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, ttlSeconds, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async delete(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.flush((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

// Usage
const memcachedAdapter = new MemcachedAdapter(['localhost:11211']);

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'custom',
        adapter: memcachedAdapter,
        ttl: 300000
    }
});
```

### DynamoDB Adapter

```typescript
import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { CacheAdapter } from '@0xshariq/voxa';

class DynamoDBAdapter implements CacheAdapter {
    private client: DynamoDBClient;
    private tableName: string;

    constructor(tableName: string, region: string = 'us-east-1') {
        this.client = new DynamoDBClient({ region });
        this.tableName = tableName;
    }

    async get(key: string): Promise<string | null> {
        const command = new GetItemCommand({
            TableName: this.tableName,
            Key: { key: { S: key } }
        });

        const response = await this.client.send(command);
        
        if (!response.Item) return null;

        // Check if expired
        const ttl = parseInt(response.Item.ttl.N || '0');
        if (Date.now() / 1000 > ttl) {
            await this.delete(key);
            return null;
        }

        return response.Item.value.S || null;
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        const ttl = Math.floor(Date.now() / 1000) + ttlSeconds;

        const command = new PutItemCommand({
            TableName: this.tableName,
            Item: {
                key: { S: key },
                value: { S: value },
                ttl: { N: ttl.toString() }
            }
        });

        await this.client.send(command);
    }

    async delete(key: string): Promise<void> {
        const command = new DeleteItemCommand({
            TableName: this.tableName,
            Key: { key: { S: key } }
        });

        await this.client.send(command);
    }

    async clear(): Promise<void> {
        // DynamoDB doesn't have a clear all operation
        // You would need to scan and delete items
        console.warn('DynamoDB clear not implemented - requires scan + batch delete');
    }
}

// Usage
const dynamoAdapter = new DynamoDBAdapter('voxa-cache', 'us-east-1');

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'custom',
        adapter: dynamoAdapter,
        ttl: 300000
    }
});
```

### MongoDB Adapter

```typescript
import { MongoClient, Db } from 'mongodb';
import { CacheAdapter } from '@0xshariq/voxa';

class MongoDBAdapter implements CacheAdapter {
    private db: Db | null = null;
    private collectionName: string = 'voxa_cache';

    constructor(private uri: string, private dbName: string) {
        this.connect();
    }

    private async connect() {
        const client = await MongoClient.connect(this.uri);
        this.db = client.db(this.dbName);
        
        // Create TTL index for automatic expiration
        await this.db.collection(this.collectionName).createIndex(
            { expiresAt: 1 },
            { expireAfterSeconds: 0 }
        );
    }

    async get(key: string): Promise<string | null> {
        if (!this.db) await this.connect();

        const doc = await this.db!.collection(this.collectionName).findOne({ key });
        
        if (!doc) return null;
        if (new Date() > doc.expiresAt) {
            await this.delete(key);
            return null;
        }

        return doc.value;
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        if (!this.db) await this.connect();

        const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));

        await this.db!.collection(this.collectionName).updateOne(
            { key },
            { $set: { key, value, expiresAt } },
            { upsert: true }
        );
    }

    async delete(key: string): Promise<void> {
        if (!this.db) await this.connect();
        await this.db!.collection(this.collectionName).deleteOne({ key });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.connect();
        await this.db!.collection(this.collectionName).deleteMany({});
    }
}

// Usage
const mongoAdapter = new MongoDBAdapter(
    'mongodb://localhost:27017',
    'voxa_db'
);

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'custom',
        adapter: mongoAdapter,
        ttl: 300000
    }
});
```

### Upstash Redis Adapter

```typescript
import { Redis } from '@upstash/redis';
import { CacheAdapter } from '@0xshariq/voxa';

class UpstashAdapter implements CacheAdapter {
    private client: Redis;

    constructor(url: string, token: string) {
        this.client = new Redis({ url, token });
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.setex(key, ttlSeconds, value);
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async clear(): Promise<void> {
        await this.client.flushdb();
    }
}

// Usage
const upstashAdapter = new UpstashAdapter(
    process.env.UPSTASH_REDIS_REST_URL!,
    process.env.UPSTASH_REDIS_REST_TOKEN!
);

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'custom',
        adapter: upstashAdapter
    }
});
```

### LocalStorage Adapter (Browser)

```typescript
import { CacheAdapter } from '@0xshariq/voxa';

class LocalStorageAdapter implements CacheAdapter {
    private prefix: string = 'voxa_cache_';

    async get(key: string): Promise<string | null> {
        const item = localStorage.getItem(this.prefix + key);
        if (!item) return null;

        const { value, expiresAt } = JSON.parse(item);
        
        if (Date.now() > expiresAt) {
            await this.delete(key);
            return null;
        }

        return value;
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        localStorage.setItem(
            this.prefix + key,
            JSON.stringify({ value, expiresAt })
        );
    }

    async delete(key: string): Promise<void> {
        localStorage.removeItem(this.prefix + key);
    }

    async clear(): Promise<void> {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// Usage (Browser)
const localAdapter = new LocalStorageAdapter();

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'custom',
        adapter: localAdapter,
        ttl: 300000
    }
});
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully in your adapter:

```typescript
async get(key: string): Promise<string | null> {
    try {
        return await this.client.get(key);
    } catch (error) {
        console.error('Cache get error:', error);
        return null;  // Return null on error, don't throw
    }
}
```

### 2. Connection Management

Initialize connections in constructor or lazy-load:

```typescript
class MyAdapter implements CacheAdapter {
    private client: any = null;

    constructor(config: any) {
        this.initClient(config);
    }

    private async initClient(config: any) {
        try {
            this.client = await SomeClient.connect(config);
        } catch (error) {
            console.error('Failed to connect to cache:', error);
            // Adapter will return null for all operations
        }
    }
}
```

### 3. TTL Handling

Respect the TTL parameter:

```typescript
async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Convert to appropriate format for your platform
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    await this.client.set(key, value, { expiresAt });
}
```

### 4. Cleanup

Implement proper cleanup if needed:

```typescript
class MyAdapter implements CacheAdapter {
    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    }
}
```

## Testing Your Adapter

```typescript
import { describe, it, expect } from 'vitest';

describe('MyCustomAdapter', () => {
    const adapter = new MyCustomAdapter(config);

    it('should set and get values', async () => {
        await adapter.set('test-key', 'test-value', 60);
        const value = await adapter.get('test-key');
        expect(value).toBe('test-value');
    });

    it('should respect TTL', async () => {
        await adapter.set('ttl-key', 'ttl-value', 1);
        await new Promise(resolve => setTimeout(resolve, 1100));
        const value = await adapter.get('ttl-key');
        expect(value).toBeNull();
    });

    it('should delete values', async () => {
        await adapter.set('delete-key', 'delete-value', 60);
        await adapter.delete('delete-key');
        const value = await adapter.get('delete-key');
        expect(value).toBeNull();
    });
});
```

## Next Steps

- [Configuration Guide](./CONFIGURATION.md)
- [API Reference](./API.md)
- [Examples](./EXAMPLES.md)
