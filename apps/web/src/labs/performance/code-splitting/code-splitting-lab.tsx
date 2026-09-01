"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
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
import { runEagerAnalytics } from "./eager-analytics";

interface SplitMetrics {
  checksum: number;
  moduleLoadMs: number;
  requests: number;
  totalMs: number;
  transferredBytes: number;
}

const VALUES = Array.from({ length: 40_000 }, (_, index) => (index * 19) % 997);
const BEFORE_CODE = `import { runEagerAnalytics } from "./eager-analytics";

const result = runEagerAnalytics(values);`;
const AFTER_CODE = `const analytics = await import("./heavy-analytics");
const result = analytics.runDeferredAnalytics(values);`;

function resourcesSince(startedAt: number) {
  return performance
    .getEntriesByType("resource")
    .filter((entry) => entry.startTime >= startedAt) as PerformanceResourceTiming[];
}

export function CodeSplittingLab() {
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, SplitMetrics>>>({});

  async function runMode(mode: BenchmarkMode) {
    const startedAt = performance.now();
    let moduleLoadMs = 0;
    let checksum: number;

    if (mode === "before") {
      checksum = runEagerAnalytics(VALUES);
    } else {
      const moduleStartedAt = performance.now();
      const analytics = await import("./heavy-analytics");
      moduleLoadMs = performance.now() - moduleStartedAt;
      checksum = analytics.runDeferredAnalytics(VALUES);
    }

    const entries = resourcesSince(startedAt);
    return {
      checksum,
      moduleLoadMs,
      requests: entries.length,
      totalMs: performance.now() - startedAt,
      transferredBytes: entries.reduce((total, entry) => total + entry.transferSize, 0),
    };
  }

  async function run() {
    setPending(true);
    setResults({});
    try {
      setResults(await runComparison(runMode));
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Run equivalent analytics code from the route bundle or fetch it as a separate module on demand."
      title="Code Splitting"
    >
      <Card>
        <CardHeader>
          <CardTitle>Eager and dynamic modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonRunButton onClick={() => void run()} pending={pending} />
          <p className="text-sm text-muted-foreground" role="status">
            {results.before && results.after
              ? `Both implementations returned checksum ${results.after.checksum.toLocaleString()}.`
              : "One click runs both implementations against the same analytics values."}
          </p>
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The eager module adds no request at interaction time because it ships with the route. The dynamic import creates a deferred chunk; its first run records the real resource transfer, while later runs demonstrate browser module caching. Route components are also split automatically by TanStack Start."
        metrics={[
          {
            after: results.after?.totalMs,
            before: results.before?.totalMs,
            format: formatDuration,
            label: "Interaction duration",
          },
          {
            after: results.after?.moduleLoadMs,
            before: results.before?.moduleLoadMs,
            format: formatDuration,
            label: "Module import",
            lowerIsBetter: false,
          },
          {
            after: results.after?.requests,
            before: results.before?.requests,
            label: "Deferred requests",
            lowerIsBetter: false,
          },
          {
            after: results.after?.transferredBytes,
            before: results.before?.transferredBytes,
            format: formatBytes,
            label: "Deferred bytes",
            lowerIsBetter: false,
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
