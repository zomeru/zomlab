import Link from "next/link";
import { GITHUB_URL, SITE_TAGLINE, SITE_VERSION } from "@/lib/site";

const TECH_STACK = ["Next.js", "Elysia", "Prisma", "Better Auth", "Tailwind CSS"];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">ZomLab</p>
            <p className="mt-1 text-sm text-muted-foreground">{SITE_TAGLINE}</p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href={`${GITHUB_URL}/releases`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Changelog
            </a>
            <Link
              href="/status"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Tech Stack
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">License: MIT</p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">{TECH_STACK.join(" · ")}</p>
          <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            v{SITE_VERSION}
          </span>
        </div>
      </div>
    </footer>
  );
}
