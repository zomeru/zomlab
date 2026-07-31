"use client";

import { useHealth } from "@/hooks/use-health";

export default function StatusPage() {
  const { data, isLoading, error } = useHealth();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">System Status</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Real-time health information from the API server.
      </p>

      <div className="mt-8">
        {isLoading && (
          <p className="text-sm text-muted-foreground" role="status">
            Checking server health…
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Failed to connect: {error.message}
            </p>
          </div>
        )}

        {data && (
          <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-4 px-5 py-4">
              <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="size-2 rounded-full bg-green-500" aria-hidden="true" />
                {data.status}
              </dd>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Uptime</dt>
              <dd className="text-sm tabular-nums text-foreground">{formatUptime(data.uptime)}</dd>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <dt className="w-24 shrink-0 text-sm font-medium text-muted-foreground">Checked</dt>
              <dd className="text-sm tabular-nums text-foreground">
                {new Date(data.timestamp).toLocaleString()}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
