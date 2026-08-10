/// <reference types="vite/client" />

import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
  DesktopSidebarTrigger,
  MobileSidebarTrigger,
  SidebarDesktop,
  SidebarInset,
  SidebarMobile,
  SidebarProvider,
  useSidebar,
} from "@zomlab/ui/components/sidebar";
import { THEME_INIT_SCRIPT } from "@zomlab/ui/lib/preferences";
import { GitHubLink } from "~/components/layout/github-link";
import { GlobalSearch } from "~/components/layout/global-search";
import { ProfileButton } from "~/components/layout/profile-button";
import { SidebarNav } from "~/components/layout/sidebar-nav";
import { SiteFooter } from "~/components/layout/site-footer";
import { ThemeControl } from "~/components/theme/theme-control";
import { getSidebarPreference } from "~/lib/sidebar.function";
import { getRouter } from "~/router";

import appCss from "../styles/globals.css?url";

export const Route = createRootRoute({
  loader: () => getSidebarPreference(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZomLab" },
      {
        name: "description",
        content: "A personal software engineering laboratory and interactive knowledge base.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function Devtools() {
  const router = getRouter();
  return (
    <TanStackDevtools
      plugins={[
        { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
        { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel router={router} /> },
      ]}
    />
  );
}

function MobileNavigation() {
  const { setMobileOpen } = useSidebar();
  return (
    <SidebarMobile>
      <SidebarNav onNavigate={() => setMobileOpen(false)} />
    </SidebarMobile>
  );
}

function RootDocument() {
  const sidebarDefaultOpen = Route.useLoaderData();

  return (
    <html lang="en" className="light h-full" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static pre-paint theme bootstrap prevents a color flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="flex min-h-full flex-col bg-sidebar text-foreground">
        <a
          href="#main"
          className="sr-only rounded-md focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:not-sr-only focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <SidebarProvider defaultOpen={sidebarDefaultOpen}>
          <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/92 backdrop-blur-lg">
            <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-1.5 px-2 sm:gap-3 sm:px-4 lg:px-5">
              <MobileSidebarTrigger />
              <DesktopSidebarTrigger />

              <Link
                to="/"
                aria-label="ZomLab"
                className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground"
                >
                  Z
                </span>
                <span className="hidden sm:block">
                  <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
                    ZomLab
                  </span>
                  <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Engineering lab
                  </span>
                </span>
              </Link>

              <GlobalSearch />

              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                <GitHubLink />
                <ThemeControl />
                <ProfileButton />
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-[90rem] flex-1 bg-background lg:my-3 lg:overflow-clip lg:rounded-xl lg:shadow-[var(--surface-shadow)]">
            <SidebarDesktop>
              <SidebarNav />
            </SidebarDesktop>
            <MobileNavigation />

            <SidebarInset>
              <main id="main" className="min-w-0 px-4 py-8 sm:px-7 sm:py-10 lg:px-10 xl:px-12">
                <Outlet />
              </main>
            </SidebarInset>
          </div>

          <SiteFooter />
        </SidebarProvider>

        {import.meta.env.DEV ? <Devtools /> : null}
        <Scripts />
      </body>
    </html>
  );
}
