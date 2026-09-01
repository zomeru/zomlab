"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import {
  forwardRef,
  lazy,
  Profiler,
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import { EagerPreview } from "./eager-preview";

interface LazyMetrics {
  readyMs: number;
  renderDurationMs: number;
  requests: number;
  transferredBytes: number;
}

const DeferredPreview = lazy(() =>
  import("./deferred-preview").then((module) => ({ default: module.DeferredPreview })),
);
const BEFORE_CODE = `import { EagerPreview } from "./eager-preview";

export function Page() {
  return <EagerPreview />;
}`;
const AFTER_CODE = `const DeferredPreview = lazy(
  () => import("./deferred-preview"),
);

return showPreview ? (
  <Suspense fallback={<PreviewSkeleton />}>
    <DeferredPreview />
  </Suspense>
) : null;`;

function resourcesSince(startedAt: number) {
  return performance
    .getEntriesByType("resource")
    .filter((entry) => entry.startTime >= startedAt) as PerformanceResourceTiming[];
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

interface LazyExperimentHandle {
  run: () => Promise<LazyMetrics>;
}

interface PendingLazyMeasurement {
  resolve: (metrics: LazyMetrics) => void;
  startedAt: number;
}

const LazyExperiment = forwardRef<LazyExperimentHandle, { mode: BenchmarkMode }>(
  function LazyExperiment({ mode }, ref) {
    const [show, setShow] = useState(false);
    const [runId, setRunId] = useState(0);
    const measurement = useRef<PendingLazyMeasurement | undefined>(undefined);
    const renderDuration = useRef(0);

    const finish = useCallback(() => {
      const current = measurement.current;
      if (!current) return;
      const entries = resourcesSince(current.startedAt);
      current.resolve({
        readyMs: performance.now() - current.startedAt,
        renderDurationMs: renderDuration.current,
        requests: entries.length,
        transferredBytes: entries.reduce((total, entry) => total + entry.transferSize, 0),
      });
      measurement.current = undefined;
    }, []);

    useImperativeHandle(ref, () => ({
      async run() {
        setShow(false);
        await nextFrame();
        renderDuration.current = 0;
        return new Promise<LazyMetrics>((resolve) => {
          measurement.current = { resolve, startedAt: performance.now() };
          setRunId((value) => value + 1);
          setShow(true);
        });
      },
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "before" ? "Unoptimized eager resource" : "Optimized deferred resource"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {show ? (
            <Profiler
              id={`${mode}-${runId}`}
              key={runId}
              onRender={(_id, phase, actualDuration) => {
                renderDuration.current += actualDuration;
                if (mode === "before" && phase === "mount") {
                  requestAnimationFrame(finish);
                }
              }}
            >
              {mode === "before" ? (
                <EagerPreview />
              ) : (
                <Suspense
                  fallback={<p className="text-sm text-muted-foreground">Loading preview chunk…</p>}
                >
                  <DeferredPreview onReady={finish} />
                </Suspense>
              )}
            </Profiler>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the comparison to render this preview.
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
);

export function LazyLoadingLab() {
  const beforeExperiment = useRef<LazyExperimentHandle>(null);
  const afterExperiment = useRef<LazyExperimentHandle>(null);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, LazyMetrics>>>({});

  async function run() {
    setPending(true);
    setResults({});
    try {
      setResults(
        await runComparison((mode) => {
          const experiment = mode === "before" ? beforeExperiment.current : afterExperiment.current;
          if (!experiment) throw new Error("The lazy-loading experiment is not ready.");
          return experiment.run();
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Compare rendering an eagerly bundled analytics preview with importing the equivalent component only after interaction."
      title="Lazy Loading"
    >
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <ComparisonRunButton
          onClick={() => void run()}
          pending={pending}
          pendingLabel="Rendering eager, then deferred…"
        />
        <p className="text-sm text-muted-foreground" role="status">
          {results.before && results.after
            ? `Eager: ${formatBytes(results.before.transferredBytes)} after interaction. Deferred: ${formatBytes(results.after.transferredBytes)}.`
            : "One click renders both previews in sequence and records their interaction cost."}
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LazyExperiment mode="before" ref={beforeExperiment} />
        <LazyExperiment mode="after" ref={afterExperiment} />
      </div>
      <BenchmarkComparison
        interpretation="The eager component is already part of the route chunk, so interaction adds no module request but its code was paid for during navigation. The deferred component moves that work behind intent. A repeated deferred run may report zero transferred bytes because the browser module cache is working."
        metrics={[
          {
            after: results.after?.readyMs,
            before: results.before?.readyMs,
            format: formatDuration,
            label: "Interaction to ready",
          },
          {
            after: results.after?.renderDurationMs,
            before: results.before?.renderDurationMs,
            format: formatDuration,
            label: "React render duration",
          },
          {
            after: results.after?.requests,
            before: results.before?.requests,
            label: "Requests after interaction",
            lowerIsBetter: false,
          },
          {
            after: results.after?.transferredBytes,
            before: results.before?.transferredBytes,
            format: formatBytes,
            label: "Bytes after interaction",
            lowerIsBetter: false,
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
