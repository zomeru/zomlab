"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "~/labs/core/shared/formatters";
import { EventLog } from "~/labs/realtime/shared/event-log";
import { RealtimeDemoShell } from "~/labs/realtime/shared/realtime-demo-shell";
import type { RealtimeLogEntry } from "~/labs/realtime/shared/use-realtime-connection";

type StreamStatus = "idle" | "connecting" | "streaming" | "reconnecting" | "stopped" | "failed";

interface StreamEvent {
  id: string;
  name: string;
  timestamp: string;
  data: string;
}

const eventNames = ["connected", "heartbeat", "random-number", "server-time"] as const;

export function SseDemo() {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [log, setLog] = useState<RealtimeLogEntry[]>([]);
  const [lastEventId, setLastEventId] = useState("");
  const [reconnects, setReconnects] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const sourceRef = useRef<EventSource | undefined>(undefined);
  const intentionalRef = useRef(false);
  const openedRef = useRef(false);

  const addLog = useCallback((type: string, detail?: string) => {
    setLog((current) =>
      [
        ...current,
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type,
          direction: "in" as const,
          detail,
        },
      ].slice(-100),
    );
  }, []);

  const stop = useCallback(() => {
    intentionalRef.current = true;
    sourceRef.current?.close();
    sourceRef.current = undefined;
    setStatus("stopped");
    addLog("stream.stop", "Client canceled the HTTP stream");
  }, [addLog]);

  const start = useCallback(() => {
    sourceRef.current?.close();
    intentionalRef.current = false;
    openedRef.current = false;
    setStatus("connecting");
    setError(undefined);
    addLog("stream.connecting");

    const url = new URL("/api/realtime/sse", window.location.origin);
    if (lastEventId) url.searchParams.set("lastEventId", lastEventId);
    const source = new EventSource(url);
    sourceRef.current = source;

    source.addEventListener("open", () => {
      if (sourceRef.current !== source) return;
      if (openedRef.current) setReconnects((count) => count + 1);
      openedRef.current = true;
      setStatus("streaming");
      addLog("stream.open");
    });

    for (const name of eventNames) {
      source.addEventListener(name, (event) => {
        if (sourceRef.current !== source) return;
        const message = event as MessageEvent<string>;
        const timestamp = new Date().toISOString();
        setLastEventId(message.lastEventId);
        setEvents((current) =>
          [...current, { id: message.lastEventId, name, timestamp, data: message.data }].slice(
            -100,
          ),
        );
        addLog(name, `id ${message.lastEventId}`);
      });
    }

    source.addEventListener("error", () => {
      if (sourceRef.current !== source || intentionalRef.current) return;
      if (source.readyState === EventSource.CONNECTING) {
        setStatus("reconnecting");
        addLog("stream.reconnecting", "EventSource automatic retry");
      } else {
        setStatus("failed");
        setError("The SSE stream closed and could not reconnect.");
        addLog("stream.error");
      }
    });
  }, [addLog, lastEventId]);

  useEffect(() => {
    return () => {
      intentionalRef.current = true;
      sourceRef.current?.close();
      sourceRef.current = undefined;
    };
  }, []);

  return (
    <RealtimeDemoShell
      title="Server-Sent Events"
      description="An HTTP server-to-client stream using EventSource, named events, event IDs, JSON data, automatic reconnects, heartbeats, resume hints, and explicit cancellation."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Event stream</CardTitle>
            <Badge
              variant={
                status === "streaming"
                  ? "success"
                  : status === "reconnecting"
                    ? "accent"
                    : "outline"
              }
              role="status"
            >
              <span aria-hidden="true">●</span>
              {status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Direction</dt>
                <dd className="mt-1 font-medium">Server → Client</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last event ID</dt>
                <dd className="mt-1 font-mono">{lastEventId || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reconnects</dt>
                <dd className="mt-1 tabular-nums">{reconnects}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={
                  status === "connecting" || status === "streaming" || status === "reconnecting"
                }
                onClick={start}
                type="button"
              >
                <Play aria-hidden="true" />
                Start stream
              </Button>
              <Button disabled={!sourceRef.current} onClick={stop} type="button" variant="outline">
                <Square aria-hidden="true" />
                Stop stream
              </Button>
            </div>
            {error ? (
              <Alert variant="destructive" role="alert">
                {error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <EventLog entries={log} onClear={() => setLog([])} title="Stream activity" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <ol
              className="max-h-96 space-y-2 overflow-y-auto font-mono text-xs"
              aria-label="SSE events"
            >
              {events.map((event) => (
                <li
                  className="grid gap-1 rounded-md bg-muted/55 p-3 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:gap-4"
                  key={event.id}
                >
                  <time className="text-muted-foreground" dateTime={event.timestamp}>
                    {formatTime(event.timestamp)}
                  </time>
                  <span>{event.name}</span>
                  <code className="break-all text-muted-foreground">{event.data}</code>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start the stream to receive named events.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SSE and WebSocket behavior</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3">Capability</th>
                <th className="p-3">WebSocket</th>
                <th className="p-3">SSE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <th className="p-3 font-medium">Direction</th>
                <td className="p-3">Client ↔ Server</td>
                <td className="p-3">Server → Client</td>
              </tr>
              <tr>
                <th className="p-3 font-medium">Browser API</th>
                <td className="p-3">WebSocket</td>
                <td className="p-3">EventSource</td>
              </tr>
              <tr>
                <th className="p-3 font-medium">Reconnect</th>
                <td className="p-3">Application-managed</td>
                <td className="p-3">Built in</td>
              </tr>
              <tr>
                <th className="p-3 font-medium">Typical use</th>
                <td className="p-3">Chat, presence</td>
                <td className="p-3">Feeds, status updates</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </RealtimeDemoShell>
  );
}
