import { cn } from "../lib/utils";

export function EmptyState({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyStateTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="empty-state-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function EmptyStateDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn("mt-1 text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}
