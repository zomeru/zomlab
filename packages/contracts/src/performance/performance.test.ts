import { describe, expect, test } from "vitest";
import {
  performanceCacheResponseSchema,
  performanceDatabaseResponseSchema,
  performanceModeSchema,
} from "./performance";

describe("performance contracts", () => {
  test("accepts only explicit benchmark modes", () => {
    expect(performanceModeSchema.parse("before")).toBe("before");
    expect(() => performanceModeSchema.parse("fast")).toThrow();
  });

  test("validates measured cache responses", () => {
    expect(
      performanceCacheResponseSchema.parse({
        cacheAgeMs: 12.5,
        cacheStatus: "hit",
        checksum: 42,
        computationCount: 1,
        computationDurationMs: 0,
        mode: "after",
        serverDurationMs: 0.2,
      }),
    ).toMatchObject({ cacheStatus: "hit", mode: "after" });
  });

  test("represents an unprepared database benchmark without fake plan values", () => {
    expect(
      performanceDatabaseResponseSchema.parse({
        after: null,
        before: null,
        datasetSize: 0,
        lookupKey: null,
        prepared: false,
      }),
    ).toMatchObject({ prepared: false });
  });
});
