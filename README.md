# ZomLab

> **An interactive full-stack engineering playground and knowledge base.**

ZomLab is my personal software engineering laboratory where I learn, experiment, document, and showcase modern technologies through real, interactive implementations.

Instead of creating dozens of isolated demo repositories, everything lives in one monorepo. Every feature includes a working UI, production-like architecture, and code that explains how it works under the hood.

---

## Current State

This project is a **work-in-progress**. The foundation (monorepo, packages, auth, database, tooling) is built. Features are being added progressively.

| Layer | Status |
|---|---|
| Monorepo (Turborepo + Bun) | ✅ Built |
| Environment validation (`@zomlab/env`) | ✅ Built |
| Database client (`@zomlab/database`, Prisma v7) | ✅ Built |
| Auth (`@zomlab/auth`, Better Auth) | ✅ Built |
| UI components (`@zomlab/ui`) | 🟡 Minimal |
| Web app (`apps/web`, Next.js) | 🟡 Scaffolded |
| API (`apps/api`, Elysia) | 🟡 Scaffolded |
| Features | ❌ Planned |

---

## Philosophy

Most tutorials show **what** to build.

ZomLab focuses on:

- **How** it works
- **Why** it works
- **When** to use it
- **Common mistakes**
- **Performance implications**
- **Security considerations**
- **Production-ready architecture**

Every feature is implemented as if it were part of a real-world application.

---

## Tech Stack

### Monorepo

- Turborepo
- Bun Workspaces

### Frontend

- React 19
- Next.js 16 (App Router)
- TypeScript 6
- Tailwind CSS v4
- TanStack Query

### Backend

- Elysia
- Next.js Route Handlers

### Database

- PostgreSQL
- Prisma ORM v7 (driver adapter)

### Authentication

- Better Auth (reusable across Next.js and Elysia)

### Caching

- Redis

### Validation

- Zod (shared between frontend, backend, API)

### Realtime

- Native WebSocket
- Elysia WebSocket
- Socket.IO (when necessary)

### Testing

- Vitest (unit + integration)
- Playwright (E2E — coming soon)

### Tooling

- Biome (linter + formatter)
- Husky + lint-staged
- commitlint (conventional commits)
- syncpack (dependency consistency)
- knip (dead file detection)
- Storybook (component catalog — coming soon)

### Documentation

- MDX
- Mermaid

---

## Repository Structure

```
.
├── apps
│   ├── web                # Next.js application
│   └── api                # Standalone Elysia server
│
├── packages
│   ├── auth               # Better Auth configuration
│   ├── database           # Prisma client + schema
│   ├── env                # Zod-validated environment variables
│   ├── tsconfig           # Shared TypeScript configs
│   ├── ui                 # Reusable UI components
│   └── vitest-config      # Shared Vitest configuration
│
├── docker                 # Docker Compose for local services
├── scripts                # Dev scripts (generate-package, setup, etc.)
├── docs                   # Plans and design documents
├── e2e                    # Playwright E2E tests (coming soon)
└── .github                # CI workflows
```

---

## Architecture

```
                 Browser
                     │
                     ▼
              Next.js (React)
                     │
         TanStack Query / Server Actions
                     │
         ┌──────────────────────┐
         │                      │
         ▼                      ▼
 Next.js Route Handlers    Elysia Server
         │                      │
         └──────────┬───────────┘
                    ▼
           Shared Contracts
               (Zod)
                    ▼
             Service Layer
                    ▼
            Repository Layer
                    ▼
                Prisma
                    ▼
              PostgreSQL
                    │
                  Redis
                    │
              External APIs
```

---

## Feature Organization (Convention)

As features are built, they follow this structure:

```
feature/
├── components/
├── hooks/
├── services/
├── repositories/
├── api/
├── schemas/
├── types/
├── utils/
├── constants/
├── tests/
└── docs/
```

---

## Development

### Prerequisites

- Node.js >=24.18.0
- Bun (latest stable)
- Docker (for PostgreSQL + Redis)

### Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 3. Start local services (PostgreSQL + Redis)
bun run dev:db

# 4. Generate Prisma client
bun run db:generate

# 5. Start development
bun run dev
```

### Development Modes

| Command | What runs |
|---|---|
| `bun run dev` | Next.js (with Elysia embedded under `/api/*`) |
| `bun run dev:api` | Standalone Elysia server only |
| `bun run dev:standalone` | Next.js + Standalone Elysia (microservice mode) |
| `bun run dev:db` | PostgreSQL + Redis via Docker |

### Quality Checks

```bash
# Run all checks (lint → deps → unused → types → tests)
bun run check:all

# Watch mode for type checking
bun run dev:types

# Individual checks
bun run lint         # Biome
bun run format       # Biome format
bun run deps:check   # syncpack
bun run deps:unused  # knip
bun run test         # Vitest
```

### Creating a New Package

```bash
bun run generate:package <name>
```

Scaffolds a new `@zomlab/<name>` package with TypeScript, tests, and tsconfig pre-configured.

---

## Why Elysia?

Some features work perfectly as Next.js Route Handlers. Others benefit from a dedicated API server:

- WebSockets
- AI Streaming
- Long-running requests
- Background jobs
- Webhooks

This project supports both approaches. Routes are defined once in `apps/api/src/app.ts` and shared between standalone and embedded modes.

---

## Planned Modules

Modules listed in [`ENHANCEMENTS.md`](./ENHANCEMENTS.md) track what's coming. Broad categories include:

- **Core**: CRUD, pagination, search, filtering, file uploads
- **Authentication**: OAuth, passkeys, RBAC, MFA
- **Realtime**: WebSockets, presence, chat, notifications
- **Payments & Webhooks**: Stripe, idempotency, signature validation
- **AI**: Chat, streaming, agents, RAG, vector search
- **Performance**: Memoization, virtualization, bundle analysis
- **Security**: Rate limiting, CSP, secrets management
- **DevOps**: Docker, CI/CD, monitoring, deployment

---

## Coding Principles

- Feature-first architecture
- Shared contracts
- End-to-end type safety
- Reusable packages
- Small modules
- SOLID, DRY, KISS
- Accessibility first
- Performance first
- Measure before optimizing

---

## License

MIT

---

> _"Build once. Learn forever."_
