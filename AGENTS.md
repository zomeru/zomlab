<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md

> Instructions for AI coding agents working on **ZomLab**.
>
> This document contains implementation details, coding conventions, architectural decisions, and project expectations that complement the human-facing `README.md`.

---

# Project Overview

ZomLab is a personal software engineering laboratory and interactive knowledge base.

The primary goal is **learning through implementation**, not simply building features.

Every feature should:

- Demonstrate a real-world implementation
- Be production-quality
- Be fully typed
- Be reusable
- Include documentation
- Be easy to understand months later
- Prioritize maintainability over cleverness

This repository is intended to grow for years.

Favor scalability and consistency.

---

# Core Philosophy

Always optimize for:

1. Readability
2. Maintainability
3. Type Safety
4. Reusability
5. Simplicity
6. Performance
7. Developer Experience

Never introduce unnecessary abstractions.

Prefer explicit code over "magic."

---

# Runtime & Tooling

Required versions (do not downgrade unless explicitly requested):

```
Node >=24.18.1   (.node-version)
pnpm 11.20.0     (packageManager)
TypeScript ^6
```

Always prefer the **latest stable** versions of dependencies. This is an engineering lab — staying current is a feature.

## Package Manager: pnpm

- Use `pnpm` for everything. Never use `npm`/`yarn` installs.
- Workspaces are `apps/*` and `packages/*`. Internal packages are consumed as `"@zomlab/*": "workspace:*"`.

## Running Root Commands

**Never use `--cwd`.** Turbo infers the workspace graph from the root. Run commands from the repository root.

```bash
pnpm dev            # TanStack Start web app (port 3000)
pnpm test           # Vitest (unit + integration)
pnpm test:e2e       # Playwright E2E (port 3100, override with E2E_PORT)
pnpm check:all      # Biome → syncpack → knip → tsc → Vitest
```

## Environment Variables

- Source of truth: `.env.example`. Copy to `.env` (gitignored).
- All variables are validated at runtime by `@zomlab/env` (Zod). Missing/invalid variables **exit the process with a clear message** — never bypass this.
- Scripts that need env vars must run through `with-env` (dotenv-cli): `pnpm run with-env -- <command>`.

---

# Repository Structure

```
apps/
    web/            # TanStack Start + Hono on Cloudflare Workers
                    # Single app: UI, API, auth, docs, labs

packages/
    auth/           # Better Auth configuration (Drizzle adapter)
    contracts/      # Shared Zod schemas (errors, notes, system)
    database/       # Drizzle ORM schema + client + repositories
    env/            # Zod-validated environment variables
    tsconfig/       # Shared TypeScript configs
    ui/             # Reusable UI components (+ Storybook)
    vitest-config/  # Shared Vitest base config

e2e/                # Playwright E2E tests + contract specs
scripts/            # setup.ts, generate-package.ts, sync-version.ts
docs/               # Local plans & design documents (gitignored)
.github/workflows/  # CI pipeline
```

Never place reusable logic inside apps if it belongs in packages.

---

# Package Responsibilities

## apps/web

The single application. Contains:

- **Frontend**: TanStack Router file-based routes, React components, hooks, MDX content
- **Backend**: Hono API (`src/integration/hono/`), served via TanStack Start server handlers at `/api/*`
- **Auth**: Better Auth route handlers at `/api/auth/*`
- **Labs**: Feature implementations (`src/labs/`)

Structure:

```
apps/web/src/
├── api/                # Better Auth catch-all handler
├── components/         # Layout, auth, theme, mdx, terminal
├── hooks/              # Shared hooks (use-health)
├── integration/hono/   # Hono API: app, routes, services, middleware, errors
│   ├── errors/         # ApiError base + domain errors + error handler
│   ├── middleware/     # Auth middleware (requireAuth)
│   ├── routes/         # Feature routes (core/notes, system)
│   └── service/        # Business logic (notes service)
├── labs/               # Feature implementations (core/crud)
├── lib/                # Nav tree, API client (hono/client), auth server functions
├── routes/             # TanStack Router file-based routes + routeTree.gen.ts
└── styles/             # Tailwind globals (OKLCH color space)
```

The Hono API is created in `integration/hono/app.ts` and served via `routes/api/$.ts` using TanStack Start's server handler pattern.

## packages/auth

Better Auth configuration. Uses Drizzle adapter (`@better-auth/drizzle-adapter`).

Config details:

