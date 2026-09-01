"use client";

import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import {
  type BenchmarkMode,
  formatDuration,
  runAsynchronousBenchmark,
  runComparison,
} from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface AsyncMetrics {
  durationMs: number;
  runs: number;
  tasks: number;
}

const BEFORE_CODE = `const user = await loadUser();
const posts = await loadPosts();
const projects = await loadProjects();`;
const AFTER_CODE = `const [user, posts, projects] = await Promise.all([
  loadUser(),
  loadPosts(),
  loadProjects(),
]);`;
const TASK_COUNT = 4;
const PAYLOADS = Array.from({ length: TASK_COUNT }, (_, task) => {
  const bytes = new Uint8Array(new ArrayBuffer(768 * 1_024));
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = (index + task * 31) % 256;
  return bytes;
});

async function digest(payload: Uint8Array<ArrayBuffer>) {
  return crypto.subtle.digest("SHA-256", payload);
}

export function ConcurrencyLab() {
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, AsyncMetrics>>>({});

  async function runMode(mode: BenchmarkMode) {
    const benchmark = await runAsynchronousBenchmark(async () => {
      if (mode === "before") {
        const outputs: ArrayBuffer[] = [];
        for (const payload of PAYLOADS) outputs.push(await digest(payload));
        return outputs;
      }
      return Promise.all(PAYLOADS.map(digest));
    });
    return {
      durationMs: benchmark.medianMs,
      runs: benchmark.samplesMs.length,
      tasks: benchmark.result.length,
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
      description="Run the same independent Web Crypto jobs sequentially or concurrently and compare median completion time."
      title="Concurrency & Async"
    >
      <Card>
        <CardHeader>
          <CardTitle>Four independent digest tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonRunButton onClick={() => void run()} pending={pending} />
          <p className="text-sm text-muted-foreground" role="status">
            The benchmark performs one warm-up and reports the median of five real Web Crypto runs.
          </p>
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="Promise.all overlaps independent asynchronous work when the runtime has capacity. Results vary by browser and hardware; parallel work can be slower under contention, and large task sets should use bounded concurrency rather than launching everything at once."
        metrics={[
          {
            after: results.after?.durationMs,
            before: results.before?.durationMs,
            format: formatDuration,
            label: "Median completion",
          },
          {
            after: results.after?.tasks,
            before: results.before?.tasks,
            label: "Completed tasks",
            lowerIsBetter: false,
          },
          {
            after: results.after?.runs,
            before: results.before?.runs,
            label: "Measured runs",
            lowerIsBetter: false,
          },
        ]}
      />
      <Alert>
        <AlertTitle>Keep dependencies sequential</AlertTitle>
        <AlertDescription>
          If loading posts requires the user ID returned by the first operation, start the posts
          request only after that dependency resolves. Promise.all is for independent work, not
          dependent steps.
        </AlertDescription>
      </Alert>
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
