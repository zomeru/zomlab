import { createFileRoute } from "@tanstack/react-router";
import { TerminalBlock } from "../components/terminal-block";

export const Route = createFileRoute("/")({
  component: GettingStarted,
});

const QUICK_START = [
  { label: "Install dependencies", command: "pnpm install" },
  { label: "Copy environment", command: "cp .env.example .env" },
  { label: "First-time setup", command: "pnpm setup" },
  { label: "Start services", command: "pnpm dev:db" },
  { label: "Generate Prisma client", command: "pnpm db:generate" },
  { label: "Start dev server", command: "pnpm dev" },
];

const DEVELOPMENT_MODES = [
  { label: "Web app", command: "pnpm dev" },
  { label: "API only", command: "pnpm dev:api" },
  { label: "Microservices", command: "pnpm dev:standalone" },
  { label: "Database", command: "pnpm dev:db" },
  { label: "Watch types", command: "pnpm dev:types" },
  { label: "Debug", command: "pnpm dev:debug" },
  { label: "Reset cache", command: "pnpm dev:clean" },
];

const DATABASE_WORKFLOWS = [
  { label: "Generate client", command: "pnpm db:generate" },
  { label: "Push schema", command: "pnpm db:push" },
  { label: "Deploy migrations", command: "pnpm db:deploy" },
  { label: "Create migration", command: "pnpm db:migrate" },
  { label: "Open Studio", command: "pnpm db:studio" },
];

const QUALITY_CHECKS = [
  { label: "Full pipeline", command: "pnpm check:all" },
  { label: "Lint", command: "pnpm lint" },
  { label: "Lint (fix)", command: "pnpm lint:fix" },
  { label: "Format", command: "pnpm format" },
  { label: "Format (check)", command: "pnpm format:check" },
  { label: "Types", command: "pnpm check-types" },
  { label: "Types (watch)", command: "pnpm check-types:watch" },
  { label: "Unit tests", command: "pnpm test" },
  { label: "Unit tests (watch)", command: "pnpm test:watch" },
  { label: "E2E tests", command: "pnpm test:e2e" },
  { label: "Deps consistency", command: "pnpm deps:check" },
  { label: "Deps (fix)", command: "pnpm deps:fix" },
  { label: "Unused code", command: "pnpm deps:unused" },
];

const SECURITY_CHECKS = [
  { label: "Production audit", command: "pnpm security:audit" },
  { label: "Full audit", command: "pnpm security:check" },
];

const SCAFFOLDING = [
  { label: "New package", command: "pnpm generate:package <name>" },
  { label: "Sync versions", command: "pnpm version:sync" },
  { label: "Changesets", command: "pnpm changeset" },
  { label: "Production build", command: "pnpm build" },
  { label: "Storybook", command: "pnpm storybook" },
  { label: "Build storybook", command: "pnpm build-storybook" },
  { label: "Clean workspace", command: "pnpm clean" },
  { label: "Reset install", command: "pnpm reset" },
];

const TECH_STACK = [
  { label: "Framework", value: "TanStack Start + Hono" },
  { label: "Language", value: "TypeScript 6" },
  { label: "Styling", value: "Tailwind CSS v4" },
  { label: "Database", value: "PostgreSQL + Drizzle" },
  { label: "Auth", value: "Better Auth" },
  { label: "Monorepo", value: "Turborepo + pnpm" },
];

const BADGES = ["TanStack Start", "TypeScript 6", "Tailwind v4", "Hono", "Drizzle", "Better Auth"];

const HERO_META = {
  lastUpdated: "August 2026",
  difficulty: "Beginner",
  readingTime: "6 min",
};

function GettingStarted() {
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="font-mono text-sm text-muted-foreground">docs / getting-started</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">Getting Started</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          ZomLab is a personal software engineering laboratory — a single monorepo where every
          feature is a real, production-quality implementation you can run, read, and learn from.
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
        <h2 className="text-2xl font-semibold tracking-tight">What is ZomLab?</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Instead of scattered demo repos, ZomLab keeps everything in one monorepo. Every module
          follows the same architecture — UI, hooks, API layer, services, repositories — so patterns
          learned in one feature transfer to the next. The goal is simple: build once, learn
          forever.
        </p>
        <p className="mt-3 leading-7 text-muted-foreground">
          The codebase is organized around reusable packages (
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            @zomlab/*
          </code>
          ), with a TanStack Start web app, a standalone Hono API, and shared packages for auth,
          database, and UI. Everything is fully typed, tested, and documented as it is built.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Start</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          From a fresh clone to a running dev server in six commands:
        </p>
        <TerminalBlock lines={QUICK_START} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Development Modes</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          The dev scripts cover every workflow — web, API-only, microservices, and tooling. Ports
          3000–3005 are freed automatically before starting so stale servers never collide.
        </p>
        <TerminalBlock lines={DEVELOPMENT_MODES} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Database Workflows</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Drizzle ORM with Neon PostgreSQL lives in{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            @zomlab/database
          </code>
          . The generated client is shared by auth, web, and the API.{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            db:push
          </code>{" "}
          is for rapid prototyping;{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            db:migrate
          </code>{" "}
          keeps a migration history for production.
        </p>
        <TerminalBlock lines={DATABASE_WORKFLOWS} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Quality Checks</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Run the full validation pipeline before committing:
        </p>
        <TerminalBlock lines={QUALITY_CHECKS} />
        <p className="mt-3 leading-7 text-muted-foreground">
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            check:all
          </code>{" "}
          runs Biome → syncpack → knip → TypeScript → Vitest in sequence, so the individual commands
          are there when you want a faster, focused loop.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Dependency audits keep the supply chain clean. Run them regularly, not just before
          release:
        </p>
        <TerminalBlock lines={SECURITY_CHECKS} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Tech Stack</h2>
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
        <h2 className="text-2xl font-semibold tracking-tight">Scaffolding & Tooling</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          New packages are scaffolded with TypeScript and tests pre-configured. Versions stay in
          sync across the workspace via changesets.
        </p>
        <TerminalBlock lines={SCAFFOLDING} />
      </section>

      <hr className="my-12 border-border" />

      <footer className="text-center text-sm text-muted-foreground">
        <em>Build once. Learn forever.</em>
      </footer>
    </div>
  );
}
