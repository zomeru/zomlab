# AGENTS.md

This file describes the repository as it exists. Treat source files, manifests, and configuration as authoritative when this guide and the implementation disagree.

## Project scope

ZomLab is a private TypeScript monorepo for executable software engineering labs. The current application combines an interactive documentation site with working Core foundation, authenticated notes, and private file-upload examples.

The Core section is implemented end to end. Labels outside Core in `apps/web/src/lib/nav.ts` are mostly placeholders marked `planned`; do not infer corresponding modules or integrations from the navigation.

## Start every task with repository evidence

Before a substantial change:

1. Run `git status --short` and preserve unrelated user changes.
2. Run `pnpm dlx @tanstack/intent@latest list` from the repository root.
3. Load the most specific matching Intent skill with `pnpm dlx @tanstack/intent@latest load <package>#<skill>`.
4. If `graphify-out/graph.json` exists, run `graphify query "<question>"` before broad codebase exploration. Use `graphify path` for relationships and `graphify explain` for a focused concept.
5. Inspect the package manifest and nearby tests before editing a module.

Use current library documentation when a task depends on framework, SDK, API, CLI, or cloud behavior. Prefer Context7 when it is available. Do not use documentation lookup as a substitute for reading this repository's implementation.

After code changes, run `graphify update .` to refresh the generated knowledge graph.

## Runtime and workspace

- Node.js: `>=24.18.1`, pinned in `.node-version`
- Package manager: pnpm `11.20.0`, pinned in `package.json` and the lockfile
- Language: TypeScript 6 with strict checking
- Workspace globs: `apps/*`, `packages/*`, and `scripts`
- Task runner: Turborepo
- Module style: ECMAScript modules in app and package manifests

Use pnpm for dependency and script operations. Run Turbo-aware commands from the repository root; do not use `--cwd` to bypass the workspace graph. Internal packages use `@zomlab/*` names and `workspace:*` dependencies.

## Architecture and module boundaries

### `apps/web`

`apps/web` is the only application. TanStack Start renders the React application and owns server routes. The Cloudflare Vite plugin builds the app for Cloudflare Workers.

Important directories:

- `src/routes/`: TanStack Router file routes, protected layout, and server route adapters
- `src/integration/hono/`: Hono app composition, errors, middleware, feature routes, and services
- `src/labs/core/`: Core overview content, interactive demos, notes hooks, and upload hooks
- `src/components/`: shared auth, layout, MDX, terminal, and theme components
- `src/lib/`: typed API client, auth server function, navigation model, and helpers
- `src/styles/`: Tailwind import, semantic theme tokens, and global rules

The root route renders the document shell, header, sidebar, footer, development-only TanStack devtools, and the route outlet. `src/start.ts` adds server-function CSRF protection and private cache headers for HTML responses.

### HTTP request flow

`src/routes/api/$.ts` forwards `/api/*` requests to the Hono `apiApp`. The Hono app uses `/api` as its base path and composes request IDs, context storage, logging, timing, CSRF protection, Cloudflare rate limiting, private response headers, note-service injection, and feature routes.

`src/routes/api/auth/$.ts` forwards `/api/auth/*` directly to Better Auth and adds private cache headers. Auth traffic does not pass through the Hono app.

The notes flow is:

```text
React component
  -> TanStack Query hook
  -> hono/client proxy
  -> Hono OpenAPI route
  -> requireAuth middleware
  -> NoteService
  -> NoteRepository
  -> Drizzle
  -> PostgreSQL
```

Use `~/` for imports rooted at `apps/web/src`. Client API calls go through `src/lib/api.ts`; do not introduce raw `fetch` calls for existing Hono endpoints.

### `packages/auth`

This package owns Better Auth configuration and the React client.

- `src/auth.server.ts` builds Better Auth lazily and exports inferred auth types
- `src/client.ts` exports `authClient`
- `src/auth-environment.ts` distinguishes local auth URLs from deployed staging and production URLs

Authentication uses the Drizzle adapter, email and password login, encrypted OAuth tokens, database-backed rate limits in deployed environments, conditional GitHub and Google providers, and TanStack Start cookies. The magic-link plugin is enabled only when the auth URL is local; its development callback logs the email and URL.

Keep all authentication configuration in this package. Protect API routes with `requireAuth`; protect page navigation with the `_authenticated` layout.

### `packages/contracts`

This package owns shared Zod schemas and inferred types for notes, API errors, and system responses. Hono routes and consumers import contracts from `@zomlab/contracts`.

Change the schema before updating producers and consumers. Keep request and response shapes strict where the current contract uses `z.strictObject`.

### `packages/database`

This package owns the Neon HTTP client, Drizzle schema, repositories, and generated migrations.

