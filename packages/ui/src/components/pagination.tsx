import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

export function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

interface PaginationLinkProps extends React.ComponentProps<"a"> {
  isActive?: boolean;
}

export function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ size: "icon", variant: isActive ? "outline" : "ghost" }),
        className,
      )}
      data-slot="pagination-link"
      {...props}
    />
  );
}

export function PaginationPrevious({ children, className, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-label="Go to previous page"
      className={cn(
        buttonVariants({ size: "default", variant: "ghost" }),
        "px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:px-4",
        className,
      )}
      data-slot="pagination-previous"
      role="link"
      {...props}
    >
      <ChevronLeftIcon aria-hidden="true" />
      <span className="hidden sm:inline">{children ?? "Previous"}</span>
    </a>
  );
}

export function PaginationNext({ children, className, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-label="Go to next page"
      className={cn(
        buttonVariants({ size: "default", variant: "ghost" }),
        "px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:px-4",
        className,
      )}
      data-slot="pagination-next"
      role="link"
      {...props}
    >
      <span className="hidden sm:inline">{children ?? "Next"}</span>
      <ChevronRightIcon aria-hidden="true" />
    </a>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-10 items-center justify-center text-muted-foreground", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
