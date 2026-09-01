"use client";

import { useQueryClient } from "@tanstack/react-query";
import type {
  RealtimeNotificationListResponse,
  RealtimeNotificationType,
  RealtimeServerEvent,
} from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { BellPlus, Check, CheckCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { formatDateTime } from "~/labs/core/shared/formatters";
import {
  markAllNotificationsLocally,
  mergeNotification,
} from "~/labs/realtime/shared/client-utils";
import { ConnectionPanel } from "~/labs/realtime/shared/connection-panel";
import { EventLog } from "~/labs/realtime/shared/event-log";
import { RealtimeDemoShell } from "~/labs/realtime/shared/realtime-demo-shell";
import { useRealtimeConnection } from "~/labs/realtime/shared/use-realtime-connection";
import {
  useGenerateRealtimeNotification,
  useMarkAllRealtimeNotificationsRead,
  useMarkRealtimeNotificationRead,
  useRealtimeNotifications,
} from "~/labs/realtime/shared/use-realtime-data";
import { queryKeys } from "~/lib/query-keys";

const notificationTypes = ["info", "success", "warning"] as const;

export function NotificationsDemo() {
  const queryClient = useQueryClient();
  const notifications = useRealtimeNotifications();
  const generate = useGenerateRealtimeNotification();
  const markOne = useMarkRealtimeNotificationRead();
  const markAll = useMarkAllRealtimeNotificationsRead();
  const [type, setType] = useState<RealtimeNotificationType>("info");

  const handleEvent = useCallback(
    (event: RealtimeServerEvent) => {
      if (event.type === "connection.ready") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.realtime.notifications });
        return;
      }
      if (event.type === "notification.created" || event.type === "notification.updated") {
        queryClient.setQueryData<RealtimeNotificationListResponse>(
          queryKeys.realtime.notifications,
          (current) => mergeNotification(current, event.payload),
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.realtime.notifications });
      } else if (event.type === "notifications.read") {
        queryClient.setQueryData<RealtimeNotificationListResponse>(
          queryKeys.realtime.notifications,
          (current) => markAllNotificationsLocally(current, event.payload.readAt),
        );
      }
    },
    [queryClient],
  );
  const connection = useRealtimeConnection({ channel: "notifications", onEvent: handleEvent });

  const error = notifications.error ?? generate.error ?? markOne.error ?? markAll.error;

  return (
    <RealtimeDemoShell
      title="Notifications"
      description="Authenticated in-app notifications persisted in PostgreSQL, then published to a user-scoped Durable Object channel. Refreshes and reconnects recover any missed events from server state."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Application notifications</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                The HTTP API persists first; the WebSocket event updates every connected tab.
              </p>
            </div>
            <Badge variant={notifications.data?.unreadCount ? "accent" : "outline"}>
              Unread: {notifications.data?.unreadCount ?? 0}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Test notification type</legend>
              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((value) => (
                  <Button
                    aria-pressed={type === value}
                    key={value}
                    onClick={() => setType(value)}
                    size="sm"
                    type="button"
                    variant={type === value ? "secondary" : "outline"}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={generate.isPending}
                onClick={() => generate.mutate({ type })}
                type="button"
              >
                <BellPlus aria-hidden="true" />
                {generate.isPending ? "Generating…" : "Generate test notification"}
              </Button>
              <Button
                disabled={!notifications.data?.unreadCount || markAll.isPending}
                onClick={() => markAll.mutate()}
                type="button"
                variant="outline"
              >
                <CheckCheck aria-hidden="true" />
                Mark all as read
              </Button>
            </div>
            {error ? (
              <Alert variant="destructive" role="alert">
                {error.message}
              </Alert>
            ) : null}
            {connection.error ? (
              <Alert variant="warning" role="status">
                Realtime delivery is unavailable: {connection.error}. Persistent history remains
                authoritative.
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <ConnectionPanel connection={connection} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Persisted history</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.isLoading ? (
              <p className="text-sm text-muted-foreground" role="status">
                Loading notifications…
              </p>
            ) : notifications.data?.items.length ? (
              <ol className="space-y-3" aria-label="Notifications">
                {notifications.data.items.map((notification) => (
                  <li
                    className="flex gap-3 rounded-lg border border-border p-4"
                    key={notification.id}
                  >
                    <span className={notification.readAt ? "text-muted-foreground" : "text-link"}>
                      <span aria-hidden="true">●</span>
                      <span className="sr-only">{notification.readAt ? "Read" : "Unread"}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <Badge variant="outline">{notification.type}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(notification.createdAt)} · sequence{" "}
                          {notification.metadata.sequence}
                        </p>
                        {!notification.readAt ? (
                          <Button
                            disabled={markOne.isPending}
                            onClick={() => markOne.mutate(notification.id)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Check aria-hidden="true" />
                            Mark read
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a notification to create the first persisted record.
              </p>
            )}
          </CardContent>
        </Card>
        <EventLog entries={connection.log} onClear={connection.clearLog} />
      </div>
    </RealtimeDemoShell>
  );
}
