import { Alert, AlertDescription } from "@zomlab/ui/components/alert";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import type { ReactNode } from "react";

export function PerformanceLabShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <PageHeader className="mb-6">
        <PageTitle>{title}</PageTitle>
        <PageDescription>{description}</PageDescription>
      </PageHeader>

      {import.meta.env.DEV ? (
        <Alert className="mb-6" variant="warning" role="status">
          <p className="font-semibold">Development measurements</p>
          <AlertDescription>
            React checks, source maps, and hot reloading add overhead. Use the production build when
            comparing representative timings; render and operation counts remain useful here.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="min-w-0 space-y-6" aria-labelledby="interactive-performance-lab-heading">
        <h2 className="sr-only" id="interactive-performance-lab-heading">
          Interactive performance lab
        </h2>
        {children}
      </section>
    </div>
  );
}
