import { createFileRoute } from "@tanstack/react-router";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Card } from "@zomlab/ui/components/card";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

import { useHealth } from "~/hooks/use-health";

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function StatusPage() {
  const { data, isLoading, error } = useHealth();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader>
        <PageTitle>System status</PageTitle>
        <PageDescription>Real-time health information from the API server.</PageDescription>
      </PageHeader>

      <div className="mt-8">
        {isLoading && (
          <div className="space-y-3" role="status" aria-label="Checking server health">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            Failed to connect: {error.message}
          </Alert>
        )}

        {data && (
          <Card>
            <dl className="divide-y divide-border-subtle overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant="success">{data.status}</Badge>
                </dd>
              </div>
              <div className="flex items-center gap-4 px-5 py-4">
                <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Uptime</dt>
                <dd className="font-mono text-sm tabular-nums text-foreground">
                  {formatUptime(data.uptime)}
                </dd>
              </div>
              <div className="flex items-center gap-4 px-5 py-4">
                <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Checked</dt>
                <dd className="font-mono text-sm tabular-nums text-foreground">
                  {new Date(data.timestamp).toLocaleString()}
                </dd>
              </div>
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
