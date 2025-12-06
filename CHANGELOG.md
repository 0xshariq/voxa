# Changelog

All notable changes to Voxa HTTP Client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with Vitest
- Integration tests for feature combinations
- Architecture documentation with diagrams
- Migration guide from Axios
- Enhanced contribution guidelines

## [2.4.1] - 2024-12-05

### Added
- **HTTP/2 Server Push Support**: Automatic detection and caching of server-pushed resources
  - `Http2PushManager` for managing pushed resources
  - Push resource detection using Performance API
  - Automatic caching of pushed resources
  - Configurable push handling with `http2Push` config option
- **Developer Experience Improvements**:
  - Debug mode with `VoxaClient.enableDebug()` and `VoxaClient.disableDebug()`
  - Public getters for accessing configuration safely
  - Enhanced logging with safe redaction of sensitive data
  - Better TypeScript intellisense and documentation
- **Documentation Enhancements**:
  - Complete streaming guide (`docs/STREAMING.md`)
  - Comprehensive troubleshooting guide (`docs/TROUBLESHOOTING.md`)
  - Developer experience guide (`docs/DEVELOPER_EXPERIENCE.md`)
  - Feature comparison table in README
  - All features documented in `FEATURES.md`

### Fixed
- Performance API type errors in universal (browser+Node.js) code
- Type safety improvements across all managers
- Build errors with strict TypeScript compilation

### Changed
- Centralized all types in `client-types.ts` for better organization
- Improved error messages and debugging information
- Enhanced SSRF protection with better validation

## [2.4.0] - 2024-11-28

### Added
- **Streaming Support**: Upload and download progress tracking for large files
  - `StreamingManager` for handling chunked transfers
  - Real-time progress callbacks
  - Support for images, videos, and large files
  - Configurable chunk size and buffer management
- **Advanced Caching Strategies**:
  - Memory cache with LRU eviction
  - Redis cache for distributed systems
  - File system cache for persistent storage
  - Cache invalidation patterns and TTL management
- **Circuit Breaker Pattern**: Automatic failure detection and recovery
  - Configurable failure thresholds
  - Half-open state for testing recovery
  - Per-endpoint circuit breaker isolation
- **Enhanced Authentication**:
  - Automatic token refresh with configurable callbacks
  - Bearer token and API key support
  - Token storage and retrieval
  - Pre-request authentication hooks

### Improved
- Cache performance with better memory management
- Retry logic with exponential backoff and jitter
- Request deduplication for parallel identical requests
- Rate limiting with token bucket algorithm

## [2.3.0] - 2024-11-15

### Added
- **SSRF Protection**: Block requests to private IP ranges
  - Automatic validation of URLs before requests
  - Redirect validation to prevent DNS rebinding
  - Configurable whitelist for allowed private IPs
- **Header Security**: Whitelist/blacklist for headers
  - Safe headers allowed by default
  - Sensitive headers (Cookie, Set-Cookie) blocked
  - Custom header validation
- **Request/Response Interceptors**: Middleware pattern
  - Pre-request interceptors for modifying requests
  - Post-response interceptors for transforming responses
  - Error interceptors for custom error handling
  - Async interceptor support

### Fixed
- Memory leaks in request deduplication manager
- Race conditions in cache invalidation
- Type inference issues with generic request methods

## [2.2.0] - 2024-11-01

### Added
- **Rate Limiting**: Token bucket and sliding window algorithms
  - Per-endpoint rate limiting
  - Configurable request limits and time windows
  - Automatic request queuing
- **Request Deduplication**: Prevent duplicate in-flight requests
  - Automatic deduplication based on request signature
  - Shared promise resolution for identical requests
  - Configurable deduplication key generation
- **Batch Requests**: Efficient batch processing
  - Parallel batch execution
  - Sequential batch execution with dependencies
  - Batch error handling and partial success
- **AbortController Support**: Request cancellation
  - Timeout-based cancellation
  - Manual cancellation with abort signals
  - Cleanup of in-flight requests

### Changed
- Improved TypeScript types for better type inference
- Enhanced error messages with more context
- Better documentation with more examples

## [2.1.0] - 2024-10-15

### Added
- **Smart Retry Logic**: Exponential backoff with jitter
  - Configurable retry attempts and delays
  - Retry only on idempotent methods by default
  - Custom retry condition functions
  - Circuit breaker integration
- **Advanced Caching**: Multi-layer cache with TTL
  - In-memory cache with LRU eviction
  - Configurable cache keys
  - Cache invalidation patterns
  - Conditional requests (ETag, Last-Modified)
- **Timeout Management**: Request and connection timeouts
  - Global timeout configuration
  - Per-request timeout override
  - Automatic cleanup on timeout

### Improved
- Performance optimizations for cache lookups
- Memory usage reduction in cache manager
- Error handling with better error messages

## [2.0.0] - 2024-10-01

### Added
- **TypeScript Rewrite**: Full TypeScript implementation
  - Strong type safety
  - Generic request/response types
  - Type inference for request methods
- **Native Fetch API**: Built on modern Fetch API
  - Browser and Node.js 18+ support
  - Universal compatibility
  - Streaming support
- **ESM Modules**: Modern module system
  - Tree-shakable exports
  - Better bundle sizes
  - Import/export syntax

### Breaking Changes
- **Minimum Node.js version**: Now requires Node.js 18+
- **Module system**: Changed from CommonJS to ESM
- **API changes**: 
  - Constructor now accepts single config object
  - Response format changed to native Response object
  - Error handling uses custom VoxaError class
- **Removed features**:
  - Legacy callback-based API
  - XMLHttpRequest support
  - CommonJS builds

### Migration Guide
See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions from v1.x to v2.x.

## [1.5.0] - 2024-09-01

### Added
- Basic caching support
- Simple retry mechanism
- Request/response logging
- TypeScript definitions

### Fixed
- Memory leaks in request handling
- Error handling edge cases
- Type definition issues

## [1.0.0] - 2024-08-01

### Added
- Initial release
- Basic HTTP client functionality
- GET, POST, PUT, PATCH, DELETE methods
- Request configuration
- Error handling
- Node.js and browser support

---

## Version Support

| Version | Status | Node.js | Browser |
|---------|--------|---------|---------|
| 2.4.x   | Active | 18+     | Modern  |
| 2.3.x   | Active | 18+     | Modern  |
| 2.2.x   | Maintenance | 18+ | Modern |
| 2.1.x   | Maintenance | 18+ | Modern |
| 2.0.x   | End of Life | 18+ | Modern |
| 1.x.x   | End of Life | 14+ | All     |

## Upgrade Notes

### 2.4.x → 2.5.x (Upcoming)
- No breaking changes expected
- New features will be additive
- Deprecation notices will be provided 6 months before removal

### 2.3.x → 2.4.x
- No breaking changes
- HTTP/2 push support is opt-in
- New debug mode available via static methods

### 2.2.x → 2.3.x
- No breaking changes
- SSRF protection enabled by default (can be disabled)
- Header security enabled by default

### 2.1.x → 2.2.x
- No breaking changes
- Rate limiting is opt-in
- Request deduplication enabled by default (can be disabled)

### 2.0.x → 2.1.x
- No breaking changes
- Retry and cache improvements are backward compatible


---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to this project.

## Security

See [SECURITY.md](./SECURITY.md) for security policies and vulnerability reporting.
