import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { GitHubLink } from "../components/layout/github-link";
import { GlobalSearch } from "../components/layout/global-search";
import { ProfileButton } from "../components/layout/profile-button";
import { SidebarNav } from "../components/layout/sidebar-nav";
import { ThemeToggle } from "../components/theme/theme-toggle";

import "../styles/globals.css";
import { getRouter } from "~/router";

export const Route = createRootRoute({
  component: RootDocument,
});

function Devtools() {
  const router = getRouter();

  return (
    <TanStackDevtools
      plugins={[
        {
          name: "TanStack Query",
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
      ]}
    />
  );
}

function RootDocument() {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only rounded-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto flex h-14 w-full max-w-350 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground"
              >
                Z
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">ZomLab</span>
            </Link>

            <GlobalSearch />

            <div className="ml-auto flex items-center gap-1.5">
              <GitHubLink />
              <ThemeToggle />
              <ProfileButton />
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-350 flex-1">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-sidebar px-4 py-6 md:block">
            <SidebarNav />
          </aside>

          <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
            <Outlet />
          </main>
        </div>

        <footer className="border-t border-border py-8">
          <div className="mx-auto max-w-350 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">ZomLab</p>
                <p className="mt-1 text-sm text-muted-foreground">Interactive Engineering Lab</p>
                <p className="mt-1 text-xs text-muted-foreground">License: MIT</p>
              </div>
              <nav aria-label="Footer" className="flex gap-6">
                <a
                  href="https://github.com/zomeru/zomlab"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/zomeru/zomlab/releases"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Changelog
                </a>
                <a href="/status" className="text-sm text-muted-foreground hover:text-foreground">
                  Tech Stack
                </a>
              </nav>
            </div>
            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                TanStack Start &middot; Hono &middot; Drizzle &middot; Better Auth &middot; Tailwind
                CSS
              </p>
              <p className="text-xs text-muted-foreground">v0.1.0</p>
            </div>
          </div>
        </footer>
        <Devtools />
      </body>
      <Scripts />
    </html>
  );
}
