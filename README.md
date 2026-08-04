# ZomLab

> **An interactive full-stack engineering playground and knowledge base.**

ZomLab is my personal software engineering laboratory where I learn, experiment, document, and showcase modern technologies through real, interactive implementations.

Instead of creating dozens of isolated demo repositories, everything lives in one monorepo. Every feature includes a working UI, production-like architecture, and code that explains how it works under the hood.

---

## Current State

This project is a **work-in-progress**. The foundation (monorepo, packages, auth, database, tooling, CI) is built, and features are being added progressively.

| Layer | Status |
|---|---|
| Monorepo (Turborepo + pnpm) | ✅ Built |
| Environment validation (`@zomlab/env`, Zod) | ✅ Built |
| Database client (`@zomlab/database`, Prisma v7 + driver adapter) | ✅ Built |
| Auth (`@zomlab/auth`, Better Auth) | ✅ Built |
| Legacy API (`apps/_api`, Elysia) | ✅ Built (health + authenticated CRUD) |
| Legacy web app (`apps/_web`, Next.js) | ✅ Built |
| Target API (`apps/api`, Hono + Cloudflare Workers) | 🟡 Scaffold only |
| Target web app (`apps/web`, TanStack Start + Cloudflare Workers) | 🟡 Scaffold only |
| Notes CRUD (authenticated, full-stack) | ✅ Built |
| Docs (MDX + Mermaid) | ✅ Built |
| Theme system (next-themes, OKLCH tokens) | ✅ Built |
| Docs shell (search, collapsible sidebar, profile, footer) | ✅ Built |
| E2E tests (Playwright) | ✅ Built (7 specs, 12 tests) |
| UI components (`@zomlab/ui`, Storybook) | 🟡 Minimal |
| Redis caching | ⏳ Planned |

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
- pnpm Workspaces
- Changesets (versioning)
- Renovate (dependency updates)

### Frontend

- React 19
- TanStack Start (target scaffold)
- Next.js 16 App Router (legacy application)
- TypeScript 6
- Tailwind CSS v4
- TanStack Query
- next-themes
- Eden Treaty (end-to-end typed API client)

### Backend

- Hono on Cloudflare Workers (target scaffold)
- Elysia (legacy API, shared between embedded + standalone modes)
- Better Auth route handlers

### Database

- PostgreSQL
- Prisma ORM v7 (driver adapter, `@prisma/adapter-pg`)

### Authentication

- Better Auth (reusable across Next.js and Elysia)
- Argon2id password hashing (`@node-rs/argon2`)
- Email/password + magic link + GitHub/Google OAuth

### Validation

- Zod (environment variables, shared)
- Elysia models (request/response schemas)

### Realtime (planned)

- Native WebSocket
- Elysia WebSocket
- Socket.IO (when necessary)

### Caching (planned)

- Redis

### Testing

- Vitest (unit + integration, per-package projects)
- Playwright (legacy parity E2E: 7 specs, 12 tests)

### Tooling

- Biome (linter + formatter)
- Husky + lint-staged
- commitlint (conventional commits)
- syncpack (dependency consistency)
- knip (dead file detection)
- Storybook (component catalog)

### Documentation

- MDX
- Mermaid

---

## Repository Structure

```
.
├── apps
│   ├── web                # Target TanStack Start Worker scaffold
│   ├── api                # Target Hono Worker scaffold
│   ├── _web               # Legacy Next.js application (UI, MDX, embedded Elysia)
│   └── _api               # Legacy standalone Elysia server
│
├── packages
│   ├── auth               # Better Auth configuration
│   ├── database           # Prisma client + schema + migrations
│   ├── env                # Zod-validated environment variables
│   ├── tsconfig           # Shared TypeScript configs
│   ├── ui                 # Reusable UI components (+ Storybook)
│   └── vitest-config      # Shared Vitest configuration
│
├── e2e                    # Playwright E2E tests
├── scripts                # Dev scripts (setup, generate-package, sync-version)
├── docs                   # Local plans & design documents (gitignored)
├── .github                # CI workflows
│
├── docker-compose.yml     # PostgreSQL + Redis for local services
├── turbo.json
├── biome.jsonc
├── knip.config.ts
├── syncpack.config.ts
├── playwright.config.ts
├── vitest.config.ts
└── .env.example
```

