"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { useHealth } from "~/hooks/use-health";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { formatTime } from "~/labs/core/shared/formatters";
import { useHydrated } from "~/labs/core/shared/use-hydrated";
import { queryKeys } from "~/lib/query-keys";

export function CachingDemo() {
  const health = useHealth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const hydrated = useHydrated();

  async function invalidateHealth() {
    setMessage("Refreshing stale data…");
    await queryClient.invalidateQueries({ queryKey: queryKeys.health.all });
    setMessage("Cache refreshed with a new health response.");
  }

  return (
    <CoreDemoShell
      description="Observe one query key moving between fresh, stale, fetching, and cached states."
      title="Caching"
    >
      <Card>
        <CardHeader>
          <CardTitle>Cached health response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-muted-foreground">Query key</dt>
              <dd className="mt-1 font-mono text-foreground">[&quot;health&quot;]</dd>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-muted-foreground">Current state</dt>
              <dd className="mt-1 font-medium text-foreground">
                {health.isFetching ? "Fetching" : health.isStale ? "Stale" : "Fresh"}
              </dd>
            </div>
            <div className="rounded-lg bg-muted p-3 sm:col-span-2">
              <dt className="text-muted-foreground">Cached at</dt>
              <dd className="mt-1 font-mono text-foreground">
                {health.dataUpdatedAt
                  ? formatTime(new Date(health.dataUpdatedAt))
                  : "Waiting for the first response"}
              </dd>
            </div>
          </dl>
          <Button
            disabled={!hydrated || health.isFetching}
            onClick={() => void invalidateHealth()}
            type="button"
          >
            Invalidate health cache
          </Button>
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        </CardContent>
      </Card>
    </CoreDemoShell>
  );
}
