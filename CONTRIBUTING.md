# Contributing to Voxa HTTP Client

Thank you for your interest in contributing to Voxa! We're excited to have you here. Voxa is an open-source **monorepo** project with a modular architecture that welcomes contributions of all kinds: code, documentation, tests, bug reports, feature requests, and ideas.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Monorepo Structure](#monorepo-structure)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. By participating in this project, you agree to abide by our code of conduct:

- **Be respectful**: Treat everyone with respect and professionalism
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together to solve problems
- **Be patient**: Remember that everyone was new once

For detailed guidelines, see [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).

---

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (required for workspace support)
- **Git**: Latest version
- **TypeScript**: 5.9.0 or higher (installed as dev dependency)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/voxa.git
   cd voxa
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/0xshariq/voxa.git
   ```

---

## Monorepo Structure

Voxa uses a **pnpm workspace** monorepo structure:

```
voxa/
├── src/                          # Core package (@0xshariq/voxa-core)
│   ├── lib/
│   │   ├── client/              # HTTP client implementation
│   │   ├── features/            # Core features (cache, retry, queue, etc.)
│   │   └── types/               # Core type definitions
│   └── config/                  # Configuration
├── features/                    # Feature packages (optional installs)
│   ├── streaming-images/       # @0xshariq/voxa-streaming-images
│   ├── streaming-videos/       # @0xshariq/voxa-streaming-videos
│   ├── http2/                  # @0xshariq/voxa-http2
│   ├── graphql/                # @0xshariq/voxa-graphql
│   ├── batch/                  # @0xshariq/voxa-batch
│   ├── offline/                # @0xshariq/voxa-offline
│   ├── circuit-breaker/        # @0xshariq/voxa-circuit-breaker
│   ├── token/                  # @0xshariq/voxa-token
│   ├── metrics/                # @0xshariq/voxa-metrics
│   └── cancel/                 # @0xshariq/voxa-cancel
├── scripts/                    # Build and utility scripts
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json                # Core package config
```

### Package Organization

- **Core Package** (`src/`): Essential HTTP client features - cache, retry, queue, rate limiting, deduplication, interceptors, error classification, schema validation
- **Feature Packages** (`features/`): Optional features that users can install separately to keep bundle size minimal

Each feature package contains:

- `*.ts` - TypeScript implementation
- `types.d.ts` - Type definitions with module augmentation
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript config extending root
- `.npmignore` - npm publish configuration

---

## Development Setup

### Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### Build the Project

```bash
# Build core package
pnpm run build

# Build all packages in workspace
pnpm -r build

# Build specific feature
cd features/graphql && pnpm run build
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Development Workflow

```bash
# Start development mode with auto-rebuild
pnpm run dev

# Type checking for all packages
pnpm -r run typecheck

# Clean all build artifacts
pnpm -r run clean
```

---

## How to Contribute

### Adding a New Core Feature

If the feature is **essential** for most users, add it to the core package:

1. Create feature files in `src/lib/features/your-feature/`
2. Add types to `src/lib/types/client-types.ts`
3. Update `VoxaConfig` interface
4. Export from `src/lib/index.ts`
5. Add tests and documentation

### Adding a New Feature Package

If the feature is **optional**, create a new feature package:

1. Create directory: `features/your-feature/`
2. Create files:
   ```bash
   features/your-feature/
   ├── your-feature.ts        # Implementation
   ├── types.d.ts             # Types with module augmentation
   ├── package.json           # Package config
   ├── tsconfig.json          # Extends root config
   └── .npmignore             # Publish config
   ```
3. Add to `pnpm-workspace.yaml` (auto-detected with `features/*`)
4. Use module augmentation in `types.d.ts`:
   ```typescript
   declare module "@0xshariq/voxa-core" {
     interface VoxaConfig {
       yourFeature?: YourFeatureConfig;
     }
   }
   ```
5. Build and test the package

### Bug Reports

Found a bug? Please open an issue with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Minimal code example
- Stack trace if applicable

### Feature Requests

Have an idea? Open an issue or discussion with:
- Problem you're trying to solve
- Proposed solution
- Use cases and examples
- Impact on existing code
- Whether it should be core or optional feature

### Code Contributions

1. Check existing issues or create one
2. Fork and create a branch: `git checkout -b feature/your-feature`
3. Make your changes with tests
4. Run tests and linting
5. Commit with clear messages
6. Push and open a pull request

---

## Coding Standards

### TypeScript Style

- Use **TypeScript strict mode**
- Prefer `interface` over `type` for object shapes
- Use explicit return types on functions
- Avoid `any` - use `unknown` or proper types
- Use `async/await` over `.then()` chaining

### Code Style
```typescript
// ✅ Good
export interface MyConfig {
  enabled: boolean;
  timeout?: number;
}

export async function fetchData(url: string): Promise<Response> {
  const response = await fetch(url);
  return response;
}

// ❌ Bad
export type MyConfig = {
  enabled: any;
  timeout: number | undefined;
};

export function fetchData(url) {
  return fetch(url).then(r => r);
}
```

### Naming Conventions

