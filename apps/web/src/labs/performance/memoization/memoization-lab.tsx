"use client";

import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Input } from "@zomlab/ui/components/input";
import { Label } from "@zomlab/ui/components/label";
import {
  forwardRef,
  memo,
  useCallback,
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

interface MemoMetrics {
  calculationCount: number;
  calculationDurationMs: number;
  listRenders: number;
  renders: number;
}

const RECORDS = createRecords(10_000);
const BEFORE_CODE = `const filtered = expensiveFilter(records, query);
const select = (id) => setSelectedId(id);

return <MemoizedList items={filtered} onSelect={select} />;`;
const AFTER_CODE = `const filtered = useMemo(
  () => expensiveFilter(records, query),
  [query],
);
const select = useCallback((id) => setSelectedId(id), []);

return <MemoizedList items={filtered} onSelect={select} />;`;

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function filterRecords(query: string, metrics: React.RefObject<MemoMetrics>) {
  const startedAt = performance.now();
  const normalized = query.trim().toLowerCase();
  const matches = RECORDS.filter((record) => {
    let signal = record.score;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      signal = (signal * 31 + iteration) % 4_093;
    }
    return record.label.toLowerCase().includes(normalized) && signal >= 0;
  });
  metrics.current.calculationCount += 1;
  metrics.current.calculationDurationMs += performance.now() - startedAt;
  return matches;
}

const ResultsList = memo(function ResultsList({
  items,
  metrics,
  onSelect,
}: {
  items: ReturnType<typeof createRecords>;
  metrics: React.RefObject<MemoMetrics>;
  onSelect: (id: string) => void;
}) {
  metrics.current.listRenders += 1;
  return (
    <ul className="grid gap-2 sm:grid-cols-2" aria-label="Filtered records">
      {items.slice(0, 8).map((item) => (
        <li key={item.id}>
          <Button
            className="w-full justify-start"
            onClick={() => onSelect(item.id)}
            variant="outline"
          >
            {item.label}
          </Button>
        </li>
      ))}
    </ul>
  );
});

interface MemoExperimentHandle {
  run: () => Promise<MemoMetrics>;
}

const MemoExperiment = forwardRef<
  MemoExperimentHandle,
  {
    mode: BenchmarkMode;
    query: string;
  }
>(function MemoExperiment({ mode, query }, ref) {
  const optimized = mode === "after";
  const [selectedId, setSelectedId] = useState("");
  const [unrelated, setUnrelated] = useState(0);
  const metrics = useRef<MemoMetrics>({
    calculationCount: 0,
    calculationDurationMs: 0,
    listRenders: 0,
    renders: 0,
  });
  metrics.current.renders += 1;

  const memoizedRecords = useMemo(
    () => (optimized ? filterRecords(query, metrics) : []),
    [optimized, query],
  );
  const records = optimized ? memoizedRecords : filterRecords(query, metrics);
  const stableSelect = useCallback((id: string) => setSelectedId(id), []);
  const unstableSelect = (id: string) => setSelectedId(id);

  useImperativeHandle(ref, () => ({
    async run() {
      metrics.current = {
        calculationCount: 0,
        calculationDurationMs: 0,
        listRenders: 0,
        renders: 0,
      };
      for (let index = 0; index < 8; index += 1) {
        await nextFrame();
        setUnrelated((value) => value + 1);
      }
      await nextFrame();
      return { ...metrics.current };
    },
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>10,000-record filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Unrelated updates: <span className="font-mono">{unrelated}</span>
          {selectedId ? ` · selected ${selectedId}` : ""}
        </p>
        <ResultsList
          items={records}
          metrics={metrics}
          onSelect={optimized ? stableSelect : unstableSelect}
        />
      </CardContent>
    </Card>
  );
});

export function MemoizationLab() {
  const beforeExperiment = useRef<MemoExperimentHandle>(null);
  const afterExperiment = useRef<MemoExperimentHandle>(null);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("record 09");
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, MemoMetrics>>>({});

  async function run() {
    setPending(true);
    setResults({});
    try {
      setResults(
        await runComparison((mode) => {
          const experiment = mode === "before" ? beforeExperiment.current : afterExperiment.current;
          if (!experiment) throw new Error("The memoization experiment is not ready.");
          return experiment.run();
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Compare recalculating a 10,000-record filter with caching derived data and stable child props."
      title="Memoization"
    >
      <Card>
        <CardHeader>
          <CardTitle>Shared benchmark input</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="memo-query">Filter query</Label>
            <Input
              disabled={pending}
              id="memo-query"
              onChange={(event) => setQuery(event.target.value)}
              value={query}
            />
          </div>
          <ComparisonRunButton onClick={() => void run()} pending={pending} />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <MemoExperiment mode="before" query={query} ref={beforeExperiment} />
        <MemoExperiment mode="after" query={query} ref={afterExperiment} />
      </div>
      <BenchmarkComparison
        interpretation="useMemo avoids repeating the measured filter when only unrelated state changes; useCallback keeps the memoized list prop stable. For cheap calculations or frequently changing dependencies, this bookkeeping may provide little value."
        metrics={[
          {
            after: results.after?.calculationCount,
            before: results.before?.calculationCount,
            label: "Filter calculations",
          },
          {
            after: results.after?.calculationDurationMs,
            before: results.before?.calculationDurationMs,
            format: formatDuration,
            label: "Filter execution",
          },
          {
            after: results.after?.listRenders,
            before: results.before?.listRenders,
            label: "Memoized list renders",
          },
          {
            after: results.after?.renders,
            before: results.before?.renders,
            label: "Experiment renders",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
