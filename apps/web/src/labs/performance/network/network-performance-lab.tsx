"use client";

import { type PerformanceNetworkPart, performanceNetworkResponseSchema } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
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

interface NetworkMetrics {
  cumulativeDurationMs: number;
  durationMs: number;
  requests: number;
  transferredBytes: number;
}

const PARTS: PerformanceNetworkPart[] = ["profile", "settings", "history"];
const BEFORE_CODE = `const profile = await getProfile();
const settings = await getSettings();
const history = await getHistory();`;
const AFTER_CODE = `const [profile, settings, history] = await Promise.all([
  getProfile(),
  getSettings(),
  getHistory(),
]);`;

async function requestPart(part: PerformanceNetworkPart) {
  const startedAt = performance.now();
  const response = await client.api.performance.network.$get({ query: { part } });
  if (!response.ok) throw new Error(`${part} request failed with status ${response.status}.`);
  const body = await response.text();
  const data = performanceNetworkResponseSchema.parse(JSON.parse(body));
  return {
    bytes: new TextEncoder().encode(body).byteLength,
    data,
    durationMs: performance.now() - startedAt,
  };
}

export function NetworkPerformanceLab() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, NetworkMetrics>>>({});

  async function runMode(mode: BenchmarkMode) {
    const startedAt = performance.now();
    const responses: Awaited<ReturnType<typeof requestPart>>[] = [];
    if (mode === "before") {
      for (const part of PARTS) responses.push(await requestPart(part));
    } else {
      responses.push(...(await Promise.all(PARTS.map(requestPart))));
    }
    return {
      cumulativeDurationMs: responses.reduce((total, item) => total + item.durationMs, 0),
      durationMs: performance.now() - startedAt,
      requests: responses.length,
      transferredBytes: responses.reduce((total, item) => total + item.bytes, 0),
    };
  }

  async function run() {
    setError("");
    setPending(true);
    setResults({});
    try {
      setResults(await runComparison(runMode));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The network benchmark failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Fetch the same three independent Hono resources as a request waterfall or in parallel."
      title="Network Performance"
    >
      <Card>
        <CardHeader>
          <CardTitle>Three-resource waterfall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonRunButton onClick={() => void run()} pending={pending} />
          <p className="text-sm text-muted-foreground" role="status">
            Each response is read as text so its displayed byte count matches the received JSON
            body.
          </p>
          {error ? (
            <Alert role="alert" variant="destructive">
              {error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="Both modes request identical resources and bytes. The optimized mode starts independent requests together, shortening the wall-clock waterfall when the browser, Worker, and network can overlap them. Cumulative request time remains useful for seeing the total work performed."
        metrics={[
          {
            after: results.after?.durationMs,
            before: results.before?.durationMs,
            format: formatDuration,
            label: "Waterfall duration",
          },
          {
            after: results.after?.cumulativeDurationMs,
            before: results.before?.cumulativeDurationMs,
            format: formatDuration,
            label: "Cumulative request time",
          },
          {
            after: results.after?.requests,
            before: results.before?.requests,
            label: "Request count",
            lowerIsBetter: false,
          },
          {
            after: results.after?.transferredBytes,
            before: results.before?.transferredBytes,
            format: formatBytes,
            label: "JSON bytes",
            lowerIsBetter: false,
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
