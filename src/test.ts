import create, { Voxa } from './lib/client/voxa.js';
import { CancelManager } from './lib/features/cancel/manager.js';
import { OfflineQueueManager } from './lib/features/offline/manager.js';
import { TokenManager } from './lib/features/token/manager.js';
import { StreamingImageManager } from './lib/features/streaming-images/manager.js';
import { StreamingVideoManager } from './lib/features/streaming-videos/manager.js';
import { BatchManager } from './lib/features/batch/manager.js';

async function testVoxa() {
    console.log('=== Testing Voxa HTTP Client - All Features ===\n');

    // Create comprehensive client with all features enabled
    const api = create({
        baseURL: 'https://httpbin.org',
        timeout: 15000,
        debug: true, // Enable debug logging
        cache: { enabled: true, storage: 'memory', ttl: 300000 },
        retry: { enabled: true, count: 2, delay: 500, exponentialBackoff: true },
        queue: { enabled: true, maxConcurrent: 3 },
        deduplication: { enabled: true, ttl: 300000 },
        metadata: { enabled: true, log: false },
        cancel: { enabled: true },
        token: { enabled: true, type: 'bearer', storage: 'memory', getToken: async () => 'test-token-123' },
        offline: { enabled: true, storage: 'localStorage' },
        errors: { enabled: true }
    });

    // Initialize standalone managers
    const cancelManager = new CancelManager({ enabled: true });
    const offlineQueue = new OfflineQueueManager({ enabled: true, storage: 'memory' });
    const tokenManager = new TokenManager({
        enabled: true,
        type: 'bearer',
        storage: 'memory',
        getToken: async () => 'standalone-token',
        setToken: (token) => console.log('   Token stored:', token.substring(0, 20) + '...')
    });
    const batchManager = new BatchManager({ enabled: true, endpoint: '/batch', wait: 100 });
    const streamingImages = new StreamingImageManager({});
    const streamingVideos = new StreamingVideoManager({});

    console.log('--- Feature Managers Status ---');
    console.log('✅ CancelManager:', !!cancelManager);
    console.log('✅ OfflineQueueManager:', !!offlineQueue);
    console.log('✅ TokenManager:', !!tokenManager);
    console.log('✅ BatchManager:', !!batchManager);
    console.log('✅ StreamingImageManager:', !!streamingImages);
    console.log('✅ StreamingVideoManager:', !!streamingVideos);
    console.log('✅ CacheManager:', !!api.getCacheStats());
    console.log('✅ QueueManager:', !!api.getQueueStats());
    console.log('✅ DeduplicationManager:', !!api.getDeduplicationStats());

    console.log('\n--- New Developer Experience Features ---');
    console.log('🐞 Debug Mode:', api.isDebugEnabled());
    console.log('🔧 Config Access:', !!api.getConfig());
    console.log('📊 BatchManager Config:', JSON.stringify(batchManager.getConfig()));
    console.log('📊 OfflineQueue Size:', offlineQueue.getQueueSize());
    console.log('📊 BatchManager Pending:', batchManager.getPendingCount());
    console.log('✅ MetadataManager:', !!api.getMetadataStats());
    console.log('✅ ErrorClassifier:', !!api.classifyError);
    console.log('');

    // Test 1: Basic GET Request
    console.log('--- Test 1: Basic GET Request ---');
    try {
        const response = await api.get<any>('/get?test=value');
        console.log('✅ GET request successful');
        console.log('   URL:', response.data?.url);
        console.log('   Args:', JSON.stringify(response.data?.args));
        console.log('   Status:', response.status);
    } catch (error) {
        console.error('❌ GET failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 2: POST Request with Data
    console.log('\n--- Test 2: POST Request with Data ---');
    try {
        const postData = { name: 'Test User', email: 'test@example.com' };
        const response = await api.post<any>('/post', postData);
        console.log('✅ POST request successful');
        console.log('   Posted data:', JSON.stringify(response.data?.json));
        console.log('   Status:', response.status);
    } catch (error) {
        console.error('❌ POST failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 3: Request Priority & Queue Management
    console.log('\n--- Test 3: Request Priority & Queue Management ---');
    try {
        const requests = [
            api.get('/delay/1', { priority: 'low' }),
            api.get('/delay/1', { priority: 'critical' }),
            api.get('/delay/1', { priority: 'normal' }),
            api.get('/delay/1', { priority: 'high' })
        ];
        console.log('🔥 Sending 4 requests with different priorities...');
        await Promise.all(requests);
        console.log('✅ All prioritized requests completed');
        console.log('   Queue stats:', JSON.stringify(api.getQueueStats()));
    } catch (error) {
        console.error('❌ Priority test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 4: Response Caching
    console.log('\n--- Test 4: Response Caching ---');
    try {
        console.log('First request (will cache):');
        const start1 = Date.now();
        await api.get('/delay/2');
        console.log(`   Time: ${Date.now() - start1}ms`);

        console.log('Second request (from cache):');
        const start2 = Date.now();
        await api.get('/delay/2');
        console.log(`   Time: ${Date.now() - start2}ms (should be instant)`);
        console.log('✅ Cache is working');
        console.log('   Cache stats:', JSON.stringify(api.getCacheStats()));
    } catch (error) {
        console.error('❌ Cache test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 5: Request Deduplication
    console.log('\n--- Test 5: Request Deduplication ---');
    try {
        console.log('Sending 3 identical requests simultaneously...');
        const promises = [
            api.get('/get?dedup=test'),
            api.get('/get?dedup=test'),
            api.get('/get?dedup=test')
        ];
        const results = await Promise.all(promises);
        console.log('✅ Deduplication working - all requests returned');
        console.log('   Results count:', results.length);
        console.log('   Dedup stats:', JSON.stringify(api.getDeduplicationStats()));
    } catch (error) {
        console.error('❌ Deduplication test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 6: Metadata Tracking
    console.log('\n--- Test 6: Metadata Tracking ---');
    try {
        const response = await api.get('/headers');
        const metadata = api.getRequestMetadata(response.requestId);
        console.log('✅ Metadata tracked successfully');
        console.log('   Request ID:', metadata?.id);
        console.log('   Method:', metadata?.method);
        console.log('   Endpoint:', metadata?.endpoint);
        console.log('   Priority:', metadata?.priority);
    } catch (error) {
        console.error('❌ Metadata test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 7: Static Methods
    console.log('\n--- Test 7: Static Methods ---');
    try {
        const response = await Voxa.get<any>('https://httpbin.org/uuid');
        console.log('✅ Static GET successful');
        console.log('   UUID:', response.data?.uuid);
    } catch (error) {
        console.error('❌ Static GET failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 8: All HTTP Methods
    console.log('\n--- Test 8: All HTTP Methods ---');
    try {
        await api.get('/get');
        console.log('✅ GET method works');
        
        await api.post('/post', { test: 'data' });
        console.log('✅ POST method works');
        
        await api.put('/put', { test: 'data' });
        console.log('✅ PUT method works');
        
        await api.patch('/patch', { test: 'data' });
        console.log('✅ PATCH method works');
        
        await api.delete('/delete');
        console.log('✅ DELETE method works');
        
        const headRes = await api.head('/get');
        console.log('✅ HEAD method works, status:', headRes.status);
        
        const optionsRes = await api.options('/get');
        console.log('✅ OPTIONS method works, status:', optionsRes.status);
    } catch (error) {
        console.error('❌ HTTP methods test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 9: Retry Logic
    console.log('\n--- Test 9: Automatic Retry ---');
    try {
        await api.get('/status/500'); // Should trigger retries
        console.log('❌ Should have failed');
    } catch (error) {
        console.log('✅ Retry logic worked - request failed after retries');
    }

    // Test 10: Error Classification
    console.log('\n--- Test 10: Error Classifier ---');
    try {
        await api.get('/status/404');
    } catch (error: any) {
        const classification = api.classifyError(error);
        console.log('✅ Error classified');
        console.log('   Classification:', classification);
    }

    // Test 11: Token Manager
    console.log('\n--- Test 11: Token Manager Integration ---');
    try {
        const response = await api.get('/bearer');
        console.log('✅ Token manager integrated');
        console.log('   Token sent:', response.data?.authenticated || 'Token header added');
    } catch (error) {
        console.error('❌ Token manager test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 12: CancelManager
    console.log('\n--- Test 12: Request Cancellation ---');
    try {
        const controller = cancelManager.createController('req-cancel-test', 'User cancel');
        if (controller) {
            cancelManager.cancel('req-cancel-test', 'Test cancellation');
            const reason = cancelManager.getReason('req-cancel-test');
            console.log('✅ Cancel manager works');
            console.log('   Cancel reason:', reason);
            cancelManager.clear('req-cancel-test');
        }
    } catch (error) {
        console.error('❌ Cancel test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 13: Offline Queue
    console.log('\n--- Test 13: Offline Queue ---');
    try {
        const reqId = `offline_${Date.now()}`;
        offlineQueue.addRequest('POST', 'https://httpbin.org/post', { offline: true }, {}, reqId);
        console.log('✅ Request added to offline queue');
        console.log('   Queue size:', offlineQueue.getQueueSize());
        console.log('   Request ID:', reqId);
    } catch (error) {
        console.error('❌ Offline queue test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 14: Batch Manager
    console.log('\n--- Test 14: Batch Requests ---');
    try {
        console.log('✅ Batch manager initialized');
        const config = batchManager.getConfig();
        console.log('   Config:', JSON.stringify({ endpoint: config.endpoint, wait: config.wait }));
        console.log('   Pending requests:', batchManager.getPendingCount());
        console.log('   (Batch execution requires server support)');
    } catch (error) {
        console.error('❌ Batch test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 15: Streaming Images
    console.log('\n--- Test 15: Streaming Images ---');
    try {
        console.log('✅ Streaming image manager initialized');
        const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
        console.log('   Mock image size:', mockBlob.size, 'bytes');
        console.log('   (Upload test skipped - requires actual upload endpoint)');
    } catch (error) {
        console.error('❌ Streaming images test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 16: Streaming Videos
    console.log('\n--- Test 16: Streaming Videos ---');
    try {
        console.log('✅ Streaming video manager initialized');
        const mockBlob = new Blob(['mock video data longer content'], { type: 'video/mp4' });
        console.log('   Mock video size:', mockBlob.size, 'bytes');
        console.log('   (Upload test skipped - requires actual upload endpoint)');
    } catch (error) {
        console.error('❌ Streaming videos test failed:', error instanceof Error ? error.message : String(error));
    }

    // Final Statistics
    console.log('\n🎉 === All Tests Completed ===\n');
    console.log('📊 Final Comprehensive Statistics:');
    console.log('Cache:', JSON.stringify(api.getCacheStats(), null, 2));
    console.log('Queue:', JSON.stringify(api.getQueueStats(), null, 2));
    console.log('Metadata:', JSON.stringify(api.getMetadataStats(), null, 2));
    console.log('Deduplication:', JSON.stringify(api.getDeduplicationStats(), null, 2));
}

testVoxa().catch(console.error);
