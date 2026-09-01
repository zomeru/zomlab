"use client";

import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { createRecords, formatDuration } from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface ProfileResult {
  aggregateMs: number;
  filterMs: number;
  sortMs: number;
  totalMs: number;
}

const RECORDS = createRecords(20_000);
const BEFORE_CODE = `performance.mark("filter:start");
const filtered = records.filter(matches);
performance.measure("filter", "filter:start");

const sorted = filtered.sort(compare);
const totals = groups.map((group) =>
  sorted.filter((item) => item.category === group)
);`;
const AFTER_CODE = `const filtered = [];
const totals = new Map();

for (const item of records) {
  if (matches(item)) filtered.push(item);
  totals.set(item.category, (totals.get(item.category) ?? 0) + 1);
}
filtered.sort(compare);`;

function measurePhase<T>(runId: string, name: string, work: () => T) {
  const start = `${runId}:${name}:start`;
  const end = `${runId}:${name}:end`;
  performance.mark(start);
  const result = work();
  performance.mark(end);
  const measurement = performance.measure(`${runId}:${name}`, start, end);
  return { durationMs: measurement.duration, result };
}

function runProfile(optimized: boolean): ProfileResult {
  const runId = crypto.randomUUID();
  const totalStartedAt = performance.now();
  const filtered = measurePhase(runId, "filter", () =>
    RECORDS.filter((record) => record.score > 350 && record.category !== "group-3"),
  );
  const sorted = measurePhase(runId, "sort", () =>
    [...filtered.result].sort((left, right) => right.score - left.score),
  );
  const aggregate = measurePhase(runId, "aggregate", () => {
    if (!optimized) {
      return Array.from(
        { length: 17 },
        (_, index) => sorted.result.filter((record) => record.category === `group-${index}`).length,
      );
    }

    const totals = new Map<string, number>();
    for (const record of sorted.result) {
      totals.set(record.category, (totals.get(record.category) ?? 0) + 1);
    }
    return totals;
  });
  const totalMs = performance.now() - totalStartedAt;
  performance.clearMarks();
  performance.clearMeasures();

  return {
    aggregateMs: aggregate.durationMs,
    filterMs: filtered.durationMs,
    sortMs: sorted.durationMs,
    totalMs,
  };
}

function Timeline({ label, result }: { label: string; result: ProfileResult }) {
  const phases = [
    ["Filtering", result.filterMs],
    ["Sorting", result.sortMs],
    ["Aggregation", result.aggregateMs],
  ] as const;

  return (
    <div>
      <h3 className="font-medium text-foreground">{label}</h3>
      <div className="mt-3 space-y-3">
        {phases.map(([phase, duration]) => (
          <div className="grid grid-cols-[7rem_1fr_5rem] items-center gap-3 text-sm" key={phase}>
            <span className="text-muted-foreground">{phase}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(2, (duration / result.totalMs) * 100)}%` }}
              />
            </div>
            <span className="text-right font-mono tabular-nums">{formatDuration(duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilingLab() {
  const [before, setBefore] = useState<ProfileResult>();
  const [after, setAfter] = useState<ProfileResult>();

  function runBoth() {
    setBefore(runProfile(false));
    setAfter(runProfile(true));
  }

  return (
    <PerformanceLabShell
      description="Instrument filtering, sorting, and aggregation with Performance marks before choosing what to optimize."
      title="Profiling & Benchmarking"
    >
      <Card>
        <CardHeader>
          <CardTitle>20,000-record workload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full sm:w-auto" onClick={runBoth} type="button">
            Profile both workloads
          </Button>
          {before && after ? (
            <div className="grid gap-8 lg:grid-cols-2" role="status">
              <Timeline label="Before" result={before} />
              <Timeline label="After" result={after} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the workload to populate real phase durations.
            </p>
          )}
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The marks reveal which phase dominates this browser and device. The optimized aggregation replaces 17 full-array scans with one pass. Use browser and React profilers, Server-Timing, query plans, and build output to find a bottleneck before changing code."
        metrics={[
          {
            after: after?.filterMs,
            before: before?.filterMs,
            format: formatDuration,
            label: "Filtering",
          },
          {
            after: after?.sortMs,
            before: before?.sortMs,
            format: formatDuration,
            label: "Sorting",
          },
          {
            after: after?.aggregateMs,
            before: before?.aggregateMs,
            format: formatDuration,
            label: "Aggregation",
          },
          {
            after: after?.totalMs,
            before: before?.totalMs,
            format: formatDuration,
            label: "Total",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
