import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-card text-card-foreground",
      destructive: "border-destructive/30 bg-destructive/8 text-destructive",
      info: "border-info/30 bg-info/8 text-foreground",
      success: "border-success/30 bg-success/8 text-foreground",
      warning: "border-warning/30 bg-warning/10 text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" className={cn(alertVariants({ className, variant }))} {...props} />;
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 data-slot="alert-title" className={cn("font-semibold", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("mt-1 leading-relaxed", className)}
      {...props}
    />
  );
}
