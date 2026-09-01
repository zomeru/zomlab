"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { forwardRef, memo, Profiler, useImperativeHandle, useRef, useState } from "react";
import { type BenchmarkMode, formatDuration, runComparison } from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { ComparisonRunButton } from "../shared/comparison-run-button";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface RenderMetrics {
  calculationCalls: number;
  childRenders: number;
  parentRenders: number;
  renderDurationMs: number;
}

const BEFORE_CODE = `function Parent() {
  const [unrelated, setUnrelated] = useState(0);
  return <ExpensiveChild config={{ label: "Report" }} />;
}`;

const AFTER_CODE = `const ExpensiveChild = memo(ExpensiveChildView);
const stableConfig = { label: "Report" };

function Parent() {
  const [unrelated, setUnrelated] = useState(0);
  return <ExpensiveChild config={stableConfig} />;
}`;

const STABLE_CONFIG = { label: "Performance report" };

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function ExpensiveChildView({
  config,
  stats,
}: {
  config: { label: string };
  stats: React.RefObject<RenderMetrics>;
}) {
  stats.current.childRenders += 1;
  stats.current.calculationCalls += 1;

  let checksum = 0;
  for (let index = 0; index < 90_000; index += 1) checksum = (checksum + index * 17) % 65_521;

  return (
    <div className="rounded-lg bg-muted/60 p-4 text-sm">
      <p className="font-medium text-foreground">{config.label}</p>
      <p className="mt-1 font-mono text-muted-foreground">checksum: {checksum}</p>
    </div>
  );
}

const MemoizedExpensiveChild = memo(ExpensiveChildView);

interface RenderExperimentHandle {
  run: () => Promise<RenderMetrics>;
}

const RenderExperiment = forwardRef<RenderExperimentHandle, { mode: BenchmarkMode }>(
  function RenderExperiment({ mode }, ref) {
    const [unrelated, setUnrelated] = useState(0);
    const stats = useRef<RenderMetrics>({
      calculationCalls: 0,
      childRenders: 0,
      parentRenders: 0,
      renderDurationMs: 0,
    });
    stats.current.parentRenders += 1;

    useImperativeHandle(ref, () => ({
      async run() {
        stats.current = {
          calculationCalls: 0,
          childRenders: 0,
          parentRenders: 0,
          renderDurationMs: 0,
        };
        for (let index = 0; index < 10; index += 1) {
          await nextFrame();
          setUnrelated((value) => value + 1);
        }
        await nextFrame();
        return { ...stats.current };
      },
    }));

    const child =
      mode === "before" ? (
        <ExpensiveChildView config={{ label: "Performance report" }} stats={stats} />
      ) : (
        <MemoizedExpensiveChild config={STABLE_CONFIG} stats={stats} />
      );

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "before" ? "Unoptimized parent" : "Optimized child boundary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unrelated parent value: <span className="font-mono tabular-nums">{unrelated}</span>
          </p>
          <Profiler
            id={`rendering-${mode}`}
            onRender={(_id, _phase, actualDuration) => {
              stats.current.renderDurationMs += actualDuration;
            }}
          >
            {child}
          </Profiler>
        </CardContent>
      </Card>
    );
  },
);

export function ReactRenderingLab() {
  const beforeExperiment = useRef<RenderExperimentHandle>(null);
  const afterExperiment = useRef<RenderExperimentHandle>(null);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchmarkMode, RenderMetrics>>>({});

  async function run() {
    setPending(true);
    setResults({});
    try {
      setResults(
        await runComparison((mode) => {
          const experiment = mode === "before" ? beforeExperiment.current : afterExperiment.current;
          if (!experiment) throw new Error("The rendering experiment is not ready.");
          return experiment.run();
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Trigger unrelated parent updates and measure whether an expensive child renders again."
      title="React Rendering"
    >
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <ComparisonRunButton onClick={() => void run()} pending={pending} />
        <p className="text-sm text-muted-foreground" role="status">
          Both panels receive the same 10 unrelated state updates, one implementation at a time.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RenderExperiment mode="before" ref={beforeExperiment} />
        <RenderExperiment mode="after" ref={afterExperiment} />
      </div>
      <BenchmarkComparison
        interpretation="The optimized boundary combines a stable prop with React.memo, so unrelated parent state does not require the expensive child to render again. Memoization is useful here because the child work is deliberately substantial and its inputs are unchanged."
        metrics={[
          {
            after: results.after?.parentRenders,
            before: results.before?.parentRenders,
            label: "Parent renders",
          },
          {
            after: results.after?.childRenders,
            before: results.before?.childRenders,
            label: "Child renders",
          },
          {
            after: results.after?.calculationCalls,
            before: results.before?.calculationCalls,
            label: "Expensive calculations",
          },
          {
            after: results.after?.renderDurationMs,
            before: results.before?.renderDurationMs,
            format: formatDuration,
            label: "Profiler render duration",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
