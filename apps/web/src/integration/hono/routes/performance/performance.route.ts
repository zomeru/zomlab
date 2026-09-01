import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  performanceApiQuerySchema,
  performanceApiResponseSchema,
  performanceCacheInvalidationSchema,
  performanceCacheQuerySchema,
  performanceCacheResponseSchema,
  performanceDatabaseResponseSchema,
  performanceDatasetBodySchema,
  performanceDatasetResponseSchema,
  performanceNetworkQuerySchema,
  performanceNetworkResponseSchema,
} from "@zomlab/contracts";
import { createPerformanceRepository } from "@zomlab/database";
import { setMetric } from "hono/timing";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import { createPerformanceService } from "~/integration/hono/service/performance/performance.service";
import type { HonoEnv } from "~/integration/hono/types";

const performanceService = createPerformanceService(createPerformanceRepository());

const app = new OpenAPIHono<HonoEnv>({
  defaultHook: (result, c) => {
    if (!result.success) return apiErrorHandler(result.error, c);
  },
})
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/cache",
      request: { query: performanceCacheQuerySchema },
      responses: {
        200: {
          description: "Measured cache lookup",
          content: { "application/json": { schema: performanceCacheResponseSchema } },
        },
      },
    }),
    (c) => {
      const query = c.req.valid("query");
      const response = performanceService.runCacheBenchmark(c.var.user.id, query.key, query.mode);
      setMetric(c, "compute", response.computationDurationMs, "Cache computation");
      return c.json(response, 200);
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      middleware: [requireAuth] as const,
      path: "/cache",
      responses: {
        200: {
          description: "Cache invalidation result",
          content: { "application/json": { schema: performanceCacheInvalidationSchema } },
        },
      },
    }),
    (c) => c.json(performanceService.invalidateCache(c.var.user.id), 200),
  )
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/api",
      request: { query: performanceApiQuerySchema },
      responses: {
        200: {
          description: "Measured API response",
          content: { "application/json": { schema: performanceApiResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { mode } = c.req.valid("query");
      const response = await performanceService.runApiBenchmark(c.var.user.id, mode);
      setMetric(c, "db", response.metrics.databaseDurationMs, "Database");
      setMetric(c, "app", response.metrics.serverDurationMs, "Application");
      return c.json(response, 200);
    },
  )
  .openapi(
    createRoute({
      method: "post",
      middleware: [requireAuth] as const,
      path: "/database/prepare",
      request: {
        body: { content: { "application/json": { schema: performanceDatasetBodySchema } } },
      },
      responses: {
        200: {
          description: "Prepared performance dataset",
          content: { "application/json": { schema: performanceDatasetResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { size } = c.req.valid("json");
      return c.json(await performanceService.prepareDataset(c.var.user.id, size), 200);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/database",
      responses: {
        200: {
          description: "PostgreSQL query-plan comparison",
          content: { "application/json": { schema: performanceDatabaseResponseSchema } },
        },
      },
    }),
    async (c) => c.json(await performanceService.runDatabaseBenchmark(c.var.user.id), 200),
  )
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/network",
      request: { query: performanceNetworkQuerySchema },
      responses: {
        200: {
          description: "Independent network resource",
          content: { "application/json": { schema: performanceNetworkResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { part } = c.req.valid("query");
      const response = await performanceService.readNetworkPart(part);
      setMetric(c, "work", response.serverDurationMs, "Resource work");
      return c.json(response, 200);
    },
  );

export default app;
