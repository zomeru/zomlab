"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { Badge } from "@zomlab/ui/components/badge";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarNav as SidebarNavPrimitive,
} from "@zomlab/ui/components/sidebar";
import { cn } from "@zomlab/ui/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import { getSafeRedirect } from "~/lib/safe-redirect";
import { isNavActive, isSectionActive, NAV, type NavEntry, type NavItem } from "../../lib/nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, redirect } = useLocation({
    select: (location) => ({ pathname: location.pathname, redirect: location.search.redirect }),
  });
  const activePathname = getActivePathname(pathname, redirect);

  return (
    <SidebarNavPrimitive aria-label="Sidebar">
      {NAV.map((entry) => (
        <NavEntryView
          key={entry.label}
          entry={entry}
          pathname={activePathname}
          onNavigate={onNavigate}
        />
      ))}
    </SidebarNavPrimitive>
  );
}

function getActivePathname(pathname: string, redirect: unknown): string {
  if (pathname !== "/login") return pathname;
  return getSafeRedirect(redirect, pathname).split(/[?#]/, 1)[0] ?? pathname;
}

function NavEntryView({
  entry,
  onNavigate,
  pathname,
}: {
  entry: NavEntry;
  onNavigate?: () => void;
  pathname: string;
}) {
  if (entry.type === "link") {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <li>
            <NavLink
              href={entry.href}
              label={entry.label}
              active={isNavActive(pathname, entry.href)}
              onNavigate={onNavigate}
            />
          </li>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  const isActive = isSectionActive(pathname, entry);

  return (
    <SidebarGroup>
      <details open={isActive} className="group/nav-section">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring">
          <SidebarGroupLabel className="min-w-0 flex-1 p-0">{entry.label}</SidebarGroupLabel>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-open/nav-section:rotate-90"
          />
        </summary>
        <SidebarMenu className="mt-1">
          {entry.items.map((item) => (
            <NavItemEntry
              key={item.label}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </details>
    </SidebarGroup>
  );
}

function NavItemEntry({
  item,
  onNavigate,
  pathname,
}: {
  item: NavItem;
  onNavigate?: () => void;
  pathname: string;
}) {
  if ("children" in item) {
    const childActive = item.children.some((child) => isNavActive(pathname, child.href));
    return (
      <li>
        <details open={childActive} className="group/nav-item">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring">
            <span className="min-w-0 flex-1">{item.label}</span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-open/nav-item:rotate-90"
            />
          </summary>
          <SidebarMenu className="ml-3 border-l border-sidebar-border pl-2">
            {item.children.map((child) => (
              <li key={child.href}>
                <NavLink
                  href={child.href}
                  label={child.label}
                  active={isNavActive(pathname, child.href)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </SidebarMenu>
        </details>
      </li>
    );
  }

  if ("href" in item) {
    return (
      <li>
        <NavLink
          href={item.href}
          label={item.label}
          active={isNavActive(pathname, item.href)}
          onNavigate={onNavigate}
        />
      </li>
    );
  }

  return (
    <li className="flex min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground/65">
      <span className="min-w-0 flex-1">{item.label}</span>
      <Badge variant="planned" className="px-1.5 text-[0.625rem] uppercase tracking-wider">
        planned
      </Badge>
    </li>
  );
}

function NavLink({
  active,
  href,
  label,
  onNavigate,
}: {
  active: boolean;
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-9 items-center rounded-md px-2.5 py-2 text-sm leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {label}
    </Link>
  );
}
