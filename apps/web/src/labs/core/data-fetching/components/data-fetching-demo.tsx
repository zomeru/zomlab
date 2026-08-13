"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { useHealth } from "~/hooks/use-health";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { CoreLoadingState } from "~/labs/core/shared/core-loading-state";
import { formatTime } from "~/labs/core/shared/formatters";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

export function DataFetchingDemo() {
  const health = useHealth();
  const hydrated = useHydrated();

  return (
    <CoreDemoShell
      description="Model remote data as loading, error, success, and background-refresh states."
      title="Data Fetching"
    >
      {health.isLoading ? (
        <CoreLoadingState className="space-y-3" label="Loading health response">
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </CoreLoadingState>
      ) : null}

      {health.error ? (
        <Alert variant="destructive" role="alert">
          Failed to fetch health: {health.error.message}
        </Alert>
      ) : null}

      {health.data ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>API is healthy</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                TanStack Query owns freshness and retry behavior.
              </p>
            </div>
            <Badge variant="success">{health.data.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Server timestamp</dt>
                <dd className="mt-1 font-mono text-foreground">
                  {formatTime(health.data.timestamp)}
                </dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Fetch state</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {health.isFetching ? "Refreshing" : "Settled"}
                </dd>
              </div>
            </dl>
            <Button
              disabled={!hydrated || health.isFetching}
              onClick={() => void health.refetch()}
              type="button"
            >
              {health.isFetching ? "Refetching…" : "Refetch health"}
            </Button>
            <p className="text-sm text-muted-foreground" role="status">
              Last successful response: {formatTime(new Date(health.dataUpdatedAt))}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </CoreDemoShell>
  );
}
