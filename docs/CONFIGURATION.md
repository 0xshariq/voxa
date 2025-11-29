# Voxa Configuration Guide

This guide explains how to configure Voxa HTTP Client using environment variables or programmatic configuration.

## Table of Contents
- [Environment Variables](#environment-variables)
- [Programmatic Configuration](#programmatic-configuration)
- [Redis Configuration](#redis-configuration)
- [Cache Configuration](#cache-configuration)
- [Queue Configuration](#queue-configuration)
- [Retry Configuration](#retry-configuration)

## Environment Variables

Voxa supports two approaches for managing credentials and configuration:

### 1. Project-Level Configuration (`.env` file)

**Use this when:** Using Voxa as a package in your application

Create a `.env` file in your project root (copy from `.env.example`):

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_STORAGE=redis

# Queue Configuration
QUEUE_ENABLED=true
QUEUE_MAX_CONCURRENT=6

# Retry Configuration
RETRY_COUNT=5
RETRY_DELAY=1000
RETRY_EXPONENTIAL_BACKOFF=true
```

**Installation:**
```bash
npm install dotenv
```

**Usage:**
```typescript
import 'dotenv/config';
import voxa from '@0xshariq/voxa';

const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'redis',
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        }
    }
});
```

### 2. Global Configuration (System Environment Variables)

**Use this when:** Using Voxa CLI globally across multiple projects

#### Linux/macOS (Bash/Zsh)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Voxa Configuration
export VOXA_REDIS_HOST="localhost"
export VOXA_REDIS_PORT="6379"
export VOXA_REDIS_PASSWORD="your-secure-password"
export VOXA_REDIS_DB="0"

# Optional: Default cache settings
export VOXA_CACHE_ENABLED="true"
export VOXA_CACHE_TTL="300000"
export VOXA_CACHE_STORAGE="redis"
```

Apply changes:
```bash
source ~/.bashrc  # or ~/.zshrc
```

#### Windows (PowerShell)

Add to PowerShell profile (`$PROFILE`):

```powershell
# Voxa Configuration
$env:VOXA_REDIS_HOST = "localhost"
$env:VOXA_REDIS_PORT = "6379"
$env:VOXA_REDIS_PASSWORD = "your-secure-password"
$env:VOXA_REDIS_DB = "0"
$env:VOXA_CACHE_ENABLED = "true"
$env:VOXA_CACHE_TTL = "300000"
$env:VOXA_CACHE_STORAGE = "redis"
```

Or use System Environment Variables (GUI):
1. Right-click **This PC** → **Properties**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Add new user variables with `VOXA_` prefix

#### Windows (Command Prompt)

```cmd
setx VOXA_REDIS_HOST "localhost"
setx VOXA_REDIS_PORT "6379"
setx VOXA_REDIS_PASSWORD "your-secure-password"
setx VOXA_REDIS_DB "0"
```

### Configuration Priority

When both are present, Voxa follows this priority order:

1. **Programmatic configuration** (highest priority)
2. **Project `.env` file**
3. **Global environment variables**
4. **Default values** (lowest priority)

Example:
```typescript
import voxa from '@0xshariq/voxa';

// This overrides all environment variables
const api = voxa.create({
    cache: {
        enabled: true,
        storage: 'redis',
        redis: {
            host: 'custom-redis.example.com',  // Overrides env vars
            port: 6380
        }
    }
});
```

## Using Environment Configuration

```typescript
import voxa from '@0xshariq/voxa';
import { ConfigLoader } from '@0xshariq/voxa/config';

// Load configuration from environment
const api = voxa.create(ConfigLoader.getDefaultConfig());
```

## Redis Configuration

### Using Environment Variables

```bash
REDIS_HOST=redis.example.com
REDIS_PORT=6380
REDIS_PASSWORD=your-password
REDIS_DB=1
```

### Programmatic Configuration

```typescript
const api = voxa.create({
    baseURL: 'https://api.example.com',
    cache: {
        enabled: true,
        storage: 'redis',
        redis: {
            host: 'redis.example.com',
            port: 6380,
            password: 'your-password',
            db: 1
        }
    }
});
```

### Redis Connection Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `'localhost'` | Redis server hostname |
| `port` | `number` | `6379` | Redis server port |
| `password` | `string` | `undefined` | Redis password (optional) |
| `db` | `number` | `0` | Redis database number |

## Cache Configuration

### Memory Cache

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        ttl: 300000,      // 5 minutes
        storage: 'memory'
    }
});
```

### Redis Cache

```typescript
const api = voxa.create({
    cache: {
        enabled: true,
        ttl: 300000,
        storage: 'redis',
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB)
        }
    }
});
```

### Cache Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable caching |
| `ttl` | `number` | `300000` | Time to live in milliseconds |
| `storage` | `'memory' \| 'redis'` | `'memory'` | Storage type |
| `redis` | `RedisConfig` | - | Redis configuration (if storage is 'redis') |

## Queue Configuration

```typescript
const api = voxa.create({
    queue: {
        enabled: true,
        maxConcurrent: 3  // Max 3 requests at once
    }
});
```

### Queue Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable request queue |
| `maxConcurrent` | `number` | `6` | Maximum concurrent requests |

## Retry Configuration

```typescript
const api = voxa.create({
    retry: {
        count: 5,                    // Max 5 retries
        delay: 1000,                 // Initial delay 1s
        exponentialBackoff: true,    // 1s → 2s → 4s → 8s → 16s
        statusCodes: [429, 500, 502, 503, 504]
    }
});
```

### Retry Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `count` | `number` | `5` | Maximum retry attempts (max: 5) |
| `delay` | `number` | `1000` | Initial delay in milliseconds |
| `exponentialBackoff` | `boolean` | `true` | Use exponential backoff |
| `statusCodes` | `number[]` | `[429, 500, 502, 503, 504]` | Status codes to retry on |
| `maxRetry` | `number` | `30000` | Maximum retry delay in ms |

## Complete Configuration Example

```typescript
import voxa from '@0xshariq/voxa';

const api = voxa.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Voxa/1.0'
    },
    cache: {
        enabled: true,
        ttl: 300000,
        storage: 'redis',
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0')
        }
    },
    queue: {
        enabled: true,
        maxConcurrent: 6
    },
    retry: {
        count: 5,
        delay: 1000,
        exponentialBackoff: true,
        statusCodes: [429, 500, 502, 503, 504]
    }
});
```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** for sensitive data like Redis passwords
3. **Rotate passwords regularly** for production Redis instances
4. **Use SSL/TLS** for Redis connections in production
5. **Limit Redis access** with firewall rules

## Next Steps

- [API Reference](./API.md)
- [Examples](./EXAMPLES.md)
- [Advanced Features](./ADVANCED.md)
