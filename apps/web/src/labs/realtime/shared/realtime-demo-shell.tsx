import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import type { ReactNode } from "react";

export function RealtimeDemoShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader>
        <PageTitle>{title}</PageTitle>
        <PageDescription>{description}</PageDescription>
      </PageHeader>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
