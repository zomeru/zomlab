# ZomLab

ZomLab is a personal software engineering lab and executable knowledge base. It keeps working examples, their documentation, and the infrastructure needed to run them in one TypeScript monorepo.

The implemented vertical slice is an authenticated notes lab. It includes file-based pages, an HTTP API, shared validation contracts, service and repository layers, PostgreSQL persistence, end-to-end tests, and MDX documentation with Mermaid diagrams. The navigation lists additional lab topics as planned work.

## Current stack

| Area | Implementation |
| --- | --- |
| Runtime | Node.js 24.18.1 or newer, pnpm 11.20.0 |
| Monorepo | pnpm workspaces and Turborepo 2 |
| Web application | React 19, TanStack Start, TanStack Router, Vite 8 |
| Client data | TanStack Query and the typed Hono client |
| API | Hono with OpenAPI route definitions and Zod 4 contracts |
| Authentication | Better Auth with email and password, optional GitHub and Google OAuth, and a development-only magic-link plugin |
| Database | PostgreSQL on Neon, Drizzle ORM, and Drizzle Kit migrations |
| Styling and content | Tailwind CSS 4, MDX, GitHub Flavored Markdown, and Mermaid |
| Deployment | Cloudflare Workers through the Cloudflare Vite plugin and Wrangler |
| Tests and component docs | Vitest 4, Playwright, and Storybook 10 |
| Quality tooling | Biome, actionlint, syncpack, Knip, TypeScript, Husky, lint-staged, and Changesets |

Dependency ranges live in the workspace manifests. Resolved versions live in `pnpm-lock.yaml`.

## Prerequisites

Install these tools and services before running the app:

- Node.js 24.18.1 or newer
- pnpm 11.20.0
- A PostgreSQL database reachable through a URL accepted by the Neon serverless driver
- A 32-character or longer Better Auth secret

Cloudflare credentials are only required for deployment and Worker validation commands that contact Cloudflare.

## Set up locally

Install the locked dependencies:

```bash
pnpm install --frozen-lockfile
```

Create the local environment file:

```bash
cp .env.example .env
```

Edit `.env` with a working database URL, authentication secret, and local authentication URL. Apply the checked-in migration, then start the app:

```bash
pnpm db:migrate
pnpm dev
```

The development server uses port `3000` unless `E2E_PORT` overrides it. `pnpm dev` clears listeners on ports 3000 through 3005 and 8787 before starting the `@zomlab/web` Turbo task.

For a disposable development database, `pnpm db:push` synchronizes the schema directly instead of applying migration history.

The optional `pnpm setup` helper runs `pnpm install`, copies `.env.example` when `.env` is missing, and runs `pnpm db:generate`. It does not apply or push the database schema.

## Environment variables

Server variables are validated lazily by `@zomlab/env`. Invalid required values throw an error when server configuration is first accessed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL used by Drizzle and Neon |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret, minimum 32 characters |
| `BETTER_AUTH_URL` | Yes | Fallback base URL for authentication requests |
| `BETTER_AUTH_ALLOWED_HOSTS` | Recommended | Comma-separated hostnames accepted by Better Auth; the host from `BETTER_AUTH_URL` is always added |
| `APP_ENV` | No | `staging` or `production`; defaults to `staging` |
| `E2E_PORT` | No | Development and Playwright server port; defaults to `3100` in environment validation and Playwright, while Vite defaults to `3000` when it is unset |
| `GITHUB_CLIENT_ID` | No | Enables GitHub OAuth when paired with `GITHUB_CLIENT_SECRET` |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth secret |
| `GOOGLE_CLIENT_ID` | No | Enables Google OAuth when paired with `GOOGLE_CLIENT_SECRET` |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |

The deployed Worker also requires the `MY_RATE_LIMITER` Cloudflare rate-limit binding. `apps/web/wrangler.jsonc` defines it for the staging and production environments.

Keep `.env` and `apps/web/.dev.vars` private. The repository tracks only `.env.example`.

## Application architecture

The browser renders TanStack Router routes from `apps/web`. Requests under `/api/*` enter TanStack Start server handlers and are forwarded to the Hono application. Auth requests use the Better Auth handler directly.

```text
Browser
  -> TanStack Start routes and React components
     -> TanStack Query hooks
        -> typed Hono client
           -> /api/* TanStack Start server route
              -> Hono middleware and OpenAPI routes
                 -> NoteService
                    -> NoteRepository
                       -> Drizzle ORM
                          -> Neon PostgreSQL

/api/auth/*
  -> Better Auth
     -> Drizzle adapter
        -> Neon PostgreSQL
```

The API currently exposes:

