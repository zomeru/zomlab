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

Always prefer the **latest stable** versions of dependencies (Elysia, Next.js, Prisma, etc.). This is an engineering lab — staying current is a feature.

## Package Manager: pnpm

- Use `pnpm` for everything. Never use `npm`/`yarn` installs.
- Workspaces are `apps/*` and `packages/*`. Internal packages are consumed as `"@zomlab/*": "workspace:*"`.

## Running Root Commands

**Never use `--cwd`.** Turbo infers the workspace graph from the root. Run commands from the repository root.

```bash
pnpm dev            # Target TanStack Start web + Hono API Workers
pnpm dev:web        # Target TanStack Start Worker only
pnpm dev:api        # Target Hono Worker only
pnpm dev:legacy     # Legacy Next.js with embedded Elysia at /api/*
pnpm dev:standalone # Legacy Next.js + standalone Elysia (microservice mode)
pnpm test           # Vitest (unit + integration)
pnpm test:e2e       # Playwright E2E (port 3100, override with E2E_PORT)
pnpm check:all      # Biome → syncpack → knip → tsc → Vitest
```

## Environment Variables

- Source of truth: `.env.example`. Copy to `.env` (gitignored).
- All variables are validated at runtime by `@zomlab/env` (Zod). Missing/invalid variables **exit the process with a clear message** — never bypass this.
- Scripts that need env vars must run through `with-env` (dotenv-cli): `pnpm run with-env -- <command>`.
- The API port for the standalone server is `API_PORT` (default `8000`, `8080` in `.env.example`).

---

# Repository Structure

```
apps/
    web/        # Target TanStack Start Cloudflare Worker scaffold
    api/        # Target Hono Cloudflare Worker scaffold
    _web/       # Legacy Next.js App Router application
    _api/       # Legacy standalone Elysia server

packages/
    auth/           # Better Auth configuration (+ client)
    database/       # Prisma schema, migrations, client
    env/            # Zod-validated environment variables
    tsconfig/       # base.json, nextjs.json, react-library.json
    ui/             # Reusable UI components (+ Storybook)
    vitest-config/  # Shared Vitest base config

e2e/                 # Playwright E2E specs
scripts/             # setup.ts, generate-package.ts, sync-version.ts
docs/                # Local plans & design documents (gitignored)
.github/workflows/   # CI pipeline
docker-compose.yml   # PostgreSQL + Redis for local services
```

Never place reusable logic inside apps if it belongs in packages.

---

# Package Responsibilities

## apps/web (target)

The target web application is a TanStack Start Cloudflare Worker scaffold. New migration work belongs
here unless a task explicitly targets the legacy application.

## apps/api (target)

The target API is a Hono Cloudflare Worker scaffold. New migration work belongs here unless a task
explicitly targets the legacy application.

## apps/_web (legacy)

Contains:

- UI
- Pages
- Layouts
- Client Components
- Server Components
- MDX documentation content (`content/`)

Business logic should be minimal. Data access goes through hooks → Eden → API.

## apps/_api (legacy)

The Elysia app is the single source of truth for the API. Structure:

```
apps/_api/src/
├── app.ts            # Composes plugins + modules; exports App type
├── index.ts          # Standalone entrypoint (app.listen(env.API_PORT))
├── errors/           # ApiError base + domain errors (Unauthorized, NotFound, RateLimit)
├── plugins/          # error, security, auth, docs
└── modules/          # system, core/crud (feature modules)
```

Responsible for:

- WebSockets (planned)
- Webhooks (planned)
- Streaming (planned)
- Background APIs
- Long-running requests

## packages/database

Contains:

- Prisma schema (`prisma/schema.prisma` + `prisma/models/*.prisma`)
- Migrations (`prisma/migrations/`)
- Prisma client (`src/client.ts`, generated client in `generated/prisma/`)
- Database helpers

Prisma v7 with `@prisma/adapter-pg` driver adapter. Migrations resolve their connection from `DIRECT_URL` via `prisma.config.ts`; the client uses `DATABASE_URL`. The client is a lazy singleton behind a Proxy.

