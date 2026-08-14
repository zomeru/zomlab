import { Link } from "@tanstack/react-router";
import { Button } from "@zomlab/ui/components/button";
import { PageDescription, PageEyebrow, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { CompassIcon } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader className="mb-0 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="mx-auto mb-6 grid size-12 place-items-center rounded-xl bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm"
        >
          404
        </div>
        <PageEyebrow>route unavailable</PageEyebrow>
        <PageTitle>Page not found</PageTitle>
        <PageDescription className="mx-auto">
          This route does not exist, or it may have moved somewhere else in the lab.
        </PageDescription>
        <Button asChild className="mt-6" size="lg">
          <Link to="/">
            <CompassIcon aria-hidden="true" />
            Return home
          </Link>
        </Button>
      </PageHeader>
    </div>
  );
}
