# Voxa CLI (Future)

> **Note:** This is a planned feature currently under development.

## Vision

The Voxa CLI will provide a command-line interface for testing and debugging HTTP APIs, similar to curl but with Voxa's advanced features like caching, retry logic, and request prioritization.

## Planned Features

### Basic HTTP Commands

```bash
# GET request
voxa get https://api.example.com/users

# POST request with data
voxa post https://api.example.com/users -d '{"name":"John"}'

# Custom headers
voxa get https://api.example.com/users -H "Authorization: Bearer token"

# Request with priority
voxa post https://api.example.com/checkout --priority critical
```

### Configuration

```bash
# Use global environment variables (see CONFIGURATION.md)
voxa get https://api.example.com/users

# Use project .env file
voxa get https://api.example.com/users --env .env.production

# Override config
voxa get https://api.example.com/users --cache-ttl 60000
```

### Collections & Environments

```bash
# Save request to collection
voxa save get-users "voxa get https://api.example.com/users"

# Run saved request
voxa run get-users

# List all saved requests
voxa list

# Import Postman collection
voxa import postman-collection.json
```

### Interactive Mode

```bash
# Start interactive mode
voxa

# Interactive prompts guide you through:
# - Method selection
# - URL input
# - Headers
# - Body
# - Advanced options
```

### Response Formatting

```bash
# JSON pretty print (default)
voxa get https://api.example.com/users

# Show only headers
voxa get https://api.example.com/users --headers-only

# Show only status
voxa get https://api.example.com/users --status-only

# Raw response
voxa get https://api.example.com/users --raw

# Save response to file
voxa get https://api.example.com/users -o response.json
```

### Advanced Features

```bash
# Enable caching
voxa get https://api.example.com/products --cache

# With retry
voxa get https://api.example.com/users --retry 5

# Queue multiple requests
voxa batch requests.json

# Monitor request stats
voxa stats
```

## Global Configuration

### Setup (One-time)

#### Linux/macOS

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Voxa CLI Configuration
export VOXA_REDIS_HOST="localhost"
export VOXA_REDIS_PORT="6379"
export VOXA_REDIS_PASSWORD="your-password"
export VOXA_CACHE_ENABLED="true"
export VOXA_CACHE_STORAGE="redis"
```

Apply:
```bash
source ~/.bashrc
```

#### Windows PowerShell

Add to `$PROFILE`:

```powershell
$env:VOXA_REDIS_HOST = "localhost"
$env:VOXA_REDIS_PORT = "6379"
$env:VOXA_REDIS_PASSWORD = "your-password"
$env:VOXA_CACHE_ENABLED = "true"
```

#### Windows Command Prompt

```cmd
setx VOXA_REDIS_HOST "localhost"
setx VOXA_REDIS_PORT "6379"
setx VOXA_REDIS_PASSWORD "your-password"
```

### Usage After Setup

Once configured globally, all CLI commands automatically use these settings:

```bash
# No need to specify Redis config
voxa get https://api.example.com/users --cache

# Cache automatically uses global Redis settings
```

## Future Roadmap

### Phase 1: Core CLI
- [x] Project structure
- [ ] Basic HTTP methods (GET, POST, PUT, DELETE)
- [ ] Headers and body support
- [ ] Response formatting
- [ ] Global config from environment variables

### Phase 2: Advanced Features
- [ ] Request collections
- [ ] Environment variables
- [ ] Interactive mode
- [ ] Response filters and transformers

### Phase 3: Integration
- [ ] Postman collection import/export
- [ ] GraphQL support
- [ ] WebSocket testing
- [ ] API documentation generation

### Phase 4: Full Application
- [ ] Desktop application (Electron)
- [ ] Web-based interface
- [ ] Team collaboration features
- [ ] Mock servers
- [ ] API monitoring

## Postman-like Application Feasibility

Building a full-fledged Postman alternative on top of Voxa is **highly feasible** and would be a natural evolution:

### Strengths of Voxa as a Foundation

✅ **Solid HTTP Client Core**
- All HTTP methods supported
- TypeScript generics for type safety
- Interceptors for request/response modification
- Built-in retry logic and error handling

✅ **Advanced Features Ready**
- Caching (Memory/Redis)
- Request deduplication
- Priority-based queue management
- Request metadata tracking

✅ **Extensible Architecture**
- Modular design (core/, config/, cli/)
- Easy to add new features
- Plugin system potential

✅ **Developer Experience**
- TypeScript throughout
- Well-documented
- Modern ESNext syntax

### What You'd Need to Add

#### For CLI Tool (Phase 1-2)
- Command-line argument parsing (Commander.js, Yargs)
- Response formatting (chalk, cli-table)
- File I/O for collections
- Config file management

#### For Desktop App (Phase 3-4)
- **Frontend Framework:** Electron + React/Vue/Svelte
- **UI Components:** Request builder, response viewer, collection manager
- **Data Persistence:** SQLite or IndexedDB for collections
- **Syntax Highlighting:** Monaco Editor or CodeMirror
- **Authentication Flow:** OAuth2, API Key management

#### For Web App (Alternative to Desktop)
- **Backend:** Node.js + Express/Fastify
- **Frontend:** React/Vue with TailwindCSS
- **Real-time:** WebSocket for live updates
- **Cloud Sync:** PostgreSQL + Redis

### Recommended Architecture

```
voxa-ecosystem/
├── voxa/                   # Core HTTP client (current)
├── voxa-cli/              # Command-line tool
├── voxa-app/              # Desktop application (Electron)
│   ├── main/              # Electron main process
│   ├── renderer/          # React frontend
│   └── shared/            # Shared utilities
└── voxa-server/           # Optional cloud sync backend
```

### Development Timeline Estimate

- **CLI Tool:** 2-4 weeks (basic), 2-3 months (full-featured)
- **Desktop App:** 3-6 months (MVP), 8-12 months (Postman competitor)
- **Web App:** 4-8 months (MVP), 12-18 months (production-ready)

### My Recommendation

**Start with the CLI tool first:**

1. **Immediate Value:** Developers can use it right away
2. **Foundation:** CLI logic can be reused in desktop/web apps
3. **Feedback Loop:** Get user feedback before building UI
4. **Incremental:** Build features step-by-step

**Then build the desktop app:**

1. **Rich UI:** Electron provides native feel
2. **Offline First:** Works without internet (like Postman)
3. **Reuse Voxa:** Your HTTP client is the engine
4. **Market Gap:** Alternatives to Postman are in demand

### Key Differentiators

To stand out from Postman:

1. **Open Source:** Make it fully open source
2. **Performance:** Focus on speed (Redis caching, queue management)
3. **Developer-First:** CLI-first, then GUI
4. **TypeScript Native:** Full TypeScript support, type generation
5. **Modern Stack:** Electron + React + Voxa
6. **Privacy:** No forced cloud sync, local-first
7. **Extensibility:** Plugin system for custom features

### Competitive Landscape

- **Postman:** Market leader, feature-rich, cloud-based
- **Insomnia:** Lighter alternative, Kong-owned
- **Hoppscotch:** Open-source, web-based
- **HTTPie Desktop:** Modern, beautiful UI
- **Thunder Client:** VS Code extension

**Your Opportunity:** CLI-first approach + TypeScript-native + open-source

## Next Steps

See [CONFIGURATION.md](./CONFIGURATION.md) for environment setup and credential management.
