import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { cn } from "@zomlab/ui/lib/utils";
import type { ReactNode } from "react";

interface CoreDemoShellProps {
  children: ReactNode;
  className?: string;
  description: string;
  title: string;
}

export function CoreDemoShell({ children, className, description, title }: CoreDemoShellProps) {
  return (
    <div className={cn("mx-auto max-w-3xl", className)}>
      <PageHeader>
        <PageTitle>{title}</PageTitle>
        <PageDescription>{description}</PageDescription>
      </PageHeader>
      <div className="mt-8">{children}</div>
    </div>
  );
}
