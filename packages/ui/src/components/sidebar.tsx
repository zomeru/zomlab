"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

interface SidebarContextValue {
  hydrated: boolean;
  mobileTriggerRef: React.RefObject<HTMLButtonElement | null>;
  mobileOpen: boolean;
  open: boolean;
  setMobileOpen: (open: boolean) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = use(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: Readonly<{ children: React.ReactNode; defaultOpen?: boolean }>) {
  const [open, setOpenState] = useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setHydrated(true), []);

  const setOpen = useCallback((nextOpen: boolean) => {
    setOpenState(nextOpen);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    // biome-ignore lint/suspicious/noDocumentCookie: broad browser support is required for server-readable layout state
    document.cookie = `zomlab_sidebar=${nextOpen}; Path=/; Max-Age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }, []);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const value = useMemo(
    () => ({ hydrated, mobileOpen, mobileTriggerRef, open, setMobileOpen, setOpen, toggle }),
    [hydrated, mobileOpen, open, setOpen, toggle],
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}

export function DesktopSidebarTrigger({ className }: { className?: string }) {
  const { hydrated, open, toggle } = useSidebar();
  const label = open ? "Collapse navigation" : "Expand navigation";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      static
      disabled={!hydrated}
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn("hidden lg:inline-flex", className)}
    >
      {open ? <PanelLeftCloseIcon aria-hidden="true" /> : <PanelLeftOpenIcon aria-hidden="true" />}
    </Button>
  );
}

export function MobileSidebarTrigger({ className }: { className?: string }) {
  const { hydrated, mobileTriggerRef, setMobileOpen } = useSidebar();

  return (
    <Button
      type="button"
      ref={mobileTriggerRef}
      variant="ghost"
      size="icon"
      static
      disabled={!hydrated}
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation"
      title="Open navigation"
      className={cn("lg:hidden", className)}
    >
      <PanelLeftOpenIcon aria-hidden="true" />
    </Button>
  );
}

export function SidebarDesktop({ className, ...props }: React.ComponentProps<"aside">) {
  const { open } = useSidebar();

  return (
    <aside
      data-slot="sidebar-desktop"
      data-state={open ? "expanded" : "collapsed"}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:block",
        open ? "w-64" : "w-0 border-r-0",
        className,
      )}
      {...props}
    >
      <div className="h-full w-64 overflow-y-auto overscroll-contain px-3 py-5">
        {props.children}
      </div>
    </aside>
  );
}

export function SidebarMobile({ children }: Readonly<{ children: React.ReactNode }>) {
  const { mobileOpen, mobileTriggerRef, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="lg:hidden"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          mobileTriggerRef.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse ZomLab labs and documentation.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("min-w-0 flex-1", className)} {...props} />;
}

export function SidebarNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav data-slot="sidebar-nav" className={cn("flex flex-col gap-5", className)} {...props} />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" className={cn("space-y-1", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("space-y-0.5", className)} {...props} />;
}

export function SidebarMenuButton({
  active,
  className,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean }) {
  return (
    <a
      data-slot="sidebar-menu-button"
      data-active={active}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-sm leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}