Never place reusable logic inside apps if it belongs in packages.

---

## Architecture

The production-capable legacy API is defined **once** in `apps/_api/src/app.ts` as an Elysia app
and consumed in two modes:

1. **Embedded**: `pnpm dev:legacy` serves it inside Next.js at `/api/*` via a catch-all route
   handler in `apps/_web`.
2. **Standalone**: `pnpm dev:legacy:api` serves it as its own HTTP server on `API_PORT`.

The target `apps/web` and `apps/api` applications currently provide migration scaffolds only.

The legacy frontend talks to it through an Eden Treaty client (`apps/_web/src/lib/eden.ts`) whose
types are inferred directly from the Elysia app — no hand-written API types.

```
                 Browser
                     │
                     ▼
              Next.js (React)
                     │
         TanStack Query (client) / Server Components
                     │
             Eden Treaty (typed)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
/api/* (embedded Elysia)    Standalone Elysia (:8080)
        │                         │
        └────────────┬────────────┘
                     ▼
               Elysia App (apps/_api/src/app.ts)
                     ▼
         Plugins: error → security → auth → docs
                     ▼
               Modules: system, core/crud
                     ▼
              Service Layer
                     ▼
             Repository Layer
                     ▼
                 Prisma (v7, pg adapter)
                     ▼
               PostgreSQL (local)
```

### API Surface

Standalone mode serves these at the root; embedded mode prefixes them with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness (status, timestamp, uptime) |
| GET | `/ready` | — | Readiness probe |
| GET | `/version` | — | API name + version |
| GET | `/notes` | ✅ | List current user's notes |
| POST | `/notes` | ✅ | Create a note |
| GET | `/notes/:id` | ✅ | Get one owned note |
| PATCH | `/notes/:id` | ✅ | Update an owned note |
| DELETE | `/notes/:id` | ✅ | Delete an owned note |
| GET | `/docs` | — | Swagger UI + OpenAPI (development only) |

Errors follow a stable shape: `{ error: { code, message, detail? } }` with `VALIDATION` (422), `UNAUTHORIZED` (401), `NOTE_NOT_FOUND` (404), `NOT_FOUND` (404), `RATE_LIMITED` (429), and `INTERNAL_SERVER_ERROR` (500).

---

## Feature Organization (Convention)

Implemented legacy features live in `apps/_web/src/features/<area>/<feature>/` (frontend) and
`apps/_api/src/modules/<area>/<feature>/` (backend), following this shape:

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

The legacy Notes feature is the reference implementation: `features/core/crud/` (UI + TanStack
Query hooks) and `modules/core/crud/` (Elysia model → service → repository).

---

## Development

### Prerequisites

- Node.js >= 24.18.1 (see `.node-version`)
- pnpm 11.20.0 (pinned in `packageManager`)
- PostgreSQL (local, or via `pnpm dev:db`)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values (generate BETTER_AUTH_SECRET with: openssl rand -base64 32)

# 3. (Optional) Start local services — PostgreSQL + Redis via Docker
pnpm dev:db

# 4. Generate Prisma client
pnpm db:generate

# 5. Apply migrations to your database
pnpm db:push

# 6. Deploy migrations (production-safe, applies pending migrations)
pnpm db:deploy

