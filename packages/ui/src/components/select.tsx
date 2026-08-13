import { cn } from "../lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-destructive/50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
