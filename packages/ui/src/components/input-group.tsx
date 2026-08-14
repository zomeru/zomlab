import { cn } from "../lib/utils";
import { Input } from "./input";

export function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative flex h-10 w-full items-center rounded-md border border-input bg-background shadow-sm transition-[border-color,box-shadow] has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({
  align = "inline-start",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end";
}) {
  return (
    <div
      data-align={align}
      data-slot="input-group-addon"
      className={cn(
        "absolute inset-y-0 z-10 flex items-center gap-1 text-muted-foreground [&_svg]:size-4",
        align === "inline-start" ? "left-0 pl-3" : "right-0 pr-0.5",
        className,
      )}
      {...props}
    />
  );
}
