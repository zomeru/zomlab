export interface BenchmarkRun<T> {
  medianMs: number;
  result: T;
  samplesMs: number[];
}

export type BenchmarkMode = "before" | "after";

export async function runComparison<T>(
  work: (mode: BenchmarkMode) => Promise<T> | T,
): Promise<Record<BenchmarkMode, T>> {
  const before = await work("before");
  const after = await work("after");
  return { after, before };
}

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate a median without values.");
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const middleValue = sorted[middle];

  if (middleValue === undefined) {
    throw new Error("Cannot calculate a median without values.");
  }

  if (sorted.length % 2 === 1) return middleValue;

  const previousValue = sorted[middle - 1];
  if (previousValue === undefined) return middleValue;
  return (previousValue + middleValue) / 2;
}

export function improvementPercentage(before: number, after: number): number | null {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0) return null;
  return ((before - after) / before) * 100;
}

export function formatDuration(value: number): string {
  if (value < 0.01) return "< 0.01 ms";
  if (value < 10) return `${value.toFixed(2)} ms`;
  return `${value.toFixed(1)} ms`;
}

export function formatBytes(value: number): string {
  if (value < 1_024) return `${value.toLocaleString()} B`;
  if (value < 1_048_576) return `${(value / 1_024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(2)} MB`;
}

export function runSynchronousBenchmark<T>(
  work: () => T,
  options: { runs?: number; warmup?: boolean } = {},
): BenchmarkRun<T> {
  const runs = options.runs ?? 7;
  if (!Number.isInteger(runs) || runs < 1 || runs > 50) {
    throw new Error("Benchmark runs must be an integer between 1 and 50.");
  }

  if (options.warmup !== false) work();

  const startedAt = performance.now();
  let result = work();
  const samplesMs = [performance.now() - startedAt];
  for (let index = 1; index < runs; index += 1) {
    const startedAt = performance.now();
    result = work();
    samplesMs.push(performance.now() - startedAt);
  }

  return { medianMs: median(samplesMs), result, samplesMs };
}

export async function runAsynchronousBenchmark<T>(
  work: () => Promise<T>,
  options: { runs?: number; warmup?: boolean } = {},
): Promise<BenchmarkRun<T>> {
  const runs = options.runs ?? 5;
  if (!Number.isInteger(runs) || runs < 1 || runs > 20) {
    throw new Error("Async benchmark runs must be an integer between 1 and 20.");
  }

  if (options.warmup !== false) await work();

  const startedAt = performance.now();
  let result = await work();
  const samplesMs = [performance.now() - startedAt];
  for (let index = 1; index < runs; index += 1) {
    const startedAt = performance.now();
    result = await work();
    samplesMs.push(performance.now() - startedAt);
  }

  return { medianMs: median(samplesMs), result, samplesMs };
}

export function createRecords(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    category: `group-${index % 17}`,
    id: `record-${index}`,
    label: `Performance record ${index.toString().padStart(5, "0")}`,
    score: (index * 37) % 1_003,
  }));
}
