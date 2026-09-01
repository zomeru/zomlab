"use client";

import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { formatBytes } from "../shared/benchmark";
import { CodeComparison } from "../shared/code-comparison";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

interface BundlePart {
  bytes: number;
  chunkCount?: number;
  fileName?: string;
  initial?: boolean;
  modules?: number;
  name?: string;
}

interface BundleReport {
  asyncBytes: number;
  chunks: BundlePart[];
  dependencies: BundlePart[];
  duplicatedDependencies: BundlePart[];
  generatedAt: string;
  initialBytes: number;
  mode: string;
  totalBytes: number;
}

const BEFORE_CODE = `import { runEagerAnalytics } from "./eager-analytics";

runEagerAnalytics(values); // included with the route`;
const AFTER_CODE = `const analytics = await import("./heavy-analytics");

analytics.runDeferredAnalytics(values); // separate chunk`;

function isBundlePart(value: unknown): value is BundlePart {
  return (
    typeof value === "object" &&
    value !== null &&
    "bytes" in value &&
    typeof value.bytes === "number"
  );
}

function parseReport(value: unknown): BundleReport {
  if (typeof value !== "object" || value === null)
    throw new Error("Bundle report is not an object.");
  if (
    !("totalBytes" in value) ||
    typeof value.totalBytes !== "number" ||
    !("initialBytes" in value) ||
    typeof value.initialBytes !== "number" ||
    !("asyncBytes" in value) ||
    typeof value.asyncBytes !== "number" ||
    !("generatedAt" in value) ||
    typeof value.generatedAt !== "string" ||
    !("mode" in value) ||
    typeof value.mode !== "string" ||
    !("chunks" in value) ||
    !Array.isArray(value.chunks) ||
    !value.chunks.every(isBundlePart) ||
    !("dependencies" in value) ||
    !Array.isArray(value.dependencies) ||
    !value.dependencies.every(isBundlePart) ||
    !("duplicatedDependencies" in value) ||
    !Array.isArray(value.duplicatedDependencies) ||
    !value.duplicatedDependencies.every(isBundlePart)
  ) {
    throw new Error("Bundle report has an unexpected shape.");
  }
  return {
    asyncBytes: value.asyncBytes,
    chunks: value.chunks,
    dependencies: value.dependencies,
    duplicatedDependencies: value.duplicatedDependencies,
    generatedAt: value.generatedAt,
    initialBytes: value.initialBytes,
    mode: value.mode,
    totalBytes: value.totalBytes,
  };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
        {formatBytes(value)}
      </dd>
    </div>
  );
}

export function BundleAnalysisLab() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<BundleReport>();

  async function loadReport() {
    setError("");
    setPending(true);
    try {
      const response = await fetch("/performance-bundle-report.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          "No production bundle report is available. Build and preview the app first.",
        );
      }
      setReport(parseReport(await response.json()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The bundle report could not be read.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Inspect JavaScript sizes produced from the current Vite build, including initial, asynchronous, chunk, and dependency contributions."
      title="Bundle Analysis"
    >
      <Card>
        <CardHeader>
          <CardTitle>Generated build artifact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => void loadReport()}
            type="button"
          >
            {pending ? "Reading report…" : "Load bundle report"}
          </Button>
          {report ? (
            <p className="text-sm text-muted-foreground" role="status">
              {report.mode} report generated {new Date(report.generatedAt).toLocaleString()}.
            </p>
          ) : null}
          {error ? (
            <Alert variant="warning" role="alert">
              <AlertTitle>Production artifact required</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {report ? (
        <section aria-labelledby="bundle-composition-heading">
          <h2 className="text-xl font-semibold tracking-tight" id="bundle-composition-heading">
            Bundle composition
          </h2>
          <div className="mt-4 space-y-3">
            <dl className="grid gap-4 sm:grid-cols-3" aria-label="Bundle totals">
              <Stat label="Total client JavaScript" value={report.totalBytes} />
              <Stat label="Initial JavaScript" value={report.initialBytes} />
              <Stat label="Lazy-loaded JavaScript" value={report.asyncBytes} />
            </dl>
            <p className="text-sm text-muted-foreground">
              These are the actual uncompressed bytes emitted by the production Vite build.
            </p>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Largest chunks</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {report.chunks.map((chunk) => (
                    <li
                      className="flex items-start justify-between gap-4 text-sm"
                      key={chunk.fileName}
                    >
                      <span className="min-w-0 truncate font-mono text-muted-foreground">
                        {chunk.fileName}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {formatBytes(chunk.bytes)}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Largest dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {report.dependencies.map((dependency) => (
                    <li
                      className="flex items-start justify-between gap-4 text-sm"
                      key={dependency.name}
                    >
                      <span className="min-w-0 truncate font-mono text-muted-foreground">
                        {dependency.name} · {dependency.chunkCount} chunks
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {formatBytes(dependency.bytes)}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {report.duplicatedDependencies.length} dependency contributions appear in more than one
            emitted chunk. Chunk repetition is a lead to inspect, not proof that code bytes are
            duplicated.
          </p>
        </section>
      ) : null}
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
