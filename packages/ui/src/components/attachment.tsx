import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Button } from "./button";

const attachmentVariants = cva(
  "group/attachment relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-card text-card-foreground shadow-[var(--surface-shadow)] transition-[box-shadow,color] data-[state=error]:text-destructive",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
      size: {
        default: "min-h-20 p-4",
        sm: "min-h-16 p-3",
        xs: "min-h-12 gap-2 rounded-lg p-2",
      },
    },
    defaultVariants: { orientation: "horizontal", size: "default" },
  },
);

export type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done";

export function Attachment({
  className,
  orientation,
  size,
  state = "done",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & { state?: AttachmentState }) {
  return (
    <div
      className={cn(attachmentVariants({ className, orientation, size }))}
      data-orientation={orientation ?? "horizontal"}
      data-size={size ?? "default"}
      data-slot="attachment"
      data-state={state}
      {...props}
    />
  );
}

export function AttachmentMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive [&_svg]:size-5",
        className,
      )}
      data-slot="attachment-media"
      {...props}
    />
  );
}

export function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("min-w-0 flex-1 space-y-1", className)}
      data-slot="attachment-content"
      {...props}
    />
  );
}

export function AttachmentTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "truncate text-sm font-semibold text-foreground group-data-[state=error]/attachment:text-destructive group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse",
        className,
      )}
      data-slot="attachment-title"
      {...props}
    />
  );
}

export function AttachmentDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("truncate text-sm text-muted-foreground", className)}
      data-slot="attachment-description"
      {...props}
    />
  );
}

export function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative z-10 flex shrink-0 items-center gap-1", className)}
      data-slot="attachment-actions"
      {...props}
    />
  );
}

export function AttachmentAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(className)}
      data-slot="attachment-action"
      size="icon-sm"
      variant="ghost"
      {...props}
    />
  );
}

export function AttachmentProgress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  value: number;
}) {
  return (
    <div
      aria-label={`Upload progress: ${value}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-150"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
