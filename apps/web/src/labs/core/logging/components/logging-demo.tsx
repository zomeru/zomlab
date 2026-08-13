"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { inspectVersionRequest } from "~/labs/core/shared/request-inspector";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

interface RequestEvent {
  durationMs: number;
  id: string;
  requestId: string;
  status: number;
  timestamp: string;
}

export function LoggingDemo() {
  const [error, setError] = useState("");
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [pending, setPending] = useState(false);
  const hydrated = useHydrated();

  async function recordRequest() {
    setError("");
    setPending(true);
    try {
      const result = await inspectVersionRequest();
      setEvents((current) => [
        {
          durationMs: result.durationMs,
          id: crypto.randomUUID(),
          requestId: result.requestId,
          status: result.status,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The logged request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <CoreDemoShell
      description="Record structured request facts that can be filtered and correlated without parsing prose."
      title="Logging"
    >
      <div className="flex flex-wrap gap-2">
        <Button disabled={!hydrated || pending} onClick={() => void recordRequest()} type="button">
          {pending ? "Recording…" : "Record API request"}
        </Button>
        <Button
          disabled={!events.length || pending}
          onClick={() => setEvents([])}
          type="button"
          variant="outline"
        >
          Clear events
        </Button>
      </div>

      {error ? (
        <Alert className="mt-5" variant="destructive" role="alert">
          {error}
        </Alert>
      ) : null}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Structured request events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length ? (
            <ul className="divide-y divide-border" aria-label="Request events">
              {events.map((event) => (
                <li className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_auto]" key={event.id}>
                  <div>
                    <p className="font-mono font-medium text-foreground">GET /api/version</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      requestId={event.requestId}
                    </p>
                  </div>
                  <p className="font-mono tabular-nums text-muted-foreground">
                    {event.status} · {event.durationMs.toFixed(1)} ms ·{" "}
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Record a request to capture its method, path, status, duration, and correlation ID.
            </p>
          )}
        </CardContent>
      </Card>
    </CoreDemoShell>
  );
}
