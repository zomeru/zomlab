import { cn } from "../lib/utils";

export function Callout({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="callout"
      className={cn(
        "my-6 rounded-lg border border-info/25 bg-info/8 px-4 py-3 text-sm leading-relaxed text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CodeContainer({
  children,
  className,
  label,
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div
      data-slot="code-container"
      className={cn(
        "my-5 overflow-hidden rounded-xl bg-surface-muted shadow-[var(--surface-shadow)]",
        className,
      )}
      {...props}
    >
      {label ? (
        <div className="border-b border-border-subtle px-4 py-2 font-mono text-xs text-muted-foreground">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function DemoPanel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="demo-panel"
      className={cn("my-6 rounded-xl bg-card p-4 shadow-[var(--surface-shadow)] sm:p-6", className)}
      {...props}
    />
  );
}

export function DiagramContainer({ className, ...props }: React.ComponentProps<"figure">) {
  return (
    <figure
      data-slot="diagram-container"
      className={cn(
        "my-6 overflow-hidden rounded-xl bg-card shadow-[var(--surface-shadow)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-wrapper"
      className={cn(
        "my-6 overflow-x-auto overscroll-contain rounded-lg shadow-[var(--surface-shadow)]",
        className,
      )}
      {...props}
    />
  );
}
