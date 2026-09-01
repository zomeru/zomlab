import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { improvementPercentage } from "./benchmark";

export interface ComparisonMetric {
  after?: number | string;
  before?: number | string;
  format?: (value: number) => string;
  label: string;
  lowerIsBetter?: boolean;
  unit?: string;
}

function displayValue(metric: ComparisonMetric, value: number | string | undefined) {
  if (value === undefined) return "Not run";
  if (typeof value === "string") return value;
  if (metric.format) return metric.format(value);
  return `${value.toLocaleString()}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function displayImprovement(metric: ComparisonMetric) {
  if (typeof metric.before !== "number" || typeof metric.after !== "number") return "—";
  if (metric.lowerIsBetter === false) return "—";
  const improvement = improvementPercentage(metric.before, metric.after);
  if (improvement === null) return "—";
  return `${improvement.toFixed(1)}%`;
}

export function BenchmarkComparison({
  interpretation,
  metrics,
}: {
  interpretation: string;
  metrics: ComparisonMetric[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance comparison</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 sm:space-y-5">
        <dl className="divide-y divide-border rounded-lg border border-border md:hidden">
          {metrics.map((metric) => (
            <div className="p-4" key={metric.label}>
              <dt className="font-medium text-foreground">{metric.label}</dt>
              <dd className="mt-3">
                <dl className="grid grid-cols-3 gap-3">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Before</dt>
                    <dd className="mt-1 break-words font-mono text-xs tabular-nums text-foreground">
                      {displayValue(metric, metric.before)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">After</dt>
                    <dd className="mt-1 break-words font-mono text-xs tabular-nums text-foreground">
                      {displayValue(metric, metric.after)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Change</dt>
                    <dd className="mt-1 break-words font-mono text-xs tabular-nums text-foreground">
                      {displayImprovement(metric)}
                    </dd>
                  </div>
                </dl>
              </dd>
            </div>
          ))}
        </dl>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-muted/65 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">
                  Metric
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  Before
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  After
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  Improvement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((metric) => (
                <tr key={metric.label}>
                  <th className="px-4 py-3 font-medium text-foreground" scope="row">
                    {metric.label}
                  </th>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {displayValue(metric, metric.before)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {displayValue(metric, metric.after)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-foreground">
                    {displayImprovement(metric)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="break-words text-sm leading-relaxed text-muted-foreground" role="status">
          <span className="font-medium text-foreground">Result: </span>
          {interpretation}
        </p>
      </CardContent>
    </Card>
  );
}
