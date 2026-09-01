"use client";

import type { PerformanceCacheResponse } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { client } from "~/lib/api";
import { type BenchmarkMode, formatDuration, runComparison } from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface CacheRun extends PerformanceCacheResponse {
  clientDurationMs: number;
  firstStatus: PerformanceCacheResponse["cacheStatus"];
}

const BEFORE_CODE = `const result = computeReport(key);
return c.json({ cacheStatus: "bypass", result });`;
const AFTER_CODE = `const cached = cache.get(key);
if (cached) return c.json({ cacheStatus: "hit", result: cached });

const result = computeReport(key);
cache.set(key, result);
return c.json({ cacheStatus: "miss", result });`;

async function requestCache(mode: BenchmarkMode) {
  const startedAt = performance.now();
  const response = await client.api.performance.cache.$get({
    query: { key: "quarterly-report", mode },
  });
  if (!response.ok) throw new Error(`Cache request failed with status ${response.status}.`);
  return { ...(await response.json()), clientDurationMs: performance.now() - startedAt };
}

export function PerformanceCachingLab() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, CacheRun>>>({});

  async function runMode(mode: BenchmarkMode) {
    const first = await requestCache(mode);
    const second = await requestCache(mode);
    return { ...second, firstStatus: first.cacheStatus };
  }

  async function runComparisonBenchmark() {
    setError("");
    setMessage("");
    setPending(true);
    setResults({});
    try {
      const response = await client.api.performance.cache.$delete();
      if (!response.ok) throw new Error(`Invalidation failed with status ${response.status}.`);
      const comparison = await runComparison(runMode);
      setResults(comparison);
      setMessage(
        `Unoptimized: ${comparison.before.firstStatus} → ${comparison.before.cacheStatus}. Optimized: ${comparison.after.firstStatus} → ${comparison.after.cacheStatus}.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cache benchmark failed.");
    } finally {
      setPending(false);
    }
  }

  async function invalidate() {
    setError("");
    setPending(true);
    try {
      const response = await client.api.performance.cache.$delete();
      if (!response.ok) throw new Error(`Invalidation failed with status ${response.status}.`);
      const data = await response.json();
      setMessage(`Invalidated ${data.invalidatedEntries} cache entries for this user.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cache invalidation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Run an expensive server computation twice, observe cache bypass/miss/hit state, then invalidate it explicitly."
      title="Caching"
    >
      <ol className="flex flex-col gap-2 text-sm sm:flex-row" aria-label="Common cache layers">
        {["Browser", "Application", "API", "Database"].map((layer, index) => (
          <li
            className="flex min-w-0 flex-col items-center gap-2 sm:flex-1 sm:flex-row"
            key={layer}
          >
            <span className="w-full rounded-lg bg-muted/60 p-4 text-center font-medium">
              {layer}
            </span>
            {index < 3 ? (
              <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <Card>
        <CardHeader>
          <CardTitle>Worker application cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ComparisonRunButton onClick={() => void runComparisonBenchmark()} pending={pending} />
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => void invalidate()}
              type="button"
              variant="outline"
            >
              Invalidate cache
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
          {error ? (
            <Alert role="alert" variant="destructive">
              {error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The optimized second request returns the cached checksum without rerunning the measured computation. This cache lives in one Worker isolate, so entries are not durable or shared across every instance; production caching needs a store and invalidation model appropriate to its consistency requirements."
        metrics={[
          {
            after: results.after?.clientDurationMs,
            before: results.before?.clientDurationMs,
            format: formatDuration,
            label: "Client request duration",
          },
          {
            after: results.after?.serverDurationMs,
            before: results.before?.serverDurationMs,
            format: formatDuration,
            label: "Server duration",
          },
          {
            after: results.after?.computationDurationMs,
            before: results.before?.computationDurationMs,
            format: formatDuration,
            label: "Second computation",
          },
          {
            after: results.after
              ? `${results.after.firstStatus} → ${results.after.cacheStatus}`
              : undefined,
            before: results.before
              ? `${results.before.firstStatus} → ${results.before.cacheStatus}`
              : undefined,
            label: "Cache state",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
