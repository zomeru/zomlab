"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import {
  inspectVersionRequest,
  type RequestInspection,
} from "~/labs/core/shared/request-inspector";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

export function MiddlewareDemo() {
  const [error, setError] = useState("");
  const [inspection, setInspection] = useState<RequestInspection>();
  const [pending, setPending] = useState(false);
  const hydrated = useHydrated();

  async function inspect() {
    setError("");
    setPending(true);
    try {
      setInspection(await inspectVersionRequest());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The middleware request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <CoreDemoShell
      description="Send one request through normalization, observability, security, and routing middleware."
      title="Middleware"
    >
      <Button disabled={!hydrated || pending} onClick={() => void inspect()} type="button">
        {pending ? "Inspecting…" : "Inspect middleware"}
      </Button>

      {error ? (
        <Alert className="mt-5" variant="destructive" role="alert">
          {error}
        </Alert>
      ) : null}

      {inspection ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Response evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-medium text-foreground">Request ID</dt>
                <dd className="font-mono text-muted-foreground sm:col-span-2">
                  {inspection.requestId}
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-medium text-foreground">Server timing</dt>
                <dd className="font-mono text-muted-foreground sm:col-span-2">
                  {inspection.serverTiming}
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-medium text-foreground">Security headers</dt>
                <dd className="font-mono text-muted-foreground sm:col-span-2">
                  {inspection.security}
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-medium text-foreground">Cache control</dt>
                <dd className="font-mono text-muted-foreground sm:col-span-2">
                  {inspection.cacheControl}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </CoreDemoShell>
  );
}