- **Interfaces**: `PascalCase` (e.g., `VoxaConfig`, `RetryOptions`)
- **Classes**: `PascalCase` (e.g., `Voxa`, `CacheManager`)
- **Functions**: `camelCase` (e.g., `fetchData`, `parseResponse`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TIMEOUT`)
- **Files**: `kebab-case.ts` (e.g., `cache-manager.ts`)

### Module Augmentation Pattern

When creating feature packages, use this pattern in `types.d.ts`:

```typescript
// Define your types
export interface YourFeatureConfig {
  enabled: boolean;
  // ... other options
}

// Augment core module
declare module '@0xshariq/voxa-core' {
  interface VoxaConfig {
    yourFeature?: YourFeatureConfig;
  }
}
```

### Peer Dependencies

Feature packages must declare `@0xshariq/voxa-core` as peer dependency:

```json
{
  "peerDependencies": {
    "@0xshariq/voxa-core": "^2.4.1"
  }
}
```

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Voxa } from '@0xshariq/voxa-core';

describe('Feature Name', () => {
  let client: Voxa;

  beforeEach(() => {
    client = new Voxa({ baseURL: 'https://api.example.com' });
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', async () => {
    const result = await client.get('/endpoint');
    expect(result.status).toBe(200);
  });
});
```

### Coverage Requirements

- **Core package**: Minimum 80% coverage
- **Feature packages**: Minimum 75% coverage
- **Critical paths**: 100% coverage (auth, retry, error handling)

### Test Categories

```typescript
// Unit tests - test individual functions
describe('Unit: parseHeaders', () => {
  it('should parse valid headers', () => {
    // ...
  });
});

// Integration tests - test feature interactions
describe('Integration: Cache + Retry', () => {
  it('should cache after successful retry', async () => {
    // ...
  });
});

// E2E tests - test full request lifecycle
describe('E2E: Complete Request', () => {
  it('should handle request with all features', async () => {
    // ...
  });
});
```

---

## Documentation

### Code Documentation

Use JSDoc comments for public APIs:

```typescript
/**
 * Creates a new HTTP client instance with the specified configuration.
 * 
 * @param config - Client configuration options
 * @returns Configured Voxa client instance
 * @example
 * ```typescript
 * const client = new Voxa({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000
 * });
 * ```
 */
export class Voxa {
  constructor(config: VoxaConfig) {
    // ...
  }
}
```

### README Updates

When adding features, update:
- Feature list in README.md
- Installation instructions
- Configuration examples
- Usage examples

### Feature Package README

Each feature package should have its own README:

```markdown
# @0xshariq/voxa-your-feature

> Description of what this feature does

## Installation

\`\`\`bash
npm install @0xshariq/voxa-core @0xshariq/voxa-your-feature
\`\`\`

## Usage

\`\`\`typescript
import { Voxa } from '@0xshariq/voxa-core';
import '@0xshariq/voxa-your-feature';

const client = new Voxa({
  yourFeature: {
    enabled: true
  }
});
\`\`\`

## Configuration

...
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] All packages build successfully (`pnpm -r build`)
- [ ] Commit messages are clear

### PR Title Format

```
type(scope): description

Examples:
feat(graphql): add query batching support
fix(cache): handle undefined cache keys
docs(readme): update installation instructions
chore(deps): update typescript to 5.9.3
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature (core)
- [ ] New feature (optional package)
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of specific changes
- With bullet points

## Testing
How was this tested?

## Breaking Changes
List any breaking changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] TypeScript compiles
- [ ] No new warnings
```

### Review Process

1. **Automated checks**: CI must pass
2. **Code review**: At least one maintainer approval
3. **Documentation**: Must be complete and clear
4. **Tests**: Must cover new code
5. **Performance**: No significant regressions

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### Workspace Publishing

```bash
# Version all packages
pnpm -r exec npm version patch|minor|major

# Build all packages
pnpm -r build

# Publish all packages
pnpm -r publish --access public

# Or publish specific package
cd features/graphql && pnpm publish --access public
```

### Changelog

Update CHANGELOG.md for each release:

```markdown
## [2.5.0] - 2024-01-15

### Added
- New GraphQL feature package (@0xshariq/voxa-graphql)
- Query batching support in batch package

### Changed
- Improved retry backoff algorithm
- Updated TypeScript to 5.9.3

### Fixed
- Cache key collision in edge cases
- Type errors with optional configs

### Breaking Changes
- Renamed package to @0xshariq/voxa-core
```

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, announcements
- **Pull Requests**: Code contributions

### Getting Help

- Check existing issues and discussions
- Read the documentation
- Ask in GitHub Discussions
- Tag maintainers if urgent

### Recognition

Contributors are recognized in:
- CHANGELOG.md for each release
- Contributors section in README
- GitHub contributors graph

---

## Thank You! 🎉

Your contributions make Voxa better for everyone. Whether you're fixing a typo, adding tests, or building a new feature, every contribution matters.

Happy coding! 🚀
- **Discussions**: Start a [GitHub Discussion](https://github.com/0xshariq/voxa/discussions)

### Stay Updated

- **Watch**: Star and watch the repository
- **Changelog**: Follow [CHANGELOG.md](./CHANGELOG.md)
- **Releases**: Subscribe to release notifications

### Recognition

Contributors are recognized in:

- README contributors section
- Release notes
- Git commit history

---

## Questions?

If you have questions about contributing, feel free to:

- Open a [GitHub Discussion](https://github.com/0xshariq/voxa/discussions)
- Comment on an existing issue
- Reach out to maintainers

---

## Thank You!

Your contributions make Voxa better for everyone. We appreciate your time and effort! 🎉
