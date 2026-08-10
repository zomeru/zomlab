import { Link } from "@tanstack/react-router";
import { Badge } from "@zomlab/ui/components/badge";

const TECH_STACK = ["TanStack Start", "Hono", "Drizzle", "Better Auth", "Tailwind CSS"];

export function SiteFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-semibold">ZomLab</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              An executable engineering lab where documentation and working software evolve
              together.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a
              href="https://github.com/zomeru/zomlab"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-sidebar-foreground"
            >
              GitHub
            </a>
            <a
              href="https://github.com/zomeru/zomlab/releases"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-sidebar-foreground"
            >
              Changelog
            </a>
            <Link
              to="/status"
              className="text-muted-foreground transition-colors hover:text-sidebar-foreground"
            >
              System status
            </Link>
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-sidebar-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{TECH_STACK.join(" · ")}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">MIT</span>
            <Badge variant="outline">v0.1.0</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
