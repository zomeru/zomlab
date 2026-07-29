export default function GettingStarted() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Getting Started
      </h1>
      <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
        Welcome to ZomLab — a personal engineering laboratory and interactive knowledge base.
      </p>

      <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">What is ZomLab?</h2>
          <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
            ZomLab is where I learn, experiment, document, and showcase modern technologies through
            real, interactive implementations. Instead of scattered demo repos, everything lives in
            one monorepo with production-like architecture.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Quick Start</h2>
          <div className="mt-3 space-y-2 text-sm">
            <CodeLine label="Install dependencies" command="bun install" />
            <CodeLine label="Copy environment" command="cp .env.example .env" />
            <CodeLine label="Start services" command="bun run dev:db" />
            <CodeLine label="Generate Prisma client" command="bun run db:generate" />
            <CodeLine label="Start dev server" command="bun run dev" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Quality Checks</h2>
          <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Run the full validation pipeline before committing:
          </p>
          <div className="mt-3 text-sm">
            <CodeLine label="Full check" command="bun run check:all" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Tech Stack</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <TechItem label="Framework" value="Next.js 16 + Elysia" />
            <TechItem label="Language" value="TypeScript 6" />
            <TechItem label="Styling" value="Tailwind CSS v4" />
            <TechItem label="Database" value="PostgreSQL + Prisma v7" />
            <TechItem label="Auth" value="Better Auth" />
            <TechItem label="Monorepo" value="Turborepo + Bun" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
            Creating a New Package
          </h2>
          <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Use the package generator to scaffold a new{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
              @zomlab/*
            </code>{" "}
            package with TypeScript and tests pre-configured:
          </p>
          <div className="mt-3 text-sm">
            <CodeLine label="Scaffold" command="bun run generate:package &lt;name&gt;" />
          </div>
        </div>
      </section>

      <hr className="my-12 border-zinc-200 dark:border-zinc-800" />

      <footer className="text-center text-sm text-zinc-400">
        <em>Build once. Learn forever.</em>
      </footer>
    </div>
  );
}

function CodeLine({ label, command }: { label: string; command: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <code className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {command}
      </code>
    </div>
  );
}

function TechItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 dark:text-zinc-400">{label}:</span>
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}
