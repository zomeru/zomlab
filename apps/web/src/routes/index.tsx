import { createFileRoute } from "@tanstack/react-router";
import { TerminalBlock } from "../components/terminal-block";

export const Route = createFileRoute("/")({
  component: GettingStarted,
});

const LOCAL_SETUP = [
  { label: "Install dependencies", command: "pnpm install --frozen-lockfile" },
  { label: "Copy environment", command: "cp .env.example .env" },
  { label: "Configure environment", command: "nano .env" },
  { label: "Apply migrations", command: "pnpm db:migrate" },
  { label: "Start development", command: "pnpm dev" },
];

const COMMON_WORKFLOWS = [
  { label: "Watch types", command: "pnpm dev:types" },
  { label: "Run all checks", command: "pnpm check:all" },
  { label: "Run browser tests", command: "pnpm test:e2e" },
  { label: "Build the app", command: "pnpm build" },
  { label: "Validate Workers", command: "pnpm cf:validate" },
];

const DATABASE_WORKFLOWS = [
  { label: "Generate migrations", command: "pnpm db:generate" },
  { label: "Apply migrations", command: "pnpm db:migrate" },
  { label: "Push development schema", command: "pnpm db:push" },
  { label: "Open Drizzle Studio", command: "pnpm db:studio" },
];

const DEPLOYMENT_WORKFLOWS = [
  { label: "Deploy staging", command: "pnpm deploy" },
  { label: "Deploy production", command: "pnpm deploy:production" },
];

const TECH_STACK = [
  { label: "Application", value: "TanStack Start + React 19" },
  { label: "API", value: "Embedded Hono + Zod" },
  { label: "Database", value: "Neon PostgreSQL + Drizzle" },
  { label: "Authentication", value: "Better Auth" },
  { label: "Styling", value: "Tailwind CSS v4" },
  { label: "Tooling", value: "TypeScript 6 + pnpm + Turbo" },
];

const BADGES = ["TanStack Start", "React 19", "TypeScript 6", "Hono", "Drizzle", "Better Auth"];

const HERO_META = {
  lastUpdated: "August 2026",
  difficulty: "Beginner",
  readingTime: "4 min",
};

function GettingStarted() {
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="font-mono text-sm text-muted-foreground">docs / getting-started</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">Getting started</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          ZomLab is a personal software engineering lab where working features and their
          documentation live together in one TypeScript monorepo.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technology badges">
          {BADGES.map((badge) => (
            <li
              key={badge}
              className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground"
            >
              {badge}
            </li>
          ))}
        </ul>

        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>Last updated: {HERO_META.lastUpdated}</span>
          <span aria-hidden="true">·</span>
          <span>Difficulty: {HERO_META.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span>Reading time: {HERO_META.readingTime}</span>
        </p>
      </header>

      <hr className="my-10 border-border" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">What ZomLab contains</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          The TanStack Start application in{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            apps/web
          </code>{" "}
          owns both the React interface and an embedded Hono API. Shared workspace packages provide
          authentication, API contracts, database access, environment validation, and development
          tooling.
        </p>
        <p className="mt-3 leading-7 text-muted-foreground">
          Authenticated notes CRUD is the only completed vertical slice. The other topics shown in
          the navigation are planned labs, not implemented integrations.
        </p>
        <p className="mt-4">
          <a
            href="https://github.com/zomeru/zomlab/blob/main/README.md"
            className="font-medium text-link underline underline-offset-4 hover:opacity-80 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Read the repository README
          </a>
          <span className="text-muted-foreground">
            {" "}
            for the complete command and environment reference.
          </span>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Set up the project locally</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Configure an isolated PostgreSQL database and a Better Auth secret with at least 32
          characters before applying the migration.
        </p>
        <TerminalBlock lines={LOCAL_SETUP} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Explore the implemented lab</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          The Core CRUD lab demonstrates authenticated notes from the React form through TanStack
          Query, the typed Hono client, OpenAPI routes, a service and repository, Drizzle, and Neon
          PostgreSQL. Its documentation includes the architecture, request flow, and implementation
          pitfalls.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Run common workflows</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Use the root commands so Turbo can resolve the workspace dependency graph.
        </p>
        <TerminalBlock lines={COMMON_WORKFLOWS} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Manage the database</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Use migrations for tracked schema history. Use{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            db:push
          </code>{" "}
          only when synchronizing a disposable development database.
        </p>
        <TerminalBlock lines={DATABASE_WORKFLOWS} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Review the current stack</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TECH_STACK.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1.5 font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Deploy to Cloudflare Workers</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          The{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            dev
          </code>{" "}
          branch deploys to the staging Worker, while{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            main
          </code>{" "}
          deploys to production. GitHub Actions validates and applies Drizzle migrations before
          deployment.
        </p>
        <TerminalBlock lines={DEPLOYMENT_WORKFLOWS} />
      </section>

      <hr className="my-12 border-border" />

      <footer className="text-center text-sm text-muted-foreground">
        <em>Build once. Learn forever.</em>
      </footer>
    </div>
  );
}
