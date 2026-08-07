# ZomLab

> **An interactive full-stack engineering playground and knowledge base.**

ZomLab is a personal software engineering laboratory where modern technologies are learned, experimented with, and documented through real, interactive implementations.

Instead of scattered demo repositories, everything lives in one monorepo. Every feature includes a working UI, production-like architecture, and code that explains how it works under the hood.

---

## Current State

This project is a **work-in-progress**. The foundation is built, the TanStack Start + Hono application is running with auth and CRUD features, and new modules are added progressively.

| Layer | Status |
|---|---|
| Monorepo (Turborepo + pnpm) | ✅ Built |
| Environment validation (`@zomlab/env`, Zod) | ✅ Built |
| Database (`@zomlab/database`, Drizzle ORM + Neon PostgreSQL) | ✅ Built |
| Auth (`@zomlab/auth`, Better Auth) | ✅ Built |
| API contracts (`@zomlab/contracts`, Zod schemas) | ✅ Built |
| Web app (`apps/web`, TanStack Start + Hono on Cloudflare) | ✅ Built (auth + CRUD + docs) |
| Notes CRUD (authenticated, full-stack) | ✅ Built |
| Docs (MDX + Mermaid) | ✅ Built |
| Theme system (OKLCH tokens, light/dark) | ✅ Built |
| E2E tests (Playwright) | ✅ Built (4 specs) |
| UI components (`@zomlab/ui`, Storybook) | 🟡 Minimal |
| Redis (docker compose, unused by app) | ⏳ Planned |
| Realtime / WebSockets / AI / Payments / Webhooks | ⏳ Planned |

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
- TanStack Start + TanStack Router
- Vite 8
- TypeScript 6
- Tailwind CSS v4
- TanStack Query

### Backend

- Hono (integrated within TanStack Start, served via Cloudflare Workers)
- `@hono/zod-openapi` for OpenAPI routes
- `@hono/zod-validator` for request validation

### Database

- PostgreSQL (Neon serverless)
- Drizzle ORM (`drizzle-orm/neon-http`)
- Drizzle Kit for migrations and schema management

### Authentication

- Better Auth (Drizzle adapter)
- Email/password + magic link + conditional GitHub/Google OAuth
- Argon2id password hashing (`@node-rs/argon2`)

### Validation

- Zod (environment variables, API contracts, request/response schemas)

### Testing

- Vitest (unit + integration, per-package projects)
- Playwright (E2E, 4 specs on port 3100)

### Tooling

- Biome (linter + formatter)
- Husky + lint-staged
- commitlint (conventional commits)
- syncpack (dependency consistency)
- knip (dead file detection)
- Storybook (component catalog)

### Documentation

- MDX
- Mermaid diagrams

---

## Repository Structure

