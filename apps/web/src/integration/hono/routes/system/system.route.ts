import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  healthResponseSchema,
  readyResponseSchema,
  versionResponseSchema,
} from "@zomlab/contracts";
import type { HonoEnv } from "~/integration/hono/types";

const startedAt = Date.now();

const app = new OpenAPIHono<HonoEnv>()
  .openapi(
    createRoute({
      method: "get",
      path: "/health",
      responses: {
        200: {
          description: "Health check response",
          content: {
            "application/json": {
              schema: healthResponseSchema,
            },
          },
        },
      },
    }),
    (c) => {
      return c.json(
        {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
          uptime: Date.now() - startedAt,
        },
        200,
      );
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/ready",
      responses: {
        200: {
          description: "Readiness check response",
          content: {
            "application/json": {
              schema: readyResponseSchema,
            },
          },
        },
      },
    }),
    (c) => {
      return c.json({ ready: true }, 200);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/version",
      responses: {
        200: {
          description: "Version information",
          content: {
            "application/json": {
              schema: versionResponseSchema,
            },
          },
        },
      },
    }),
    (c) => {
      return c.json(
        {
          name: "zomlab-api",
          version: "0.1.0",
        },
        200,
      );
    },
  );

export default app;
