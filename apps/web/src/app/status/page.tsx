"use client";

import { useHealth } from "@/hooks/use-health";

export default function StatusPage() {
  const { data, isLoading, error } = useHealth();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        System Status
      </h1>
      <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
        Real-time health information from the API server.
      </p>

      <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

      {isLoading && <p className="text-zinc-500 dark:text-zinc-400">Checking server health...</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Failed to connect: {error.message}
          </p>
        </div>
      )}

      {data && (
        <dl className="space-y-4">
          <div className="flex gap-4">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</dt>
            <dd className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              {data.status}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">Uptime</dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">{formatUptime(data.uptime)}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-24 text-sm font-medium text-zinc-500 dark:text-zinc-400">Checked</dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-50">
              {new Date(data.timestamp).toLocaleString()}
            </dd>
          </div>
        </dl>
      )}
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
