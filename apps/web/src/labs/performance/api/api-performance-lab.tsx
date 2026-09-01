"use client";

import { Link } from "@tanstack/react-router";
import type { PerformanceApiResponse } from "@zomlab/contracts";
import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { client } from "~/lib/api";
import {
  type BenchmarkMode,
  formatBytes,
  formatDuration,
  runComparison,
} from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

type ApiRun = PerformanceApiResponse & {
  clientDurationMs: number;
  serverTiming: string;
};

const BEFORE_CODE = `const total = await countAll();
const highScores = await countHighScores();
const records = await selectAllColumns(500);

return { total, highScores, records };`;
const AFTER_CODE = `const records = await db
  .select({ id: table.id, label: table.label })
  .from(table)
  .where(eq(table.ownerId, ownerId))
  .limit(50);

return { records };`;

export function ApiPerformanceLab() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, ApiRun>>>({});

  async function runMode(mode: BenchmarkMode) {
    const startedAt = performance.now();
    const response = await client.api.performance.api.$get({ query: { mode } });
    if (!response.ok) throw new Error(`API benchmark failed with status ${response.status}.`);
    const data = await response.json();
    return {
      ...data,
      clientDurationMs: performance.now() - startedAt,
      serverTiming: response.headers.get("server-timing") ?? "Not exposed",
    };
  }

  async function run() {
    setError("");
    setPending(true);
    setResults({});
    try {
      setResults(await runComparison(runMode));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The API benchmark failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Compare three sequential, over-fetching database requests with one projected and paginated API query."
      title="API Performance"
    >
      <Card>
        <CardHeader>
          <CardTitle>Hono response benchmark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonRunButton onClick={() => void run()} pending={pending} />
          <p className="text-sm text-muted-foreground" role="status">
            {results.before && results.after
              ? `${results.before.records.length} unoptimized rows and ${results.after.records.length} optimized rows returned.`
              : "One click requests both API implementations in sequence."}
          </p>
          {results.before?.records.length === 0 && results.after?.records.length === 0 ? (
            <Alert variant="warning">
              <AlertTitle>Dataset is empty</AlertTitle>
              <AlertDescription>
                Prepare the isolated dataset on the{" "}
                <Link to="/performance/database" className="text-link underline">
                  Database Performance page
                </Link>
                , then rerun this request.
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert role="alert" variant="destructive">
              {error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The optimized endpoint performs one database round trip, selects only fields the UI uses, and caps the response at 50 records. The unoptimized endpoint intentionally computes unused counts and returns full rows. Server-Timing exposes the measured database and application work."
        metrics={[
          {
            after: results.after?.clientDurationMs,
            before: results.before?.clientDurationMs,
            format: formatDuration,
            label: "Client response time",
          },
          {
            after: results.after?.metrics.serverDurationMs,
            before: results.before?.metrics.serverDurationMs,
            format: formatDuration,
            label: "Server duration",
          },
          {
            after: results.after?.metrics.databaseDurationMs,
            before: results.before?.metrics.databaseDurationMs,
            format: formatDuration,
            label: "Database duration",
          },
          {
            after: results.after?.metrics.databaseRoundTrips,
            before: results.before?.metrics.databaseRoundTrips,
            label: "Database round trips",
          },
          {
            after: results.after?.metrics.payloadBytes,
            before: results.before?.metrics.payloadBytes,
            format: formatBytes,
            label: "JSON payload",
          },
          {
            after: results.after?.metrics.rowsReturned,
            before: results.before?.metrics.rowsReturned,
            label: "Rows returned",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