- Email/password authentication
- Magic link plugin (logs link in dev only)
- GitHub/Google OAuth — **conditionally enabled** only when both ID and secret env vars are set
- OAuth tokens encrypted at rest (AES-256-GCM)

Exports:

- `auth` — the Better Auth instance (`@zomlab/auth/server`)
- `authClient` — the React client (`@zomlab/auth/client`)
- `AuthSession`, `AuthUser` — inferred session/user types

## packages/contracts

Shared Zod schemas for API contracts. Used by both the API and E2E tests.

Exports:

- `./errors` — `apiErrorSchema`, `validationIssueSchema`
- `./notes` — note CRUD schemas (`noteSchema`, `createNoteBodySchema`, etc.)
- `./system` — `healthResponseSchema`, `readyResponseSchema`, `versionResponseSchema`

## packages/database

Drizzle ORM with Neon PostgreSQL serverless driver.

Contains:

- Schema (`src/db/schema/` — split into `auth.ts`, `core/crud.ts`)
- Client (`src/client.ts` — `createDatabase()` factory using `drizzle(neon(...))`)
- Repositories (`src/repositories/` — CRUD data access)

The database URL comes from `DATABASE_URL` env var. No separate migration URL is needed (migrations use the same connection).

## packages/env

Zod-validated environment variables via a lazy Proxy (parses once on first access). Validation failures print every issue and exit. Add new vars to the schema **and** `.env.example` together.

Schema: `NODE_ENV`, `VITE_SITE_URL`, `DATABASE_URL`, `E2E_PORT`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`.

## packages/ui

Reusable UI components (button, card, code). No business logic. Includes Storybook stories.

## packages/tsconfig

Shared TypeScript configuration presets for the monorepo.

## packages/vitest-config

Shared Vitest base config. Apps/packages merge it with their own `vitest.config.ts`.

---

# Architecture

```
Browser
  │
  ▼