- `src/client.ts` lazily creates the database client
- `src/db/schema/auth.ts` defines Better Auth tables and relations
- `src/db/schema/core/crud.ts` defines notes and ownership relations
- `src/repositories/core/crud.ts` is the notes data-access layer
- `drizzle.config.ts` configures PostgreSQL migrations

Routes and React code must not import Drizzle. Add database access to a repository and call it from a service or auth adapter.

`createNoteService(repository)` receives a `NoteRepository` from the notes route composition boundary. Reads, updates, and deletes return `null` only when an owned note is missing. Route handlers translate those null results to `NoteNotFoundError`. Repository failures must escape to `apiErrorHandler`, which logs the private failure and returns a masked 500 response.

### Supporting packages

- `@zomlab/env`: lazy Zod validation of process and Cloudflare Worker variables
- `@zomlab/tsconfig`: strict shared TypeScript presets
- `@zomlab/ui`: 3 small Storybook components; the web app does not currently consume this package
- `@zomlab/vitest-config`: shared Vitest timeouts and thread-pool defaults
- `@zomlab/scripts`: workspace metadata for root TypeScript scripts

## Routing conventions

TanStack Router generates the route tree from filenames in `apps/web/src/routes`.

- `__root.tsx` is the document root
- `_authenticated.tsx` is a pathless protected layout
- Dots represent nested URL segments
- `$id` represents a dynamic segment
- `$.ts` is a splat server route
- `index.tsx` represents the parent index route

Never edit `apps/web/src/routeTree.gen.ts`. Run the normal TanStack Start development or build tooling to regenerate it.

## Frontend patterns

- Components use PascalCase exports and kebab-case filenames
- Hooks use `use-*.ts` filenames and `useSomething` exports
- Client-interactive components generally declare `"use client"` and use React state or effects
- TanStack Query owns server state; use the stable factories in `src/lib/query-keys.ts` for health, files, note lists, and note details
- Parse typed Hono responses with `readJsonResponse`; validated public error envelopes become `ApiResponseError`, while malformed failures use stable fallback copy
- Require the shared alert dialog before destructive note or file mutations; preserve keyboard focus when a dialog closes
- The typed Hono client includes cookies with `credentials: "include"`
- Authenticated pages use the `_authenticated` route guard and `getSession()` server function
- Forms are controlled React forms; API schemas enforce server-side constraints
- MDX files receive the custom component map from `src/mdx-components.tsx`

