import type {
  PerformanceApiResponse,
  PerformanceDatabasePlan,
  PerformanceDatasetSize,
  PerformanceMode,
} from "@zomlab/contracts";
import { and, asc, count, eq, gt, sql } from "drizzle-orm";
import { db } from "../../client";
import { performanceRecordsAfter, performanceRecordsBefore } from "../../db/schema/performance";
import { createPerformanceSeedRows, performanceLookupKey } from "./data";

const INSERT_CHUNK_SIZE = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`PostgreSQL query plan omitted ${label}.`);
}

function readPlanDocument(value: unknown): Record<string, unknown> {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  const document = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!isRecord(document)) throw new Error("PostgreSQL returned an unreadable query plan.");
  return document;
}

function countScannedRows(node: Record<string, unknown>): number {
  const actualRows = typeof node["Actual Rows"] === "number" ? node["Actual Rows"] : 0;
  const removed =
    typeof node["Rows Removed by Filter"] === "number" ? node["Rows Removed by Filter"] : 0;
  const children = Array.isArray(node.Plans) ? node.Plans.filter(isRecord) : [];
  if (children.length > 0) {
    return children.reduce((total, child) => total + countScannedRows(child), 0);
  }
  return Math.round(actualRows + removed);
}

function parsePlan(value: unknown): PerformanceDatabasePlan {
  const document = readPlanDocument(value);
  const plan = document.Plan;
  if (!isRecord(plan)) throw new Error("PostgreSQL query plan omitted its root node.");

  return {
    executionTimeMs: readNumber(document["Execution Time"], "execution time"),
    nodeType: typeof plan["Node Type"] === "string" ? plan["Node Type"] : "Unknown",
    planningTimeMs: readNumber(document["Planning Time"], "planning time"),
    rowsReturned: Math.round(readNumber(plan["Actual Rows"], "actual rows")),
    rowsScanned: countScannedRows(plan),
  };
}

async function explainLookup(ownerId: string, lookupKey: string, mode: PerformanceMode) {
  const query =
    mode === "before"
      ? sql`EXPLAIN (ANALYZE, FORMAT JSON) SELECT id, label, score FROM ${performanceRecordsBefore} WHERE ${performanceRecordsBefore.ownerId} = ${ownerId} AND ${performanceRecordsBefore.lookupKey} = ${lookupKey} LIMIT 1`
      : sql`EXPLAIN (ANALYZE, FORMAT JSON) SELECT id, label, score FROM ${performanceRecordsAfter} WHERE ${performanceRecordsAfter.ownerId} = ${ownerId} AND ${performanceRecordsAfter.lookupKey} = ${lookupKey} LIMIT 1`;
  const result = await db.execute<{ "QUERY PLAN": unknown }>(query);
  const plan = result.rows[0]?.["QUERY PLAN"];
  if (plan === undefined) throw new Error("PostgreSQL did not return a query plan.");
  return parsePlan(plan);
}

export function createPerformanceRepository() {
  return {
    async prepareDataset(ownerId: string, size: PerformanceDatasetSize) {
      const rows = createPerformanceSeedRows(ownerId, size, new Date());
      await db.batch([
        db.delete(performanceRecordsBefore).where(eq(performanceRecordsBefore.ownerId, ownerId)),
        db.delete(performanceRecordsAfter).where(eq(performanceRecordsAfter.ownerId, ownerId)),
      ]);

      for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
        const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE);
        await db.batch([
          db.insert(performanceRecordsBefore).values(chunk),
          db.insert(performanceRecordsAfter).values(chunk),
        ]);
      }

      return {
        lookupKey: performanceLookupKey(Math.floor(size / 2)),
        rowsPerTable: size,
      };
    },

    async runDatabaseBenchmark(ownerId: string) {
      const [sizeRows, lookupRows] = await db.batch([
        db
          .select({ value: count() })
          .from(performanceRecordsAfter)
          .where(eq(performanceRecordsAfter.ownerId, ownerId)),
        db
          .select({ lookupKey: performanceRecordsAfter.lookupKey })
          .from(performanceRecordsAfter)
          .where(eq(performanceRecordsAfter.ownerId, ownerId))
          .orderBy(asc(performanceRecordsAfter.lookupKey))
          .limit(1),
      ]);
      const datasetSize = sizeRows[0]?.value ?? 0;
      const lookupKey = lookupRows[0]?.lookupKey ?? null;

      if (!lookupKey) {
        return { after: null, before: null, datasetSize, lookupKey, prepared: false };
      }

      const before = await explainLookup(ownerId, lookupKey, "before");
      const after = await explainLookup(ownerId, lookupKey, "after");
      return { after, before, datasetSize, lookupKey, prepared: true };
    },

    async runApiBenchmark(ownerId: string, mode: PerformanceMode) {
      const startedAt = performance.now();
      if (mode === "before") {
        const [totalRows] = await db
          .select({ value: count() })
          .from(performanceRecordsBefore)
          .where(eq(performanceRecordsBefore.ownerId, ownerId));
        const [highScoreRows] = await db
          .select({ value: count() })
          .from(performanceRecordsBefore)
          .where(
            and(
              eq(performanceRecordsBefore.ownerId, ownerId),
              gt(performanceRecordsBefore.score, 800),
            ),
          );
        const records = await db
          .select()
          .from(performanceRecordsBefore)
          .where(eq(performanceRecordsBefore.ownerId, ownerId))
          .orderBy(asc(performanceRecordsBefore.lookupKey))
          .limit(500);

        return {
          databaseDurationMs: performance.now() - startedAt,
          databaseQueries: 3,
          databaseRoundTrips: 3,
          diagnostics: { highScores: highScoreRows?.value ?? 0, total: totalRows?.value ?? 0 },
          mode,
          records: records.map((record) => ({
            ...record,
            createdAt: record.createdAt.toISOString(),
          })),
        };
      }

      const records = await db
        .select({ id: performanceRecordsAfter.id, label: performanceRecordsAfter.label })
        .from(performanceRecordsAfter)
        .where(eq(performanceRecordsAfter.ownerId, ownerId))
        .orderBy(asc(performanceRecordsAfter.lookupKey))
        .limit(50);

      return {
        databaseDurationMs: performance.now() - startedAt,
        databaseQueries: 1,
        databaseRoundTrips: 1,
        mode,
        records,
      };
    },
  };
}

export type PerformanceRepository = ReturnType<typeof createPerformanceRepository>;
export type PerformanceApiRepositoryResult = Awaited<
  ReturnType<PerformanceRepository["runApiBenchmark"]>
>;
export type PerformanceApiRecord = PerformanceApiResponse["records"][number];