```
.
├── apps
│   └── web                 # TanStack Start + Hono on Cloudflare Workers
│       └── src/
│           ├── api/           # Auth route handler (Better Auth)
│           ├── components/    # Layout, auth, theme, mdx, terminal
│           ├── hooks/         # Shared hooks (use-health)
│           ├── integration/   # Hono app: routes, services, middleware, errors
│           ├── labs/          # Feature implementations (core/crud)
│           ├── lib/           # Nav, API client, auth functions
│           ├── routes/        # TanStack Router file-based routes
│           └── styles/        # Tailwind globals (OKLCH tokens)
│
├── packages
│   ├── auth               # Better Auth config (Drizzle adapter, password hashing)
│   ├── contracts          # Shared Zod schemas (errors, notes, system)
│   ├── database           # Drizzle schema + client + repositories
│   ├── env                # Zod-validated environment variables
│   ├── tsconfig           # Shared TypeScript configs
│   ├── ui                 # Reusable UI components (+ Storybook)
│   └── vitest-config      # Shared Vitest base config
│
├── e2e                    # Playwright E2E tests + contract specs
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

The application runs as a single TanStack Start app (`apps/web`) that bundles both the UI and the Hono API. The Hono API is served via TanStack Start's server handlers under `/api/*`, and the whole app deploys to Cloudflare Workers.

```
                Browser
                    │
                    ▼
          TanStack Start (apps/web)
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
  Routes         API ($)        Auth (Better Auth)
  (TanStack      │               │
   Router)       ▼               │
              Hono App           │
              /api/*             │
                 │               │
    ┌────────────┼───────────────┘
    ▼            ▼
 System       Core CRUD
 (health,     (notes)
  ready,
  version)       │
                 ▼
            NoteService
                 │
                 ▼
           NoteRepository
                 │
                 ▼
          Drizzle ORM (Neon PostgreSQL)
```

### API Surface

All API routes are served under `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Liveness (status, timestamp, uptime) |
| GET | `/api/ready` | — | Readiness probe |
| GET | `/api/version` | — | API name + version |
| GET | `/api/notes` | ✅ | List current user's notes |
| POST | `/api/notes` | ✅ | Create a note |
| PATCH | `/api/notes/:id` | ✅ | Update an owned note |
| ALL | `/api/auth/*` | — | Better Auth handlers |

Errors follow a stable shape: `{ error: { code, message, detail? } }` with `VALIDATION` (422), `UNAUTHORIZED` (401), `NOTE_NOT_FOUND` (404), `NOT_FOUND` (404), `RATE_LIMITED` (429), and `INTERNAL_SERVER_ERROR` (500).

---

## Feature Organization (Convention)

Implemented features live in `apps/web/src/labs/<area>/<feature>/` (frontend) and `apps/web/src/integration/hono/` (backend), following this shape:

```
feature/
├── components/       # React components
├── hooks/            # TanStack Query hooks
├── content/          # MDX documentation
├── services/         # Business logic (in integration/hono/service/)
├── repositories/     # Database access (in packages/database/src/repositories/)
└── routes/           # Hono route definitions (in integration/hono/routes/)
```

The Notes feature is the reference implementation: `labs/core/crud/` (UI + hooks + MDX) and `integration/hono/routes/core/notes.route.ts` → `service/core/notes.service.ts` → `packages/database/src/repositories/core/crud.ts`.

---

## Development

### Prerequisites

- Node.js >= 24.18.1 (see `.node-version`)
- pnpm 11.20.0 (pinned in `packageManager`)
- PostgreSQL (local via Docker, or Neon serverless)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values (generate BETTER_AUTH_SECRET with: openssl rand -base64 32)

# 3. (Optional) Start local services — PostgreSQL + Redis via Docker
pnpm dev:db

# 4. Generate Drizzle client / push schema
pnpm db:push

# 5. Start development
pnpm dev
```

### Development Modes

| Command | What runs |
|---|---|
| `pnpm dev` | TanStack Start web app (port 3000) |
| `pnpm dev:db` | PostgreSQL + Redis via Docker Compose |
| `pnpm dev:types` | Watch-mode TypeScript checking across the monorepo |
| `pnpm dev:debug` | Dev with the Node inspector enabled |
| `pnpm dev:clean` | Clear the root Turbo cache and metadata |
| `pnpm kill:ports` | Kill anything on ports 3000–3005 and 8787 |

### Database Workflows

| Command | What it does |
|---|---|
| `pnpm db:generate` | Generate Drizzle migration files from schema |
| `pnpm db:push` | Push schema changes to the database (no migration history) |
| `pnpm db:migrate` | Apply migrations (`drizzle-kit migrate`) |
| `pnpm db:studio` | open Drizzle Studio |

Schema lives in `packages/database/src/db/schema/`; migrations are emitted to `packages/database/drizzle/`.

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
| `VITE_SITE_URL` | ✅ | Public site origin (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon or local) |
| `BETTER_AUTH_SECRET` | ✅ | ≥ 32 chars; also encrypts OAuth tokens |
| `BETTER_AUTH_URL` | ✅ | Auth base URL |
| `NODE_ENV` | — | `development` / `production` / `test` (default `development`) |
| `E2E_PORT` | — | Playwright port (default `3100`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | — | Enable GitHub OAuth (both set → provider active) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Enable Google OAuth (both set → provider active) |

---

## Planned Modules

Broad categories include:

- **Core**: CRUD (built), pagination, search & filtering, tables, file uploads
- **Authentication**: OAuth (built), passkeys, RBAC, MFA
- **Realtime**: WebSockets, SSE, presence, chat, notifications
- **Payments & Webhooks**: Stripe, idempotency, signature validation
- **AI**: Chat, streaming, agents, RAG, vector search
- **Performance**: Memoization, virtualization, bundle analysis
- **Security**: CSP, CSRF, rate limiting, secrets management
- **DevOps**: Docker, CI/CD (built), monitoring, deployment

Planned topics appear muted in the sidebar until their pages exist.

---

## Coding Principles

- Feature-first architecture
- Shared contracts (`@zomlab/contracts`)
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
