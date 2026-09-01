import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Plug, Unplug } from "lucide-react";
import { formatTime } from "~/labs/core/shared/formatters";
import type { RealtimeConnection, RealtimeConnectionStatus } from "./use-realtime-connection";

function statusVariant(status: RealtimeConnectionStatus): "accent" | "outline" | "success" {
  if (status === "connected") return "success";
  if (status === "connecting" || status === "reconnecting") return "accent";
  return "outline";
}

function statusLabel(status: RealtimeConnectionStatus): string {
  return status[0]?.toUpperCase() + status.slice(1);
}

export function ConnectionPanel({
  connection,
  transport = "WebSocket",
}: {
  connection: RealtimeConnection;
  transport?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Connection</CardTitle>
        <Badge variant={statusVariant(connection.status)} role="status">
          <span aria-hidden="true">●</span>
          {statusLabel(connection.status)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Transport</dt>
            <dd className="mt-1 font-medium">{transport}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Connection ID</dt>
            <dd className="mt-1 truncate font-mono" title={connection.connectionId}>
              {connection.connectionId ?? "Pending"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Identity</dt>
            <dd className="mt-1 font-medium">{connection.user?.name ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Connected at</dt>
            <dd className="mt-1 font-mono">
              {connection.connectedAt ? formatTime(connection.connectedAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Reconnect attempts</dt>
            <dd className="mt-1 tabular-nums">{connection.reconnectAttempts}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Latency</dt>
            <dd className="mt-1 tabular-nums">
              {connection.latency === undefined ? "—" : `${connection.latency} ms`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sent / received</dt>
            <dd className="mt-1 tabular-nums">
              {connection.messagesSent} / {connection.messagesReceived}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last event</dt>
            <dd className="mt-1 font-mono">{connection.lastEvent ?? "—"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={
              connection.status === "connected" ||
              connection.status === "connecting" ||
              connection.status === "reconnecting"
            }
            onClick={connection.connect}
            type="button"
          >
            <Plug aria-hidden="true" />
            Connect
          </Button>
          <Button
            disabled={connection.status === "disconnected"}
            onClick={connection.disconnect}
            type="button"
            variant="outline"
          >
            <Unplug aria-hidden="true" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
