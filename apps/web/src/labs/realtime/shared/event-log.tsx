import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Trash2 } from "lucide-react";
import { formatTime } from "~/labs/core/shared/formatters";
import type { RealtimeLogEntry } from "./use-realtime-connection";

export function EventLog({
  entries,
  onClear,
  title = "Event log",
}: {
  entries: readonly RealtimeLogEntry[];
  onClear: () => void;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{title}</CardTitle>
        <Button
          disabled={entries.length === 0}
          onClick={onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <ol className="max-h-72 space-y-1 overflow-y-auto font-mono text-xs" aria-label={title}>
            {entries.map((entry) => (
              <li
                className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-3 rounded-md px-2 py-1.5 odd:bg-muted/55"
                key={entry.id}
              >
                <time className="text-muted-foreground" dateTime={entry.timestamp}>
                  {formatTime(entry.timestamp)}
                </time>
                <span>
                  <span className="sr-only">{entry.direction}bound</span>
                  <span aria-hidden="true">
                    {entry.direction === "in" ? "←" : entry.direction === "out" ? "→" : "·"}
                  </span>
                </span>
                <span className="min-w-0 break-words">
                  {entry.type}
                  {entry.detail ? ` — ${entry.detail}` : ""}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Connection activity will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}
