import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const pageContainerVariants = cva("mx-auto w-full", {
  variants: {
    width: {
      narrow: "max-w-2xl",
      docs: "max-w-3xl",
      default: "max-w-5xl",
      wide: "max-w-7xl",
      full: "max-w-none",
    },
  },
  defaultVariants: { width: "default" },
});

export function PageContainer({
  className,
  width,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof pageContainerVariants>) {
  return (
    <div
      data-slot="page-container"
      className={cn(pageContainerVariants({ className, width }))}
      {...props}
    />
  );
}

export function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="page-header" className={cn("mb-8 space-y-3", className)} {...props} />;
}

export function PageEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-eyebrow"
      className={cn(
        "font-mono text-xs font-semibold uppercase tracking-[0.14em] text-link",
        className,
      )}
      {...props}
    />
  );
}

export function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl",
        className,
      )}
      {...props}
    />
  );
}

export function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-description"
      className={cn(
        "max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg",
        className,
      )}
      {...props}
    />
  );
}
