"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Label } from "@zomlab/ui/components/label";
import { Select } from "@zomlab/ui/components/select";
import {
  forwardRef,
  Profiler,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type BenchmarkMode,
  createRecords,
  formatDuration,
  runComparison,
} from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface VirtualMetrics {
  domRows: number;
  renderDurationMs: number;
}

const BEFORE_CODE = `return (
  <div className="scroll-container">
    {records.map((record) => <Row key={record.id} record={record} />)}
  </div>
);`;
const AFTER_CODE = `const virtualizer = useVirtualizer({
  count: records.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 42,
  overscan: 6,
});

return virtualizer.getVirtualItems().map((row) => (
  <Row key={row.key} record={records[row.index]} />
));`;

function Row({ label, score }: { label: string; score: number }) {
  return (
    <div
      className="flex h-[42px] items-center justify-between border-b border-border px-3 text-sm"
      data-performance-row
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums text-muted-foreground">{score}</span>
    </div>
  );
}

function FullList({ count, onRows }: { count: number; onRows: (count: number) => void }) {
  const records = useMemo(() => createRecords(count), [count]);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRows(container.current?.querySelectorAll("[data-performance-row]").length ?? 0);
  }, [onRows]);

  return (
    <div className="h-96 overflow-auto rounded-lg border border-border" ref={container}>
      {records.map((record) => (
        <Row key={record.id} label={record.label} score={record.score} />
      ))}
    </div>
  );
}

function VirtualList({ count, onRows }: { count: number; onRows: (count: number) => void }) {
  const records = useMemo(() => createRecords(count), [count]);
  const parent = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count,
    estimateSize: () => 42,
    getScrollElement: () => parent.current,
    overscan: 6,
  });
  const virtualRows = virtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualRows.length > 0) onRows(virtualRows.length);
  }, [onRows, virtualRows.length]);

  return (
    <div className="h-96 overflow-auto rounded-lg border border-border" ref={parent}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualRows.map((virtualRow) => {
          const record = records[virtualRow.index];
          if (!record) return null;
          return (
            <div
              className="absolute left-0 top-0 w-full"
              key={virtualRow.key}
              style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
            >
              <Row label={record.label} score={record.score} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface VirtualExperimentHandle {
  run: (count: number) => Promise<VirtualMetrics>;
}

interface PendingMeasurement {
  renderDurationMs?: number;
  resolve: (metrics: VirtualMetrics) => void;
  rows?: number;
}

const VirtualExperiment = forwardRef<VirtualExperimentHandle, { mode: BenchmarkMode }>(
  function VirtualExperiment({ mode }, ref) {
    const [run, setRun] = useState<{ count: number; id: number }>();
    const nextRunId = useRef(0);
    const measurement = useRef<PendingMeasurement | undefined>(undefined);

    const finishIfReady = useCallback(() => {
      const current = measurement.current;
      if (!current || current.renderDurationMs === undefined || current.rows === undefined) return;
      current.resolve({ domRows: current.rows, renderDurationMs: current.renderDurationMs });
      measurement.current = undefined;
    }, []);

    const recordRows = useCallback(
      (rows: number) => {
        if (!measurement.current) return;
        measurement.current.rows = rows;
        finishIfReady();
      },
      [finishIfReady],
    );

    useImperativeHandle(ref, () => ({
      run(count) {
        return new Promise<VirtualMetrics>((resolve) => {
          measurement.current = { resolve };
          nextRunId.current += 1;
          setRun({ count, id: nextRunId.current });
        });
      },
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>{mode === "before" ? "Unoptimized full list" : "Optimized window"}</CardTitle>
        </CardHeader>
        <CardContent>
          {run ? (
            <Profiler
              id={`virtual-${mode}-${run.id}`}
              key={run.id}
              onRender={(_id, phase, actualDuration) => {
                if (phase !== "mount" || !measurement.current) return;
                measurement.current.renderDurationMs = actualDuration;
                finishIfReady();
              }}
            >
              {mode === "before" ? (
                <FullList count={run.count} onRows={recordRows} />
              ) : (
                <VirtualList count={run.count} onRows={recordRows} />
              )}
            </Profiler>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the comparison to render this implementation.
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
);

export function VirtualizationLab() {
  const [count, setCount] = useState(10_000);
  const beforeExperiment = useRef<VirtualExperimentHandle>(null);
  const afterExperiment = useRef<VirtualExperimentHandle>(null);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, VirtualMetrics>>>({});

  async function run() {
    const benchmarkCount = count;
    setPending(true);
    setResults({});
    try {
      setResults(
        await runComparison((mode) => {
          const experiment = mode === "before" ? beforeExperiment.current : afterExperiment.current;
          if (!experiment) throw new Error("The virtualization experiment is not ready.");
          return experiment.run(benchmarkCount);
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Render the same large collection in full or keep only the visible window in the DOM."
      title="Virtualization"
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-full space-y-2 sm:w-48">
            <Label htmlFor="virtual-row-count">Dataset size</Label>
            <Select
              id="virtual-row-count"
              disabled={pending}
              onChange={(event) => setCount(Number(event.target.value))}
              value={count}
            >
              <option value={1000}>1,000 rows</option>
              <option value={5000}>5,000 rows</option>
              <option value={10000}>10,000 rows</option>
            </Select>
          </div>
          <ComparisonRunButton
            className="w-full sm:w-auto"
            onClick={() => void run()}
            pending={pending}
            pendingLabel="Rendering unoptimized, then optimized…"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <VirtualExperiment mode="before" ref={beforeExperiment} />
        <VirtualExperiment mode="after" ref={afterExperiment} />
      </div>

      <BenchmarkComparison
        interpretation="The virtualized version preserves the full scroll range while mounting only the visible rows plus a small overscan buffer. The full-list run is capped at 10,000 rows to avoid freezing the page."
        metrics={[
          {
            after: results.after?.renderDurationMs,
            before: results.before?.renderDurationMs,
            format: formatDuration,
            label: "Initial React render",
          },
          {
            after: results.after?.domRows,
            before: results.before?.domRows,
            label: "DOM rows",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
