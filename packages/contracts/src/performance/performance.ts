import { z } from "zod";

export const performanceModeSchema = z.enum(["before", "after"]);

export const performanceCacheQuerySchema = z.strictObject({
  key: z.string().trim().min(1).max(80).default("quarterly-report"),
  mode: performanceModeSchema.default("before"),
});

export const performanceCacheResponseSchema = z.strictObject({
  cacheAgeMs: z.number().nonnegative().nullable(),
  cacheStatus: z.enum(["bypass", "hit", "miss"]),
  checksum: z.number().int().nonnegative(),
  computationCount: z.number().int().nonnegative(),
  computationDurationMs: z.number().nonnegative(),
  mode: performanceModeSchema,
  serverDurationMs: z.number().nonnegative(),
});

export const performanceCacheInvalidationSchema = z.strictObject({
  invalidatedEntries: z.number().int().nonnegative(),
});

export const performanceApiQuerySchema = z.strictObject({
  mode: performanceModeSchema.default("before"),
});

const performanceApiMetricsSchema = z.strictObject({
  databaseDurationMs: z.number().nonnegative(),
  databaseQueries: z.number().int().nonnegative(),
  databaseRoundTrips: z.number().int().nonnegative(),
  payloadBytes: z.number().int().nonnegative(),
  rowsReturned: z.number().int().nonnegative(),
  serverDurationMs: z.number().nonnegative(),
});

const performanceApiBeforeRecordSchema = z.strictObject({
  category: z.string(),
  createdAt: z.iso.datetime(),
  details: z.string(),
  id: z.string(),
  label: z.string(),
  lookupKey: z.string(),
  score: z.number().int(),
});

const performanceApiAfterRecordSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
});

export const performanceApiResponseSchema = z.discriminatedUnion("mode", [
  z.strictObject({
    metrics: performanceApiMetricsSchema,
    mode: z.literal("before"),
    records: z.array(performanceApiBeforeRecordSchema),
  }),
  z.strictObject({
    metrics: performanceApiMetricsSchema,
    mode: z.literal("after"),
    records: z.array(performanceApiAfterRecordSchema),
  }),
]);

export const performanceDatasetSizeSchema = z.union([
  z.literal(1_000),
  z.literal(2_500),
  z.literal(5_000),
]);

export const performanceDatasetBodySchema = z.strictObject({
  size: performanceDatasetSizeSchema.default(2_500),
});

export const performanceDatasetResponseSchema = z.strictObject({
  lookupKey: z.string(),
  rowsPerTable: performanceDatasetSizeSchema,
});

export const performanceDatabasePlanSchema = z.strictObject({
  executionTimeMs: z.number().nonnegative(),
  nodeType: z.string(),
  planningTimeMs: z.number().nonnegative(),
  rowsReturned: z.number().int().nonnegative(),
  rowsScanned: z.number().int().nonnegative(),
});

export const performanceDatabaseResponseSchema = z.strictObject({
  after: performanceDatabasePlanSchema.nullable(),
  before: performanceDatabasePlanSchema.nullable(),
  datasetSize: z.number().int().nonnegative(),
  lookupKey: z.string().nullable(),
  prepared: z.boolean(),
});

export const performanceNetworkQuerySchema = z.strictObject({
  part: z.enum(["profile", "settings", "history"]),
});

export const performanceNetworkResponseSchema = z.strictObject({
  part: z.enum(["profile", "settings", "history"]),
  serverDurationMs: z.number().nonnegative(),
  values: z.array(z.string()),
});

export type PerformanceMode = z.infer<typeof performanceModeSchema>;
export type PerformanceCacheResponse = z.infer<typeof performanceCacheResponseSchema>;
export type PerformanceApiResponse = z.infer<typeof performanceApiResponseSchema>;
export type PerformanceDatasetSize = z.infer<typeof performanceDatasetSizeSchema>;
export type PerformanceDatabasePlan = z.infer<typeof performanceDatabasePlanSchema>;
export type PerformanceDatabaseResponse = z.infer<typeof performanceDatabaseResponseSchema>;
export type PerformanceNetworkPart = z.infer<typeof performanceNetworkQuerySchema>["part"];
