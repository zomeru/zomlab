"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { getSafeRedirect } from "~/lib/safe-redirect";
import { isNavActive, isSectionActive, NAV, type NavEntry, type NavItem } from "../../lib/nav";

export function SidebarNav() {
  const { pathname, redirect } = useLocation({
    select: (loc) => ({ pathname: loc.pathname, redirect: loc.search.redirect }),
  });
  const activePathname = getActivePathname(pathname, redirect);

  return (
    <nav aria-label="Sidebar" className="flex flex-col gap-4">
      {NAV.map((entry) => (
        <NavEntryView key={entry.label} entry={entry} pathname={activePathname} />
      ))}
    </nav>
  );
}

function getActivePathname(pathname: string, redirect: unknown): string {
  if (pathname !== "/login") return pathname;

  return getSafeRedirect(redirect, pathname).split(/[?#]/, 1)[0] ?? pathname;
}

function NavEntryView({ entry, pathname }: { entry: NavEntry; pathname: string }) {
  if (entry.type === "link") {
    return (
      <ul className="space-y-0.5">
        <li>
          <NavLink
            href={entry.href}
            label={entry.label}
            active={isNavActive(pathname, entry.href)}
          />
        </li>
      </ul>
    );
  }

  const isActive = isSectionActive(pathname, entry);

  return (
    <details open={isActive} className="group">
      <summary className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring list-none">
        <span className="min-w-0 flex-1">{entry.label}</span>
        <ChevronIcon />
      </summary>

      <ul className="mt-0.5 space-y-0.5">
        {entry.items.map((item) => (
          <NavItemEntry key={item.label} item={item} pathname={pathname} />
        ))}
      </ul>
    </details>
  );
}

function NavItemEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  if ("children" in item) {
    return (
      <li>
        <p className="px-3 py-1.5 text-sm font-medium text-foreground">{item.label}</p>
        <ul className="ml-3 space-y-0.5 border-l border-border pl-2">
          {item.children.map((child) => (
            <li key={child.href}>
              <NavLink
                href={child.href}
                label={child.label}
                active={isNavActive(pathname, child.href)}
              />
            </li>
          ))}
        </ul>
      </li>
    );
  }

  if ("href" in item) {
    return (
      <li>
        <NavLink href={item.href} label={item.label} active={isNavActive(pathname, item.href)} />
      </li>
    );
  }

  return (
    <li>
      <span className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground/50">
        {item.label}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/40">
          planned
        </span>
      </span>
    </li>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="size-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none group-open:rotate-90"
    >
      <path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
