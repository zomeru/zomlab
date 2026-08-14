import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { cn } from "@zomlab/ui/lib/utils";
import type { ReactNode } from "react";

interface CoreDemoShellProps {
  children: ReactNode;
  className?: string;
  description: string;
  title: string;
  width?: "standard" | "roomy" | "table";
}

const widths = {
  roomy: "max-w-4xl",
  standard: "max-w-3xl",
  table: "max-w-6xl",
} as const;

export function CoreDemoShell({
  children,
  className,
  description,
  title,
  width = "standard",
}: CoreDemoShellProps) {
  return (
    <div className={cn("mx-auto w-full", widths[width], className)}>
      <PageHeader>
        <PageTitle className="[overflow-wrap:anywhere]">{title}</PageTitle>
        <PageDescription>{description}</PageDescription>
      </PageHeader>
      <div className="mt-8">{children}</div>
    </div>
  );
}
