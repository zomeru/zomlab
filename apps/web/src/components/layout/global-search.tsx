"use client";

import { useRouter } from "@tanstack/react-router";
import { Button } from "@zomlab/ui/components/button";
import { Input } from "@zomlab/ui/components/input";
import { cn } from "@zomlab/ui/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNavigableItems } from "~/lib/nav";

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return getNavigableItems().filter((item) =>
      `${item.label} ${item.path}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
        setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function navigate(href: string) {
    setQuery("");
    setOpen(false);
    router.navigate({ to: href });
  }

  return (
    <search ref={containerRef} className="relative ml-0 md:ml-3">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        static
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label="Search documentation"
        className="md:hidden"
      >
        <SearchIcon aria-hidden="true" />
      </Button>

      <div
        className={cn(
          "w-[min(28rem,calc(100vw-1.5rem))] md:block md:w-64 lg:w-80",
          open
            ? "fixed left-3 top-[4.25rem] z-50 md:absolute md:left-0 md:top-0 md:z-auto"
            : "hidden md:block",
        )}
      >
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search documentation"
            aria-label="Search documentation"
            aria-controls="search-results"
            className="bg-background pl-9 pr-12 shadow-[var(--surface-shadow)]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground md:block">
            ⌘K
          </kbd>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            static
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="absolute right-1 top-1 md:hidden"
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>

        {open ? (
          <div
            id="search-results"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-[var(--overlay-shadow)]"
          >
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground" role="status">
                {query.trim()
                  ? `No results for “${query.trim()}”`
                  : "Start typing to search the docs."}
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
                {results.map((item) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => navigate(item.href)}
                      className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.path ? (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {item.path}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </search>
  );
}
