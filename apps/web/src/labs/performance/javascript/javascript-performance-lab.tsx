"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Label } from "@zomlab/ui/components/label";
import { Select } from "@zomlab/ui/components/select";
import { useMemo, useState } from "react";
import {
  type BenchmarkMode,
  createRecords,
  formatDuration,
  runComparison,
  runSynchronousBenchmark,
} from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface JavaScriptMetrics {
  durationMs: number;
  operations: number;
  runs: number;
}

const BEFORE_CODE = `for (const id of requestedIds) {
  const record = records.find((item) => item.id === id);
  results.push(record);
}`;
const AFTER_CODE = `const byId = new Map(records.map((item) => [item.id, item]));

for (const id of requestedIds) {
  results.push(byId.get(id));
}`;

export function JavaScriptPerformanceLab() {
  const [count, setCount] = useState(3_000);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, JavaScriptMetrics>>>({});
  const records = useMemo(() => createRecords(count), [count]);

  function runMode(mode: BenchmarkMode, requestedIds: string[]) {
    const benchmark = runSynchronousBenchmark(() => {
      let operations = 0;
      let checksum = 0;

      if (mode === "before") {
        for (const id of requestedIds) {
          const record = records.find((candidate) => {
            operations += 1;
            return candidate.id === id;
          });
          checksum += record?.score ?? 0;
        }
      } else {
        const byId = new Map<string, (typeof records)[number]>();
        for (const record of records) {
          operations += 1;
          byId.set(record.id, record);
        }
        for (const id of requestedIds) {
          operations += 1;
          checksum += byId.get(id)?.score ?? 0;
        }
      }

      return { checksum, operations };
    });

    return {
      durationMs: benchmark.medianMs,
      operations: benchmark.result.operations,
      runs: benchmark.samplesMs.length,
    };
  }

  async function run() {
    const requestedIds = [...records].reverse().map((record) => record.id);
    setPending(true);
    setResults({});
    try {
      setResults(await runComparison((mode) => runMode(mode, requestedIds)));
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Measure repeated linear searches against building one lookup map for the same records and requested IDs."
      title="JavaScript Performance"
    >
      <Card>
        <CardHeader>
          <CardTitle>Repeated lookup benchmark</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-full space-y-2 sm:w-48">
            <Label htmlFor="javascript-record-count">Records</Label>
            <Select
              id="javascript-record-count"
              onChange={(event) => setCount(Number(event.target.value))}
              value={count}
            >
              <option value={1000}>1,000</option>
              <option value={3000}>3,000</option>
              <option value={5000}>5,000</option>
            </Select>
          </div>
          <ComparisonRunButton
            className="w-full sm:w-auto"
            onClick={() => void run()}
            pending={pending}
          />
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The Map pays one O(n) construction cost and then performs O(1) lookups. The unoptimized loop repeatedly scans the array, producing O(n²) comparisons. The input cap keeps the intentionally slow path responsive."
        metrics={[
          {
            after: results.after?.durationMs,
            before: results.before?.durationMs,
            format: formatDuration,
            label: "Median execution",
          },
          {
            after: results.after?.operations,
            before: results.before?.operations,
            label: "Operations per run",
          },
          {
            after: results.after?.runs,
            before: results.before?.runs,
            label: "Measured runs",
            lowerIsBetter: false,
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
