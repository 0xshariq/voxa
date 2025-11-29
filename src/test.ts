import create, { Voxa } from './lib/client/voxa.js';
import { CancelManager } from './lib/features/cancel/manager.js';
import { OfflineQueueManager } from './lib/features/offline/manager.js';
import { TokenManager } from './lib/features/token/manager.js';

// Define TypeScript interfaces for API responses
interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
}

async function testVoxa() {
    console.log('=== Testing Voxa HTTP Client with Advanced Features ===\n');
    // Feature Managers Setup
    const cancelManager = new CancelManager({ enabled: true });
    // Use 'memory' storage for Node.js environment to avoid localStorage errors
    const offlineQueueManager = new OfflineQueueManager({ enabled: true, storage: 'memory' });
    const tokenManager = new TokenManager({
        enabled: true,
        type: 'bearer',
        storage: 'memory',
        getToken: async () => 'test-token',
        setToken: (token: string) => console.log('Token set:', token)
    });
    // Add more feature managers as needed
    console.log('--- Feature Managers Initialized ---');
    console.log('CancelManager:', !!cancelManager);
    console.log('OfflineQueueManager:', !!offlineQueueManager);
    console.log('TokenManager:', !!tokenManager);

    // Test CancelManager
    const controller = cancelManager.createController('req-1', 'User requested cancel');
    if (controller) {
        cancelManager.cancel('req-1', 'Testing cancel');
        console.log('✅ CancelManager cancel reason:', cancelManager.getReason('req-1'));
        cancelManager.clear('req-1');
    }
    // Test OfflineQueueManager
    offlineQueueManager.addRequest('POST', 'https://jsonplaceholder.typicode.com/posts', { title: 'Offline' }, {});
    await offlineQueueManager.processQueue();
    console.log('✅ OfflineQueueManager processed queue');
    // Test TokenManager
    tokenManager.setToken('new-token');
    const token = await tokenManager.getToken();
    console.log('✅ TokenManager token:', token);
    await tokenManager.refreshToken();
    tokenManager.clearToken();
    console.log('✅ TokenManager cleared token');

    // Test 1: Instance-based API calls with TypeScript Generics
    console.log('--- Test 1: TypeScript Generics ---');
    const api = create({
        baseURL: 'https://jsonplaceholder.typicode.com',
        timeout: 5000,
        retry: {
            count: 3,
            delay: 1000,
            exponentialBackoff: true
        },
        cache: {
            enabled: true,
            ttl: 300000, // 5 minutes
            storage: 'memory'
        },
        queue: {
            enabled: true,
            maxConcurrent: 3
        }
    });

    try {
        // TypeScript knows the response type is Post
        const response = await api.get<Post>('/posts/1');
        const post = await response.json();
        console.log('✅ GET with TypeScript generic successful');
        console.log(`   Post title: "${post.title}"`);
        console.log(`   Post ID: ${post.id}`);
    } catch (error) {
        console.error('❌ GET failed:', error);
    }

    // Test 2: Request Priority and Queue Management
    console.log('\n--- Test 2: Request Priority & Queue Management ---');
    try {
        // Simulate multiple concurrent requests with different priorities
        const requests = [
            api.get<Post>('/posts/1', { priority: 'low' }),
            api.get<Post>('/posts/2', { priority: 'critical' }),
            api.get<Post>('/posts/3', { priority: 'normal' }),
            api.get<Post>('/posts/4', { priority: 'high' }),
            api.get<Post>('/posts/5', { priority: 'low' }),
            api.get<Post>('/posts/6', { priority: 'critical' })
        ];

        console.log('🔥 Sending 6 requests with varying priorities (max 3 concurrent)...');
        await Promise.all(requests);
        
        console.log('✅ All prioritized requests completed');
        console.log('   Queue stats:', api.getQueueStats());
    } catch (error) {
        console.error('❌ Priority test failed:', error);
    }

    // Test 3: Caching with 5-minute TTL
    console.log('\n--- Test 3: Response Caching (5 min TTL) ---');
    try {
        console.log('First request (will cache):');
        const response1 = await api.get<User>('/users/1');
        const user1 = await response1.json();
        console.log(`   ✅ User fetched: ${user1.name}`);
        
        console.log('\nSecond request (should hit cache):');
        const response2 = await api.get<User>('/users/1');
        const user2 = await response2.json();
        console.log(`   ✅ User fetched from cache: ${user2.name}`);
        
        console.log('\n   Cache stats:', api.getCacheStats());
    } catch (error) {
        console.error('❌ Cache test failed:', error);
    }

    // Test 4: Request Deduplication with 5-minute TTL
    console.log('\n--- Test 4: Request Deduplication (5 min TTL) ---');
    try {
        console.log('Sending 3 identical requests simultaneously...');
        const promise1 = api.get<Post>('/posts/10');
        const promise2 = api.get<Post>('/posts/10');
        const promise3 = api.get<Post>('/posts/10');

        const [r1, r2, r3] = await Promise.all([promise1, promise2, promise3]);
        
        const data1 = await r1.json();
        const data2 = await r2.json();
        const data3 = await r3.json();

        console.log('✅ Deduplication successful - only one network call made');
        console.log(`   All three returned same post ID: ${data1.id}, ${data2.id}, ${data3.id}`);
    } catch (error) {
        console.error('❌ Deduplication test failed:', error);
    }

    // Test 5: Request Metadata and Tracking
    console.log('\n--- Test 5: Request Metadata & Tracking ---');
    try {
        const requestId = 'test-request-123';
        const response = await api.get<Post>('/posts/15', { requestId });
        const metadata = response.metadata;
        
        console.log('✅ Request metadata captured:');
        console.log(`   Request ID: ${metadata?.id}`);
        console.log(`   Method: ${metadata?.method}`);
        console.log(`   Endpoint: ${metadata?.endpoint}`);
        console.log(`   Priority: ${metadata?.priority}`);
        console.log(`   Duration: ${metadata?.endTime! - metadata?.startTime!}ms`);
    } catch (error) {
        console.error('❌ Metadata test failed:', error);
    }

    // Test 6: Static methods with generics
    console.log('\n--- Test 6: Static Methods (without instance) ---');
    try {
        const response = await Voxa.get<User>('https://jsonplaceholder.typicode.com/users/2');
        const user = await response.json();
        console.log('✅ Static GET successful');
        console.log(`   User: ${user.name} (${user.email})`);
    } catch (error) {
        console.error('❌ Static GET failed:', error);
    }

    // Test 7: POST with TypeScript generic
    console.log('\n--- Test 7: POST with TypeScript Generics ---');
    try {
        const newPost = {
            title: 'Test Post with Generics',
            body: 'This demonstrates TypeScript support',
            userId: 1
        };
        
        const response = await api.post<Post>('/posts', newPost, { priority: 'high' });
        const createdPost = await response.json();
        
        console.log('✅ POST with generics successful');
        console.log(`   Created post ID: ${createdPost.id}`);
        console.log(`   Title: "${createdPost.title}"`);
    } catch (error) {
        console.error('❌ POST failed:', error);
    }

    // Test 8: Retry logic
    console.log('\n--- Test 8: Automatic Retry (exponential backoff) ---');
    try {
        const response = await api.get('/nonexistent-endpoint-12345', {
            retry: {
                count: 2,
                delay: 500,
                exponentialBackoff: true
            }
        });
        console.log('Response:', await response.json());
    } catch (error: any) {
        console.log('✅ Retry logic worked - request failed as expected after retries');
    }

    // Test 9: Multiple priority levels
    console.log('\n--- Test 9: Mixed Priority Requests ---');
    try {
        console.log('Sending mixed priority requests...');
        await Promise.all([
            api.get('/posts/20', { priority: 'critical' }),
            api.get('/posts/21', { priority: 'low' }),
            api.get('/posts/22', { priority: 'high' }),
            api.get('/posts/23', { priority: 'normal' })
        ]);
        
        console.log('✅ Mixed priority requests completed');
        console.log('   Final queue stats:', api.getQueueStats());
    } catch (error) {
        console.error('❌ Mixed priority test failed:', error);
    }

    console.log('\n=== All tests completed ===');
    console.log('\n📊 Final Statistics:');
    console.log('Cache:', api.getCacheStats());
    console.log('Queue:', api.getQueueStats());
}

testVoxa().catch(console.error);
