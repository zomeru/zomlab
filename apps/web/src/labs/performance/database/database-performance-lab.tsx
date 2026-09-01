"use client";

import type { PerformanceDatabaseResponse, PerformanceDatasetSize } from "@zomlab/contracts";
import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Label } from "@zomlab/ui/components/label";
import { Select } from "@zomlab/ui/components/select";
import { useState } from "react";
import { client } from "~/lib/api";
import { formatDuration } from "../shared/benchmark";
import { BenchmarkComparison } from "../shared/benchmark-comparison";
import { CodeComparison } from "../shared/code-comparison";
import { PerformanceLabShell } from "../shared/performance-lab-shell";

const BEFORE_CODE = `SELECT id, label, score
FROM performance_records_before
WHERE owner_id = $1 AND lookup_key = $2;

-- Only owner_id is indexed.`;
const AFTER_CODE = `CREATE INDEX performance_records_after_owner_lookup_idx
ON performance_records_after (owner_id, lookup_key);

SELECT id, label, score
FROM performance_records_after
WHERE owner_id = $1 AND lookup_key = $2;`;

function parseDatasetSize(value: string): PerformanceDatasetSize {
  const size = Number(value);
  if (size === 1_000 || size === 2_500 || size === 5_000) return size;
  return 2_500;
}

export function DatabasePerformanceLab() {
  const [size, setSize] = useState<PerformanceDatasetSize>(2_500);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PerformanceDatabaseResponse>();

  async function prepare() {
    setError("");
    setPending(true);
    try {
      const response = await client.api.performance.database.prepare.$post({ json: { size } });
      if (!response.ok)
        throw new Error(`Dataset preparation failed with status ${response.status}.`);
      const data = await response.json();
      setMessage(
        `Prepared ${data.rowsPerTable.toLocaleString()} rows in each isolated comparison table.`,
      );
      setResult(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dataset preparation failed.");
    } finally {
      setPending(false);
    }
  }

  async function run() {
    setError("");
    setPending(true);
    try {
      const response = await client.api.performance.database.$get();
      if (!response.ok)
        throw new Error(`Database benchmark failed with status ${response.status}.`);
      setResult(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The database benchmark failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PerformanceLabShell
      description="Use PostgreSQL EXPLAIN ANALYZE to compare the same owner-scoped lookup without and with a composite index."
      title="Database Performance"
    >
      <Card>
        <CardHeader>
          <CardTitle>Isolated demo dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full space-y-2 sm:w-48">
              <Label htmlFor="database-dataset-size">Rows per table</Label>
              <Select
                id="database-dataset-size"
                onChange={(event) => setSize(parseDatasetSize(event.target.value))}
                value={size}
              >
                <option value={1000}>1,000</option>
                <option value={2500}>2,500</option>
                <option value={5000}>5,000</option>
              </Select>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => void prepare()}
              type="button"
            >
              Prepare dataset
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => void run()}
              type="button"
              variant="outline"
            >
              Run EXPLAIN ANALYZE
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" role="status">
            {pending ? "Database operation in progress…" : message}
          </p>
          {error ? (
            <Alert role="alert" variant="destructive">
              {error}
            </Alert>
          ) : null}
          {result && !result.prepared ? (
            <Alert variant="warning">
              <AlertTitle>Prepare the dataset first</AlertTitle>
              <AlertDescription>
                Data is inserted only from the explicit action above, never during page load.
                Preparation replaces this user&apos;s prior synthetic rows, so it is idempotent.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <BenchmarkComparison
        interpretation="The composite index can locate an owner and lookup key directly; the unoptimized table must filter many candidate rows. Indexes also consume storage and add write work, so add them for measured query patterns rather than every column."
        metrics={[
          {
            after: result?.after?.executionTimeMs,
            before: result?.before?.executionTimeMs,
            format: formatDuration,
            label: "Execution time",
          },
          {
            after: result?.after?.planningTimeMs,
            before: result?.before?.planningTimeMs,
            format: formatDuration,
            label: "Planning time",
          },
          {
            after: result?.after?.rowsScanned,
            before: result?.before?.rowsScanned,
            label: "Rows scanned",
          },
          {
            after: result?.after?.rowsReturned,
            before: result?.before?.rowsReturned,
            label: "Rows returned",
            lowerIsBetter: false,
          },
          {
            after: result?.after?.nodeType,
            before: result?.before?.nodeType,
            label: "Plan node",
          },
        ]}
      />
      <CodeComparison after={AFTER_CODE} before={BEFORE_CODE} />
    </PerformanceLabShell>
  );
}