TanStack Start (apps/web)
  │
  ├── Routes (TanStack Router, file-based)
  │     └── React components (Server Components default)
  │
  ├── API (routes/api/$.ts → Hono app.fetch)
  │     ├── /api/auth/*  → Better Auth handler
  │     ├── /api/health, /ready, /version  → system routes (OpenAPI)
  │     └── /api/notes/*  → CRUD routes (auth required)
  │               │
  │               ▼
  │          NoteService (business logic)
  │               │
  │               ▼
  │          NoteRepository (Drizzle queries)
  │               │
  │               ▼
  │          Drizzle ORM → Neon PostgreSQL
  │
  └── Auth (packages/auth → Better Auth with Drizzle adapter)
```

## API Pattern

The Hono app is created in `integration/hono/app.ts` and exported as `apiApp`. It is served by `routes/api/$.ts` using TanStack Start's server handlers:

```typescript
export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request }) => apiApp.fetch(request),
      POST: ({ request }) => apiApp.fetch(request),
      // ...
    },
  },
});
```

The `apiApp` uses `basePath("/api")`, so routes defined as `/notes` in Hono are served at `/api/notes`.

## API Conventions

- REST nouns: `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/:id`
- Validation via `@hono/zod-validator` using schemas from `@zomlab/contracts`
- Authenticated routes use `requireAuth` middleware (sets `c.var.user` and `c.var.session` from Better Auth)
- Error shape is always `{ error: { code, message, detail? } }` (see `errors/error-handler.ts`)
- System routes use `@hono/zod-openapi` for OpenAPI spec

---

# Feature Organization

Each feature follows this structure. **The CRUD feature is the reference implementation:**

- Frontend: `apps/web/src/labs/core/crud/` → `components/`, `hooks/`, `content/`
- Backend routes: `apps/web/src/integration/hono/routes/core/notes.route.ts`
- Service: `apps/web/src/integration/hono/service/core/notes.service.ts`
- Repository: `packages/database/src/repositories/core/crud.ts`
- Contracts: `packages/contracts/src/notes.ts`

```
feature/
├── components/       # React components
├── hooks/            # TanStack Query hooks
├── content/          # MDX documentation
├── services/         # Business logic (in integration/hono/service/)
├── repositories/     # Database access (in packages/database/src/repositories/)
└── routes/           # Hono route definitions (in integration/hono/routes/)
```

Avoid dumping unrelated files together.

---

# Frontend Conventions

## Routing

- Routes use TanStack Router file-based convention in `apps/web/src/routes/`.
- Route groups use parentheses: `_authenticated.tsx` for layout/auth guard.
- Dynamic segments use `$`: `_authenticated.core.crud.demo.$id.tsx`.
- The generated `routeTree.gen.ts` is auto-generated — never edit it manually.

## Authentication Guard

Protected routes use the `_authenticated` layout route which calls `getSession()` (a TanStack Start server function) and redirects to `/login` if unauthenticated.

## Components

- Prefer Server Components. Use Client Components ("use client") only when needed.
- Keep components small (~200 lines max)
- Extract reusable hooks (~150 lines max)
- Reuse `@zomlab/ui` components before writing new ones

## Data Fetching

- TanStack Query for client fetching (query client configured in `router.tsx`)
- Server functions (`createServerFn`) for server-side data access
- API calls go through `hono/client` (`hc<ApiApp>(...)` in `lib/api.ts`) — never `fetch` raw endpoints directly

## State Management

Priority:

1. React State
2. URL State
3. TanStack Query
4. Context

Avoid global state unless necessary.

## Forms

Current pattern: controlled inputs with `useState` + TanStack Query mutations; validation lives on the API (Zod schemas via `@hono/zod-validator`). The auth forms use Better Auth's `authClient`.

---

# Styling

- Tailwind CSS v4 (tokens defined in `apps/web/src/styles/globals.css`, OKLCH color space)
- Do not introduce another CSS framework
- Prefer utility classes; extract repeated patterns into components
- Theme-aware: use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-card`, `bg-muted`, `bg-sidebar`, `text-link`, `bg-destructive`, `bg-primary`) instead of raw colors
- Respect `prefers-reduced-motion` (e.g. `motion-reduce:` variants) for animations
- Dark mode uses class-based switching (`.dark` on `<html>`)

---

# Backend Conventions

## Hono API Structure

- App composition: `integration/hono/app.ts`
- Route registration: `integration/hono/routes/` (one file per feature)
- Business logic: `integration/hono/service/`
- Middleware: `integration/hono/middleware/`
- Error handling: `integration/hono/errors/`

## Validation

- Request validation: `@hono/zod-validator` with schemas from `@zomlab/contracts`
- Response validation: `@hono/zod-openapi` for system routes
- Environment variables: `@zomlab/env` (Zod)

## Database

- Never expose Drizzle directly from routes/services — always use repositories
- Business logic belongs in services
- Schema is defined in `packages/database/src/db/schema/` using Drizzle's `pg-core`

## Authentication

- All authentication goes through `packages/auth` (Better Auth)
- Protect API routes with `requireAuth` middleware (checks session via `auth.api.getSession`)
- Auth handlers are served at `/api/auth/*` via `routes/api/auth/$.ts`

## Error Handling

Return meaningful errors via `ApiError` subclasses (stable `code` + HTTP `status`). Never swallow exceptions. Never expose sensitive information.

Error classes: `ValidationError` (422), `UnauthorizedError` (401), `NoteNotFoundError` (404), `NotFoundError` (404), `InternalError` (500).

Error handler validates envelopes against `apiErrorSchema` from `@zomlab/contracts` before returning.

## Logging

Log important events. Avoid noisy logs. Never log passwords, secrets, tokens, or API keys.

---

# Accessibility

Always support:

- Keyboard navigation (focus rings, `focus-visible`)
- Screen readers (`aria-label`, `aria-expanded`, `aria-controls`, `role="status"`, `role="alert"`)
- Proper labels (real `<label>` elements)
- Semantic HTML (skip link to `#main` is present in the layout)

Accessibility is a requirement.

---

# TypeScript

Always enable strict typing. Never use `any` — prefer `unknown` or proper generics.

Always infer types whenever possible. Avoid unnecessary type aliases.

Never use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress errors.

---

# Testing

Preferred order:

1. Unit
2. Integration
3. E2E

- Vitest runs as workspace projects (root `vitest.config.ts` discovers `apps/*/vitest.config.ts` and `packages/*/vitest.config.ts`). Unit/integration tests sit next to the code (`*.test.ts`).
- Contract tests live in `e2e/contracts/` and validate API schemas against `@zomlab/contracts`.
- E2E lives in `e2e/` (Playwright, port 3100, `pnpm test:e2e`). E2E registers real users against a dev database — keep specs independent (unique emails, teardown kills the server).
- Test behavior, not implementation details.

---

# Tooling & Quality Gates

## Formatting & Linting (Biome)

`biome.jsonc` — 2-space indent, 100 char line width, double quotes, semicolons, trailing commas. Lint on save/commit via lint-staged. Keep code Biome-clean.

## The `check:all` Pipeline

`pnpm check:all` runs in sequence: Biome → syncpack → knip → `turbo check-types` → Vitest. **Run it (or the relevant subset) before claiming work is done.** CI runs the same pipeline plus build and `pnpm audit`.

- `pnpm lint:fix` / `pnpm format` auto-fix
- `pnpm deps:check` — syncpack (pins `turbo` exact, `@zomlab/*` to `workspace:*`)
- `pnpm deps:unused` — knip (workspace-aware config in `knip.config.ts`; add new entry points there)
- `pnpm security:audit` — `pnpm audit --prod`

## Git Hooks

- `pre-commit` → lint-staged (Biome)
- `commit-msg` → commitlint (conventional commits)
- `pre-push` → no-op (security audit runs in CI)

---

# Naming Conventions

Folders

```
kebab-case
```

Files

```
kebab-case.ts

user-service.ts

create-payment.ts

use-auth.ts
```

Auto-generated files: `routeTree.gen.ts`

Components

```
PascalCase
```

Hooks

```
useSomething
```

Types

```
Something

SomethingRequest

SomethingResponse
```

Enums

```
SomethingStatus
```

Constants

```
UPPER_SNAKE_CASE
```

---

# Imports

Order imports:

1. Node
2. External packages
3. Internal packages (`@zomlab/*`)
4. Relative imports
5. Styles

Keep imports organized.

The `~` alias maps to `apps/web/src/`.

---

# Comments

Write self-documenting code first. Do **not** add comments everywhere.

Only add comments when they explain:

- Non-obvious business rules
- Complex algorithms
- Performance optimizations
- Browser or framework quirks
- Important implementation decisions

Comments must be: short, concise, accurate.

Good

```ts
// Prevent duplicate webhook processing.
```

Bad

```ts
// Create user object
const user = {};
```

Avoid redundant comments.

---

# Code Style

Prefer early returns. Avoid deeply nested conditions. Extract reusable logic. Keep functions focused. Prefer composition over inheritance. Avoid large files.

General guidelines:

- Components: ~200 lines max
- Hooks: ~150 lines max
- Services: ~250 lines max

Split files when they become difficult to navigate.

---

# Dependencies

Before adding a dependency, ask:

- Can the platform already do this?
- Can an existing dependency do this?
- Is this package actively maintained?
- Is the bundle size reasonable?
- Is the **latest stable** version used? (ZomLab tracks current versions)

Avoid unnecessary dependencies. Keep versions consistent across workspaces (syncpack enforces this).

---

# Git

Commits should follow Conventional Commits.

Examples

```
feat(auth): add OAuth login

fix(notes): prevent duplicate titles

refactor(crud): simplify note service

docs(readme): update installation

test(contracts): add note schema tests
```

---

# Pull Requests

Changes should:

- Compile successfully
- Pass linting
- Pass tests
- Follow project conventions
- Maintain type safety

Do not leave unfinished code unless explicitly requested.

---

# Agent Expectations

When making changes:

- Preserve existing architecture.
- Prefer consistency over personal preference.
- Reuse existing packages before creating new ones.
- Avoid duplication.
- Keep APIs predictable.
- Keep abstractions minimal.
- Favor readability over cleverness.
- Follow the project's established patterns.
- If introducing a new pattern, ensure it has a clear long-term benefit and is applied consistently.
- Check `.agents/skills/` for framework-specific guidance (Better Auth, Drizzle, Hono, UI) before working in those domains.

The goal is to make ZomLab feel like a cohesive, production-quality engineering handbook rather than a collection of disconnected demos.

---

# Other Instructions

## Generated Files

Do NOT manually edit these files (they are auto-generated):

- `apps/web/src/routeTree.gen.ts` — generated by TanStack Router
- `apps/web/worker-configuration.d.ts` — generated by `wrangler types`
- `packages/database/drizzle/*.sql` — generated by `drizzle-kit generate`

## Migration Notes

- The project previously used Prisma ORM and Elysia for the API. These have been fully replaced by Drizzle ORM and Hono respectively.
- The project previously used Next.js for the frontend. This has been fully replaced by TanStack Start + TanStack Router.
- The project previously used Eden Treaty for the typed API client. This has been replaced by `hono/client` (`hc`).
- The legacy `apps/_web`, `apps/_api`, and `apps/api` directories have been removed.
- Skills referencing Elysia or Prisma in `.agents/skills/` are stale and should be disregarded or removed.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