## packages/auth

Contains Better Auth configuration. Reusable by:

- Next.js (via `apps/_web/src/app/api/auth/[...all]/route.ts`)
- Elysia (via `plugins/auth.ts` and `auth.api.getSession`)

Never duplicate auth logic. Config details:

- Email/password with Argon2id hashing (`@node-rs/argon2`, 64 MiB / 3 iterations / 4 lanes)
- Magic link plugin (dev log only)
- GitHub/Google OAuth — **conditionally enabled** only when both ID and secret env vars are set
- OAuth tokens encrypted at rest (AES-256-GCM)

## packages/env

Zod-validated environment variables via a lazy Proxy (parses once on first access). Validation failures print every issue and exit. Add new vars to the schema **and** `.env.example` together.

## packages/ui

Reusable UI components (button, card, code). No business logic. Includes Storybook stories.

## packages/tsconfig

Shared TypeScript configuration presets:

- `base.json` — strict, NodeNext, `noUncheckedIndexedAccess`
- `nextjs.json` — Next.js apps
- `react-library.json` — React component libraries

## packages/vitest-config

Shared Vitest base config (thread pool, 30s test timeout, CJS fallback). Apps/packages merge it with their own `vitest.config.ts` (e.g. web adds `jsdom`).

---

# Architecture

```
UI (Server Components default, "use client" when interactive)
│
▼
Hooks (TanStack Query for client fetching)
│
▼
Eden Treaty client (apps/_web/src/lib/eden.ts — types inferred from the Elysia app)
│
▼
Elysia App (apps/_api/src/app.ts)
│  plugins: error → security → auth → docs
│
▼
Module (Elysia with .model / .prefix / routes)
│
▼
Service (business logic)
│
▼
Repository (Prisma access)
│
▼
Database (PostgreSQL)
```

Never access Prisma directly from UI. Never perform business logic inside components.

## Dual-Mode API

The same Elysia app runs two ways:

1. **Embedded** — served by Next.js at `/api/*` via `apps/_web/src/app/api/[[...slugs]]/route.ts` (uses `elysiaApp`, prefixed `/api`).
2. **Standalone** — `apps/_api/src/index.ts` listens on `API_PORT` (uses `app`, no prefix).

`apps/_api/src/app.ts` exports both the composed `app` and the `App` type consumed by Eden. **Add legacy routes only in `app.ts`'s dependency graph** so both modes and the type contract stay in sync.

## API Conventions

- REST nouns: `GET /notes`, `POST /notes`, `DELETE /notes/:id`
- Requests/responses validated with Elysia models (`t.Object`) registered via `.model()` — never hand-parse
- Authenticated routes opt in with the `auth: true` macro (from `plugins/auth.ts`); unauthenticated access → 401
- Error shape is always `{ error: { code, message, detail? } }` (see `plugins/error.ts`)
- Swagger + OpenAPI are development-only (`plugins/docs.ts`)
- Rate limiting (100 req/min/IP) and helmet/CORS in `plugins/security.ts` — rate limit disabled in dev

---

# Feature Organization

Each feature follows this structure. **The CRUD feature is the reference implementation:**

- Frontend: `apps/_web/src/features/core/crud/` → `components/`, `hooks/`
- Backend: `apps/_api/src/modules/core/crud/` → `model.ts`, `service.ts`, `repository.ts`, `index.ts` (+ tests)
- Docs: `apps/_web/content/core/crud/*.mdx`

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

Avoid dumping unrelated files together.

---

# Frontend Conventions

## Pages & Routing

- Legacy pages live under `apps/_web/src/app/`, one folder per route (`/core/crud`, `/core/crud/demo`, `/core/crud/demo/[id]`).
- The legacy sidebar tree is defined in `apps/_web/src/lib/nav.ts`. **When adding a legacy page, update `nav.ts`** so it appears in the sidebar and global search (`⌘K`).
- Planned topics without pages stay in `nav.ts` without an `href` — rendered muted.
- Legacy MDX doc pages import content from `apps/_web/content/` via the `@content/*` alias.

## Components

