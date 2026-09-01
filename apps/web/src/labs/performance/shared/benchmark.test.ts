import { describe, expect, test } from "vitest";
import {
  createRecords,
  improvementPercentage,
  median,
  runComparison,
  runSynchronousBenchmark,
} from "./benchmark";

describe("performance benchmark helpers", () => {
  test("calculates odd and even medians without mutating the input", () => {
    const values = [9, 1, 5, 3];

    expect(median(values)).toBe(4);
    expect(median([7, 1, 4])).toBe(4);
    expect(values).toEqual([9, 1, 5, 3]);
  });

  test("rejects an empty sample", () => {
    expect(() => median([])).toThrow("without values");
  });

  test("calculates lower-is-better improvement and guards invalid baselines", () => {
    expect(improvementPercentage(100, 25)).toBe(75);
    expect(improvementPercentage(0, 0)).toBeNull();
    expect(improvementPercentage(Number.NaN, 2)).toBeNull();
  });

  test("runs repeatable synchronous work and keeps its result", () => {
    const benchmark = runSynchronousBenchmark(() => 21 * 2, { runs: 3, warmup: false });

    expect(benchmark.result).toBe(42);
    expect(benchmark.samplesMs).toHaveLength(3);
    expect(benchmark.medianMs).toBeGreaterThanOrEqual(0);
  });

  test("runs an unoptimized and optimized comparison sequentially", async () => {
    const executionOrder: string[] = [];

    const comparison = await runComparison(async (mode) => {
      executionOrder.push(`${mode}:start`);
      await Promise.resolve();
      executionOrder.push(`${mode}:finish`);
      return mode.length;
    });

    expect(executionOrder).toEqual([
      "before:start",
      "before:finish",
      "after:start",
      "after:finish",
    ]);
    expect(comparison).toEqual({ after: 5, before: 6 });
  });

  test("generates deterministic records", () => {
    expect(createRecords(2)).toEqual([
      { category: "group-0", id: "record-0", label: "Performance record 00000", score: 0 },
      { category: "group-1", id: "record-1", label: "Performance record 00001", score: 37 },
    ]);
  });
});