- `GET /api/health`
- `GET /api/ready`
- `GET /api/version`
- `GET /api/notes` and `GET /api/notes/:id`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`
- Better Auth endpoints under `/api/auth/*`
- An OpenAPI 3.1 document for notes at `/api/notes/docs`

All notes routes require a session and scope database operations to the authenticated user. Private HTML, authentication, and notes responses disable shared caching.

## Workspace structure

```text
apps/
  web/                    TanStack Start app, Hono API, UI, routes, and lab content
packages/
  auth/                   Better Auth server options and React client
  contracts/              Shared Zod request and response schemas
  database/               Drizzle client, schema, migrations, and repositories
  env/                    Runtime environment validation
  tsconfig/               Shared TypeScript configurations
  ui/                     Small Storybook component workspace
  vitest-config/          Shared Vitest defaults
scripts/                  Setup, package generation, version sync, and workflow linting
e2e/                      Playwright browser and API contract tests
.github/workflows/        Continuous integration, end-to-end tests, and deployment
graphify-out/             Generated code knowledge graph
```

Inside `apps/web/src`:

- `routes/` contains TanStack Router file routes and API server routes
- `integration/hono/` contains Hono composition, middleware, errors, feature routes, and services
- `labs/core/crud/` contains the notes UI, TanStack Query hooks, and MDX documentation
- `components/` contains shared application components
- `lib/` contains the typed API client, auth server function, navigation model, and shared helpers
- `styles/` contains Tailwind theme tokens and global styles

## Root commands

Run root commands from the repository root.

### Development and setup

| Command | Effect |
| --- | --- |
| `pnpm setup` | Install dependencies, create `.env` when missing, and generate Drizzle migrations |
| `pnpm reset` | Clean generated local state, reinstall dependencies, and generate migrations |
| `pnpm dev` | Clear development ports and start the staging Worker-compatible app |
| `pnpm dev:types` | Watch workspace type-check tasks |
| `pnpm dev:clean` | Clear Turbo state |
| `pnpm dev:debug` | Start development with the Node inspector on port 9229 |
| `pnpm kill:ports` | Stop listeners on development ports |
| `pnpm kill:e2e-port` | Stop the listener on `E2E_PORT` or port 3100 |
| `pnpm clean` | Remove workspace dependencies, caches, builds, reports, and generated output |

### Build, Cloudflare, and deployment

| Command | Effect |
| --- | --- |
| `pnpm build` | Build the staging app and type-check it |
| `pnpm build:production` | Build the production app and type-check it |
| `pnpm deploy` | Build and deploy the staging Worker |
| `pnpm deploy:production` | Build and deploy the production Worker |
| `pnpm versions:upload` | Upload a staging Worker version without deploying it |
| `pnpm versions:upload:production` | Upload a production Worker version without deploying it |
| `pnpm cf:typegen` | Regenerate Cloudflare Worker types |
| `pnpm cf:validate` | Check Worker types and dry-run both deployment environments |
| `pnpm cf:startup` | Build the app and capture a Worker startup profile |

### Quality and tests

| Command | Effect |
| --- | --- |
| `pnpm check:all` | Run workflow linting, Biome, syncpack, Knip, TypeScript, and Vitest |
| `pnpm lint:workflows` | Lint all GitHub Actions workflows with the pinned actionlint package |
| `pnpm lint` | Check repository files with Biome |
| `pnpm lint:fix` | Apply Biome fixes |
| `pnpm format` | Format repository files with Biome |
| `pnpm format:check` | Check formatting without changes |
| `pnpm check-types` | Run all workspace type checks through Turbo |
| `pnpm check-types:watch` | Watch all workspace type checks |
| `pnpm test` | Run the Vitest workspace with environment loading |
| `pnpm test:turbo` | Run package test tasks through Turbo |
| `pnpm test:watch` | Start Vitest in watch mode |
| `pnpm test:e2e` | Start the app and run Playwright tests |
| `pnpm deps:check` | Check dependency policies with syncpack |
| `pnpm deps:fix` | Apply syncpack dependency fixes |
| `pnpm deps:unused` | Check unused files, exports, and dependencies with Knip |
| `pnpm security:audit` | Audit production dependencies |
| `pnpm security:check` | Audit all dependencies |
| `pnpm storybook` | Start the `@zomlab/ui` Storybook on port 6006 |
| `pnpm build-storybook` | Build the static Storybook |

### Database and release maintenance

| Command | Effect |
| --- | --- |
| `pnpm db:generate` | Generate Drizzle migrations from the schema |
| `pnpm db:migrate` | Apply checked-in migrations |
| `pnpm db:push` | Push the current schema directly to the database |
| `pnpm db:pull` | Introspect the database schema |
| `pnpm db:export` | Export the Drizzle schema as SQL |
| `pnpm db:check` | Validate migration consistency |
| `pnpm db:up` | Upgrade Drizzle snapshot metadata |
| `pnpm db:studio` | Start Drizzle Studio |
| `pnpm generate:package <name>` | Create a kebab-case package scaffold under `packages/` |
| `pnpm changeset` | Create a Changesets release note |
| `pnpm version:packages` | Apply pending changesets to workspace versions |
| `pnpm version:sync` | Copy the root version to app and package manifests |

`pnpm with-env -- <command>` is the internal wrapper used by scripts that need values from `.env`. The `prepare` lifecycle installs Husky hooks.

## Testing

Vitest discovers workspace projects from the app, packages, and `scripts/`. Tests cover API error normalization, redirect safety, auth environment hardening, environment precedence, workflow syntax, package-manager policy, setup behavior, and package generation.

Playwright starts `@zomlab/web` on `E2E_PORT`, then exercises:

- Authentication redirects, session persistence, logout, and relogin
- Notes creation, editing, deletion, ownership, validation, and API contracts
- System API contracts
- MDX and Mermaid rendering
- Page structure, cache headers, theme behavior, and visual captures

The end-to-end suite creates real users and notes in the configured database. Use an isolated development or staging database.

## Deployment

`apps/web/wrangler.jsonc` defines 2 Workers:

- `zomlab-staging` for the Wrangler `staging` environment
- `zomlab` for the Wrangler `production` environment

Both environments use the `nodejs_compat` flag, observability, preview URLs, and the `MY_RATE_LIMITER` binding. Store database and authentication secrets in Cloudflare. Do not add them to `wrangler.jsonc`.

GitHub Actions deploys the `dev` branch to staging and `main` to production. The deployment workflow validates and applies Drizzle migrations before it deploys the Worker. CI also builds the app, regenerates Worker types, performs deployment dry runs, and audits production dependencies.

## License

[MIT](LICENSE)