Prefer Server Components whenever possible. Use Client Components ("use client") only when needed — interactivity, hooks, event handlers.

- Keep components small (~200 lines max)
- Extract reusable hooks (~150 lines max)
- Avoid prop drilling
- Reuse `@zomlab/ui` components before writing new ones
- Legacy MDX styling is centralized in `apps/_web/src/mdx-components.tsx` — add doc-level styles there

## Forms

Current pattern (no form library installed): controlled inputs with `useState` + TanStack Query mutations; validation lives on the API (Elysia models). If a form library is introduced, prefer React Hook Form + Zod — never hand-roll validation twice.

## State Management

Priority

1. React State
2. URL State
3. TanStack Query
4. Context

Avoid global state unless necessary.

## Data Fetching

- TanStack Query for legacy client fetching (query keys centralized in `apps/_web/src/lib/query-keys.ts`)
- Server Components for initial rendering whenever possible
- All legacy API calls go through the Eden client (`apps/_web/src/lib/eden.ts`) — never `fetch` raw endpoints
- Map legacy API errors with `apps/_web/src/lib/api-error.ts` before surfacing to users

---

# Styling

- Tailwind CSS v4 (legacy tokens defined in `apps/_web/src/app/globals.css`, OKLCH color space)
- Do not introduce another CSS framework
- Prefer utility classes; extract repeated patterns into components
- Theme-aware: use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-card`, `bg-muted`, `bg-sidebar`, `text-link`, `bg-destructive`, `bg-primary`) instead of raw colors
- Respect `prefers-reduced-motion` (e.g. `motion-reduce:` variants) for animations

---

# Backend Conventions

Use Hono for new target API work in `apps/api`. The following Elysia and Next.js conventions apply
only to the preserved legacy applications under `apps/_api` and `apps/_web`.

Next.js Route Handlers are acceptable for:

- Authentication (`/api/auth/[...all]`)
- Small APIs
- Server Actions

Prefer Elysia for:

- Streaming
- WebSockets
- Webhooks
- Long-running APIs

## Validation

Always validate:

- Request (Elysia models)
- Response (Elysia models, `response` in route config)
- Environment variables (`@zomlab/env`)

Never trust user input.

## Database

Never expose Prisma directly. Always use repositories. Business logic belongs in services.

## Authentication

All authentication must go through `packages/auth`. Do not duplicate auth implementations. The Elysia `auth` plugin macro is the standard way to protect API routes.

## Error Handling

Return meaningful errors via `ApiError` subclasses (stable `code` + HTTP `status`). Never swallow exceptions. Never expose sensitive information.

## Logging

Log important events. Avoid noisy logs. Never log:

- Passwords
- Secrets
- Tokens
- API keys

## Security

Always consider:

- XSS
- CSRF
- SQL Injection
- Rate Limiting
- Input Validation
- Output Encoding

Security should not be optional.

## Performance

Prefer:

- Memoization
- Lazy Loading
- Dynamic Imports
- Virtualization
- Image Optimization

Measure before optimizing. Do not prematurely optimize.

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

Legacy type-safety contract: the `App` type from `apps/_api/src/app.ts` flows through Eden into the legacy frontend — keep it precise.

---

# Testing

Preferred order

1. Unit
2. Integration
3. E2E

- Vitest runs as workspace projects (root `vitest.config.ts` discovers `apps/*/vitest.config.ts` and `packages/*/vitest.config.ts`). Unit/integration tests sit next to the code (`*.test.ts`).
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
3. Internal packages (`@zomlab/*`, `@api/*`)
4. Relative imports
5. Styles

Keep imports organized.

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

```ts
// Rate limiting is disabled in development to avoid throttling local work.
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

fix(payments): prevent duplicate webhook

refactor(ai): simplify streaming logic

docs(readme): update installation

test(chat): add websocket tests
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
- Check `.agents/skills/` for framework-specific guidance (Better Auth, Elysia, Prisma, UI) before working in those domains.

The goal is to make ZomLab feel like a cohesive, production-quality engineering handbook rather than a collection of disconnected demos.

---

# Other Instructions

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
