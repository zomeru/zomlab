"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { isNavActive, isSectionActive, NAV, type NavEntry, type NavItem } from "../../lib/nav";

export function SidebarNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const activeSection = NAV.find((entry) => isSectionActive(pathname, entry))?.label;
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection] : []),
  );

  function toggleSection(label: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <nav aria-label="Sidebar" className="flex flex-col gap-4">
      {NAV.map((entry) => (
        <NavEntryView
          key={entry.label}
          entry={entry}
          pathname={pathname}
          open={entry.type === "section" && openSections.has(entry.label)}
          onToggle={() => toggleSection(entry.label)}
        />
      ))}
    </nav>
  );
}

function NavEntryView({
  entry,
  pathname,
  open,
  onToggle,
}: {
  entry: NavEntry;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
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

  const contentId = `nav-section-${entry.label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">{entry.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul id={contentId} className="mt-0.5 space-y-0.5">
          {entry.items.map((item) => (
            <NavItemEntry key={item.label} item={item} pathname={pathname} />
          ))}
        </ul>
      )}
    </div>
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`size-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
        open ? "rotate-90" : ""
      }`}
    >
      <path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
