import type {
  PerformanceApiResponse,
  PerformanceCacheResponse,
  PerformanceDatasetSize,
  PerformanceMode,
  PerformanceNetworkPart,
} from "@zomlab/contracts";
import type { PerformanceRepository } from "@zomlab/database";

interface CacheEntry {
  checksum: number;
  computationCount: number;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();
let computationCount = 0;

function computeChecksum(key: string) {
  const startedAt = performance.now();
  let checksum = 0;
  for (let index = 0; index < 240_000; index += 1) {
    checksum = (checksum + key.charCodeAt(index % key.length) * (index + 1)) % 2_147_483_647;
  }
  computationCount += 1;
  return { checksum, computationDurationMs: performance.now() - startedAt };
}

function responseBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function createPerformanceService(repository: PerformanceRepository) {
  return {
    runCacheBenchmark(
      ownerId: string,
      key: string,
      mode: PerformanceMode,
    ): PerformanceCacheResponse {
      const startedAt = performance.now();
      const cacheKey = `${ownerId}:${key}`;

      if (mode === "before") {
        const computed = computeChecksum(key);
        return {
          cacheAgeMs: null,
          cacheStatus: "bypass",
          checksum: computed.checksum,
          computationCount,
          computationDurationMs: computed.computationDurationMs,
          mode,
          serverDurationMs: performance.now() - startedAt,
        };
      }

      const cached = cache.get(cacheKey);
      if (cached) {
        return {
          cacheAgeMs: performance.now() - cached.createdAt,
          cacheStatus: "hit",
          checksum: cached.checksum,
          computationCount: cached.computationCount,
          computationDurationMs: 0,
          mode,
          serverDurationMs: performance.now() - startedAt,
        };
      }

      const computed = computeChecksum(key);
      cache.set(cacheKey, {
        checksum: computed.checksum,
        computationCount,
        createdAt: performance.now(),
      });
      return {
        cacheAgeMs: 0,
        cacheStatus: "miss",
        checksum: computed.checksum,
        computationCount,
        computationDurationMs: computed.computationDurationMs,
        mode,
        serverDurationMs: performance.now() - startedAt,
      };
    },

    invalidateCache(ownerId: string) {
      let invalidatedEntries = 0;
      for (const key of cache.keys()) {
        if (!key.startsWith(`${ownerId}:`)) continue;
        cache.delete(key);
        invalidatedEntries += 1;
      }
      return { invalidatedEntries };
    },

    async runApiBenchmark(ownerId: string, mode: PerformanceMode): Promise<PerformanceApiResponse> {
      const startedAt = performance.now();
      const result = await repository.runApiBenchmark(ownerId, mode);
      const baseMetrics = {
        databaseDurationMs: result.databaseDurationMs,
        databaseQueries: result.databaseQueries,
        databaseRoundTrips: result.databaseRoundTrips,
        payloadBytes: 0,
        rowsReturned: result.records.length,
        serverDurationMs: performance.now() - startedAt,
      };

      const response =
        result.mode === "before"
          ? { metrics: baseMetrics, mode: result.mode, records: result.records }
          : { metrics: baseMetrics, mode: result.mode, records: result.records };

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const measuredBytes = responseBytes(response);
        if (measuredBytes === response.metrics.payloadBytes) break;
        response.metrics.payloadBytes = measuredBytes;
      }

      return response;
    },

    prepareDataset(ownerId: string, size: PerformanceDatasetSize) {
      return repository.prepareDataset(ownerId, size);
    },

    runDatabaseBenchmark(ownerId: string) {
      return repository.runDatabaseBenchmark(ownerId);
    },

    async readNetworkPart(part: PerformanceNetworkPart) {
      const startedAt = performance.now();
      const input = new TextEncoder().encode(`${part}:`.repeat(32_000));
      const digest = await crypto.subtle.digest("SHA-256", input);
      const signature = Array.from(new Uint8Array(digest).slice(0, 8), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const values = Array.from(
        { length: 180 },
        (_, index) => `${part}-${index.toString().padStart(3, "0")}-${signature}`,
      );

      return { part, serverDurationMs: performance.now() - startedAt, values };
    },
  };
}