# 7. Start development
pnpm dev
```

### Development Modes

| Command | What runs |
|---|---|
| `pnpm dev` | Target TanStack Start and Hono migration scaffolds |
| `pnpm dev:web` | Target TanStack Start migration scaffold only (`:3000`) |
| `pnpm dev:api` | Target Hono migration scaffold only (`:8787`) |
| `pnpm dev:legacy` | Legacy Next.js app with embedded Elysia |
| `pnpm dev:legacy:api` | Legacy standalone Elysia server only (`API_PORT`) |
| `pnpm dev:db` | PostgreSQL + Redis via Docker Compose |
| `pnpm dev:types` | Watch-mode TypeScript checking across the monorepo |
| `pnpm dev:debug` | Target scaffold development with the Node inspector enabled |
| `pnpm dev:clean` | Remove all build caches (turbo + `.turbo`) |
| `pnpm kill:ports` | Kill anything on ports 3000–3005 and 8787 |

The target applications are parallel migration scaffolds; they are not yet feature-complete or
production-ready. Use `pnpm build:web` and `pnpm build:api` to build them independently, and
`pnpm build:legacy` to build both legacy applications.

### Database Workflows

| Command | What it does |
|---|---|
| `pnpm db:generate` | Generate the Prisma client from the schema |
| `pnpm db:push` | Push schema changes to the database (no migration history) |
| `pnpm db:deploy` | Apply pending migrations to the database (production-safe) |
| `pnpm db:migrate` | Create and apply a migration (`prisma migrate dev`, interactive) |
| `pnpm db:studio` | Open Prisma Studio (URL printed on start) |

Schema lives in `packages/database/prisma/` (split into `schema.prisma`, `models/*.prisma`); the client is generated to `packages/database/generated/prisma` (gitignored).

### Quality Checks

```bash
# Run everything: Biome → syncpack → knip → TypeScript → Vitest
pnpm check:all

# Individual checks
pnpm lint           # Biome lint
pnpm format         # Biome format (write)
pnpm format:check   # Biome format (read-only)
pnpm check-types    # tsc across all workspaces
pnpm test           # Vitest (unit + integration)
pnpm test:e2e       # Playwright (port 3100 by default, E2E_PORT to override)
pnpm deps:check     # syncpack
pnpm deps:unused    # knip
pnpm security:audit # pnpm audit --prod
pnpm security:check # pnpm audit (all)
```

CI runs the same pipeline (`.github/workflows/ci.yml`): Biome → syncpack → knip → tsc → Vitest → build → `pnpm audit`.

### Creating a New Package

```bash
pnpm generate:package <name>
```

Scaffolds a new `@zomlab/<name>` package with TypeScript, tests, and tsconfig pre-configured.

### Versioning

```bash
pnpm changeset        # Create a changeset
pnpm version:packages # Apply changesets (bump versions)
pnpm version:sync     # Sync all workspace versions to the root version
```

---

## Environment Variables

Validated at runtime by `@zomlab/env` (Zod). See `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public site origin (e.g. `http://localhost:3000`) |
| `API_PORT` | — | Standalone API port (default `8000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Prisma client) |
| `DIRECT_URL` | ✅ | PostgreSQL connection string (migrations) |
| `BETTER_AUTH_SECRET` | ✅ | ≥ 32 chars; also encrypts OAuth tokens |
| `BETTER_AUTH_URL` | ✅ | Auth base URL |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | — | Enable GitHub OAuth (both set → provider active) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Enable Google OAuth (both set → provider active) |

---

## Why Elysia?

Some features work perfectly as Next.js Route Handlers. Others benefit from a dedicated API server:

- WebSockets
- AI Streaming
- Long-running requests
- Background jobs
- Webhooks

The legacy application supports both approaches. Routes are defined once in
`apps/_api/src/app.ts` and shared between standalone and embedded modes, with full end-to-end type
safety through Eden Treaty.

---

## Planned Modules

Broad categories include:

- **Core**: CRUD (built), pagination, search & filtering, tables, file uploads
- **Authentication**: OAuth (built), passkeys, RBAC, MFA
- **Realtime**: WebSockets, presence, chat, notifications
- **Payments & Webhooks**: Stripe, idempotency, signature validation
- **AI**: Chat, streaming, agents, RAG, vector search
- **Performance**: Memoization, virtualization, bundle analysis
- **Security**: Rate limiting (built), CSP, secrets management
- **DevOps**: Docker, CI/CD (built), monitoring, deployment

Planned topics appear muted in the sidebar until their pages exist.

---

## Coding Principles

- Feature-first architecture
- Shared contracts
- End-to-end type safety
- Reusable packages
- Small modules (components ≤ ~200 lines, hooks ≤ ~150, services ≤ ~250)
- SOLID, DRY, KISS
- Accessibility first
- Performance first
- Measure before optimizing

---

## License

MIT

---

> _"Build once. Learn forever."_
