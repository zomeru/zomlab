"use client";

import type { RealtimePresenceSession, RealtimeServerEvent } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Monitor, UserRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { formatTime } from "~/labs/core/shared/formatters";
import { ConnectionPanel } from "~/labs/realtime/shared/connection-panel";
import { EventLog } from "~/labs/realtime/shared/event-log";
import { RealtimeDemoShell } from "~/labs/realtime/shared/realtime-demo-shell";
import {
  type RealtimeLogEntry,
  useRealtimeConnection,
} from "~/labs/realtime/shared/use-realtime-connection";

const ROOM_ID = "demo";

interface PresenceGroup {
  user: RealtimePresenceSession["user"];
  sessions: RealtimePresenceSession[];
}

export function PresenceDemo() {
  const [sessions, setSessions] = useState<RealtimePresenceSession[]>([]);
  const [activity, setActivity] = useState<RealtimeLogEntry[]>([]);

  const handleEvent = useCallback((event: RealtimeServerEvent) => {
    if (event.type === "presence.sync") {
      setSessions(event.payload.sessions);
      return;
    }
    if (event.type !== "presence.join" && event.type !== "presence.leave") return;
    setActivity((current) =>
      [
        ...current,
        {
          id: event.eventId,
          timestamp: event.timestamp,
          type: event.type,
          direction: "in" as const,
          detail:
            event.type === "presence.leave"
              ? `${event.payload.user.name} (${event.reason})`
              : event.payload.user.name,
        },
      ].slice(-100),
    );
  }, []);

  const connection = useRealtimeConnection({
    channel: "presence",
    roomId: ROOM_ID,
    onEvent: handleEvent,
  });

  const groups = useMemo(() => {
    const byUser = new Map<string, PresenceGroup>();
    for (const session of sessions) {
      const group = byUser.get(session.user.id);
      if (group) group.sessions.push(session);
      else byUser.set(session.user.id, { user: session.user, sessions: [session] });
    }
    return [...byUser.values()].sort((left, right) =>
      left.user.name.localeCompare(right.user.name),
    );
  }, [sessions]);

  return (
    <RealtimeDemoShell
      title="Presence"
      description="Ephemeral, server-authoritative presence tracked per active WebSocket session. Heartbeats refresh hibernation-safe attachments, and Durable Object alarms remove stale sessions after abrupt disconnects."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Presence room: {ROOM_ID}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                One authenticated identity can own multiple tab sessions.
              </p>
            </div>
            <Badge variant="success">
              <span aria-hidden="true">●</span>
              {groups.length} {groups.length === 1 ? "user" : "users"} · {sessions.length}{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </Badge>
          </CardHeader>
          <CardContent>
            {groups.length > 0 ? (
              <ul className="space-y-5" aria-label="Online users">
                {groups.map((group) => (
                  <li className="rounded-lg border border-border p-4" key={group.user.id}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-success/10 text-success">
                        <UserRound aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">
                          {group.user.id === connection.user?.id ? "You" : group.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{group.user.name}</p>
                      </div>
                    </div>
                    <ul
                      className="mt-4 space-y-2 border-l border-border pl-4"
                      aria-label={`${group.user.name} sessions`}
                    >
                      {group.sessions.map((session, index) => (
                        <li
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          key={session.connectionId}
                        >
                          <span className="flex items-center gap-2">
                            <Monitor aria-hidden="true" className="size-4 text-muted-foreground" />
                            Session {index + 1}
                            {session.connectionId === connection.connectionId ? " (this tab)" : ""}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            Connected {formatTime(session.connectedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">
                Waiting for the authoritative presence sync…
              </p>
            )}
            {connection.error ? (
              <Alert className="mt-5" variant="destructive" role="alert">
                {connection.error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <ConnectionPanel connection={connection} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EventLog entries={activity} onClear={() => setActivity([])} title="Presence activity" />
        <EventLog
          entries={connection.log}
          onClear={connection.clearLog}
          title="Connection activity"
        />
      </div>
    </RealtimeDemoShell>
  );
}