Use semantic Tailwind tokens such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-link`, and `text-destructive`. Theme colors are OKLCH variables in `src/styles/globals.css`.

Preserve the accessibility patterns already present: semantic elements, real labels, visible `focus-visible` rings, keyboard access, skip navigation, `role="status"`, `role="alert"`, and reduced-motion variants.

## API patterns

The Hono application uses `OpenAPIHono` and `createRoute` from `@hono/zod-openapi`. Request and response schemas come from `@zomlab/contracts`.

Current public API behavior:

- System routes: `/api/health`, `/api/ready`, and `/api/version`
- Protected notes routes: list, get, create, update, and delete under `/api/notes`
- Notes OpenAPI document: `/api/notes/docs`
- Auth routes: `/api/auth/*`

Use stable error envelopes shaped as `{ error: { code, message, detail? } }`. `apiErrorHandler` converts `ApiError`, Zod, and Hono `HTTPException` instances and masks unknown server errors. Validation errors use status 422. Missing or non-owned notes return 404. Do not catch repository exceptions as not-found results: unexpected storage failures must remain masked 500 responses.

Private HTML, auth, and notes responses must retain `Cache-Control: private, no-store`, `Pragma: no-cache`, and an appropriate `Vary` header.

## Environment handling

`.env.example` is the committed variable inventory. `@zomlab/env` validates:

- `APP_ENV`
- `DATABASE_URL`
- `E2E_PORT`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_ALLOWED_HOSTS`
- GitHub OAuth client ID and secret
- Google OAuth client ID and secret

Update `.env.example`, the Zod schema, Worker types, and relevant workflow variables together when the environment contract changes. Never read or print secret values during routine repository inspection.

Cloudflare supplies `MY_RATE_LIMITER` as a binding, not an `.env` string. `wrangler.jsonc` defines the binding for staging and production.

## TypeScript and formatting

Handwritten TypeScript uses strict mode, `noUncheckedIndexedAccess`, 2-space indentation, double quotes, semicolons, trailing commas, and a 100-character formatter width. Let Biome organize imports.

Prefer inferred types for local values. Add explicit interfaces or return types at package and dependency-injection boundaries. Avoid `any`, suppression comments, and unchecked casts in handwritten code. Use early returns and keep files focused.

Naming patterns in the repository:

- Folders and ordinary files: kebab-case
- React components and exported types: PascalCase
- Functions and variables: camelCase
- React hooks: `useSomething`
- Factory functions: `createSomething`
- Constants: uppercase snake case
- Unit tests: `*.test.ts`
- Playwright tests: `*.spec.ts`

## Tests

Vitest uses a root workspace configuration that discovers app, package, and script projects. Shared defaults live in `@zomlab/vitest-config`.

Run:

```bash
pnpm test
pnpm test:workers
pnpm test:watch
pnpm test:e2e
```

`pnpm test` runs the regular Vitest workspace and excludes `*.worker.test.ts`. `pnpm test:workers` runs those files through `@cloudflare/vitest-pool-workers` in workerd with the staging Wrangler configuration and local bindings. Unit and integration tests cover API error handling, note-service boundaries, query keys, R2 storage, safe redirects, authentication environment behavior, environment precedence, workflow linting, package-manager policy, setup behavior, and package generation.

Playwright starts the web app through Turbo on `E2E_PORT`, which defaults to 3100 for the test runner. The suite covers browser authentication, notes CRUD, ownership and validation contracts, system endpoints, MDX rendering, cache headers, themes, and screenshots. Tests create real database records, so use an isolated database.

Prefer unit tests for pure behavior, integration tests for module boundaries, API contract tests for response guarantees, and Playwright for browser workflows. Test behavior instead of implementation details.

## Quality gates

The main local gate is:

```bash
pnpm check:all
```

It runs these checks in order:

1. GitHub Actions workflow linting
2. Biome linting and formatting checks
3. syncpack dependency policy
4. Knip unused-code checks
5. Workspace TypeScript checks
6. Regular Vitest workspace
7. Worker-only Vitest suite in workerd

Run `pnpm test:e2e` separately when the change affects routing, authentication, API contracts, database behavior, rendered documentation, or UI workflows. Run `pnpm build` for application or deployment changes. Run `pnpm cf:validate` for Worker configuration or binding changes.

Git hooks enforce Conventional Commits, staged Biome fixes, workflow linting, and dependency consistency. CI adds a build, Worker type generation, deployment dry runs, and a production dependency audit.

## Database workflow

Schema source files live under `packages/database/src/db/schema`.

- Generate migrations: `pnpm db:generate`
- Validate migrations: `pnpm db:check`
- Apply migrations: `pnpm db:migrate`
- Push schema without migration history: `pnpm db:push`
- Inspect data: `pnpm db:studio`

Never hand-edit files under `packages/database/drizzle/`. Generate them with Drizzle Kit and review the generated SQL.

## Deployment

The web app deploys to Cloudflare Workers. `apps/web/wrangler.jsonc` defines:

- Staging Worker: `zomlab-staging`
- Production Worker: `zomlab`
- `nodejs_compat`
- Worker logs and traces
- Preview URLs
- The `MY_RATE_LIMITER` binding

The `dev` branch deploys to staging and `main` deploys to production. The deployment workflow validates and applies Drizzle migrations before deployment. Treat Cloudflare account credentials, API tokens, database URLs, and authentication secrets as externally provisioned secrets.

## Generated and external material

Do not manually edit:

- `apps/web/src/routeTree.gen.ts`
- `apps/web/worker-configuration.d.ts`
- `packages/database/drizzle/*.sql`
- `packages/database/drizzle/meta/*`
- `graphify-out/*`

`.agents/skills/` contains installed external guidance tracked by `skills-lock.json`. `.claude/skills/` contains aliases to those skills. Load only the guidance relevant to the package or concern being changed.

## Current inconsistencies and work in progress

Future agents must account for these verified inconsistencies:

- Core labs are implemented. Most navigation entries outside Core are plans without routes or modules.
- `packages/ui` still contains create-turbo-style sample components. The web app does not depend on `@zomlab/ui`, and `SiteFooter` is separate from the footer currently rendered by `__root.tsx`.
- `scripts/setup.ts` still labels Drizzle migration generation as “Generating Prisma client”, and its test repeats that wording.
- `packages/tsconfig/nextjs.json`, Prisma build allowances, Prisma editor settings, a legacy syncpack group, and standalone API debug tasks remain from earlier tooling. They are not evidence that Next.js, Prisma, or a standalone API is active.
- Playwright visual test names include the word `legacy`; they still run against the current routes.
- `apps/web/src/routes/status.tsx` contains a parenthesized `"use client"` expression after its route export, so it is not a module directive.
- `apps/web/src/env.d.ts` declares `VITE_SITE_URL`, but the app does not use it and `.env.example` does not define it.
- The `HonoEnv` binding type omits `BETTER_AUTH_ALLOWED_HOSTS`, although the generated Worker type, `@zomlab/env`, and `.env.example` define it.
- `test.md` is a historical migration-verification prompt. `test.sh` is a local editor-history recovery utility, not part of the automated test suite.

Do not build new work on these leftovers. Verify whether a cleanup is in scope, then remove or update stale pieces with focused tests.
