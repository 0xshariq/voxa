# Voxa Examples

Practical examples for using Voxa HTTP Client.

## Table of Contents
- [Basic Usage](#basic-usage)
- [TypeScript Generics](#typescript-generics)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Request Priority](#request-priority)
- [Caching](#caching)
- [Real-World Scenarios](#real-world-scenarios)

## Basic Usage

### Simple GET Request

```typescript
import voxa from '@0xshariq/voxa';

const api = voxa.create({
    baseURL: 'https://jsonplaceholder.typicode.com'
});

const response = await api.get('/posts/1');
const post = await response.json();
console.log(post);
```

### POST Request

```typescript
const response = await api.post('/posts', {
    title: 'New Post',
    body: 'Content here',
    userId: 1
});

const created = await response.json();
console.log('Created:', created);
```

## TypeScript Generics

### Define Response Types

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    username: string;
}

interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

// Type-safe requests
const userResponse = await api.get<User>('/users/1');
const user = await userResponse.json(); // TypeScript knows this is User

const postResponse = await api.post<Post>('/posts', {
    title: 'Test',
    body: 'Content',
    userId: user.id
});
const post = await postResponse.json(); // TypeScript knows this is Post
```

## Authentication

### Bearer Token

```typescript
const api = voxa.create({
    baseURL: 'https://api.example.com',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

// Or use interceptor for dynamic tokens
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return config;
});
```

### Refresh Token Pattern

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api.request(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await api.post('/auth/refresh', { refreshToken });
                const { accessToken } = await response.json();

                localStorage.setItem('token', accessToken);
                processQueue(null, accessToken);

                return api.request(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
```

## Error Handling

### Try-Catch Pattern

```typescript
try {
    const response = await api.get('/users/999');
    const user = await response.json();
} catch (error) {
    if (error.response) {
        // Server responded with error status
        console.error('Status:', error.response.status);
        console.error('Data:', await error.response.json());
    } else {
        // Network error or request timeout
        console.error('Network error:', error.message);
    }
}
```

### Response Status Checks

```typescript
const response = await api.get('/users/1');

if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}

const user = await response.json();
```

## Request Priority

### E-commerce Checkout Flow

```typescript
const api = voxa.create({
    baseURL: 'https://api.shop.com',
    queue: { enabled: true, maxConcurrent: 3 }
});

// Critical: Payment processing
const paymentPromise = api.post('/checkout/payment', paymentData, {
    priority: 'critical'
});

// High: Order creation
const orderPromise = api.post('/orders', orderData, {
    priority: 'high'
});

// Normal: Update cart
const cartPromise = api.put('/cart', cartData, {
    priority: 'normal'
});

// Low: Analytics tracking
const analyticsPromise = api.post('/analytics', eventData, {
    priority: 'low'
});

// Payment and order will be processed first
await Promise.all([paymentPromise, orderPromise, cartPromise, analyticsPromise]);
```

## Caching

### Product Catalog with Cache

```typescript
const api = voxa.create({
    baseURL: 'https://api.shop.com',
    cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        storage: 'memory'
    }
});

// First call - fetches from API
const products1 = await api.get('/products');

// Second call within 5 minutes - instant response from cache
const products2 = await api.get('/products');

// Check cache stats
console.log(api.getCacheStats());
```

### Redis Cache for Production

```typescript
const api = voxa.create({
    baseURL: 'https://api.example.com',
    cache: {
        enabled: true,
        ttl: 300000,
        storage: 'redis',
        redis: {
            host: process.env.REDIS_HOST,
            port: 6379,
            password: process.env.REDIS_PASSWORD
        }
    }
});
```

## Real-World Scenarios

### Blog API Client

```typescript
import voxa from '@0xshariq/voxa';

interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: string;
}

class BlogAPI {
    private api;

    constructor(baseURL: string, apiKey: string) {
        this.api = voxa.create({
            baseURL,
            headers: {
                'X-API-Key': apiKey
            },
            retry: {
                count: 3,
                delay: 1000,
                exponentialBackoff: true
            },
            cache: {
                enabled: true,
                ttl: 300000
            }
        });
    }

    async getPosts(): Promise<Post[]> {
        const response = await this.api.get<Post[]>('/posts');
        return response.json();
    }

    async getPost(id: number): Promise<Post> {
        const response = await this.api.get<Post>(`/posts/${id}`);
        return response.json();
    }

    async createPost(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
        const response = await this.api.post<Post>('/posts', post);
        return response.json();
    }

    async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
        const response = await this.api.patch<Post>(`/posts/${id}`, updates);
        return response.json();
    }

    async deletePost(id: number): Promise<void> {
        await this.api.delete(`/posts/${id}`);
    }
}

// Usage
const blog = new BlogAPI('https://api.myblog.com', 'your-api-key');
const posts = await blog.getPosts();
```

### File Upload with Progress

```typescript
const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        priority: 'high',
        timeout: 30000 // 30 seconds for large files
    });

    return response.json();
};
```

### Parallel Requests with Different Priorities

```typescript
const loadDashboard = async () => {
    const [userData, analytics, notifications, recommendations] = await Promise.all([
        // Critical: User data needed first
        api.get('/user/profile', { priority: 'critical' }),
        
        // High: Analytics data
        api.get('/analytics/summary', { priority: 'high' }),
        
        // Normal: Notifications
        api.get('/notifications', { priority: 'normal' }),
        
        // Low: Recommendations (nice to have)
        api.get('/recommendations', { priority: 'low' })
    ]);

    return {
        user: await userData.json(),
        analytics: await analytics.json(),
        notifications: await notifications.json(),
        recommendations: await recommendations.json()
    };
};
```

### Request Deduplication

```typescript
// Multiple components request the same data
const UserProfile = () => {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // This request will be deduplicated if called multiple times
        api.get('/user/profile').then(r => r.json()).then(setUser);
    }, []);
    
    return <div>{user?.name}</div>;
};

// Even if 10 components mount at once, only 1 API call is made
```

## Next Steps

- [API Reference](./API.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Advanced Features](./ADVANCED.md)
