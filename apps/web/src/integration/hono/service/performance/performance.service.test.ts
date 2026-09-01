import { describe, expect, test, vi } from "vitest";
import { createPerformanceService } from "./performance.service";

function repositoryStub() {
  return {
    prepareDataset: vi.fn(),
    runApiBenchmark: vi.fn(),
    runDatabaseBenchmark: vi.fn(),
  };
}

describe("performance service cache", () => {
  test("reports a miss, a hit, and explicit invalidation", () => {
    const service = createPerformanceService(repositoryStub());
    const first = service.runCacheBenchmark("cache-test-user", "report", "after");
    const second = service.runCacheBenchmark("cache-test-user", "report", "after");

    expect(first.cacheStatus).toBe("miss");
    expect(second.cacheStatus).toBe("hit");
    expect(second.checksum).toBe(first.checksum);
    expect(second.computationDurationMs).toBe(0);
    expect(service.invalidateCache("cache-test-user")).toEqual({ invalidatedEntries: 1 });
    expect(service.runCacheBenchmark("cache-test-user", "report", "after").cacheStatus).toBe(
      "miss",
    );
  });

  test("bypasses cache in the unoptimized mode", () => {
    const service = createPerformanceService(repositoryStub());

    expect(service.runCacheBenchmark("cache-bypass-user", "report", "before").cacheStatus).toBe(
      "bypass",
    );
    expect(
      service.runCacheBenchmark("cache-bypass-user", "report", "before").cacheAgeMs,
    ).toBeNull();
  });
});
