import { env } from "cloudflare:workers";
import { OpenAPIHono } from "@hono/zod-openapi";
import "@tanstack/react-start/server-only";
import { contextStorage } from "hono/context-storage";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import { rateLimiter } from "hono-rate-limiter";
import { apiErrorHandler, notFoundHandler } from "~/integration/hono/errors/error-handler";
import { privateResponseMiddleware } from "~/integration/hono/middleware/private-response.middleware";
import fileRoutes from "~/integration/hono/routes/core/files.route";
import noteRoutes from "~/integration/hono/routes/core/notes.route";
import systemRoutes from "~/integration/hono/routes/system/system.route";
import type { HonoEnv } from "~/integration/hono/types";

function getRateLimitBinding() {
  if (!env.MY_RATE_LIMITER) {
    throw new Error("Missing Cloudflare MY_RATE_LIMITER binding");
  }

  return env.MY_RATE_LIMITER;
}

export const apiApp = new OpenAPIHono<HonoEnv>()
  .basePath("/api")
  .onError(apiErrorHandler)
  .notFound(notFoundHandler)

  // Request normalization / infrastructure
  .use(trimTrailingSlash())
  .use(requestId())
  .use(contextStorage())

  // Observability
  .use(logger())
  .use(timing())

  // Security
  .use(csrf())
  .use(secureHeaders())

  // Traffic protection
  .use(
    rateLimiter({
      binding: getRateLimitBinding,
      keyGenerator: (c) =>
        c.req.header("cf-connecting-ip") ??
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous",
      message: {
        error: "Rate limit exceeded",
        retryAfter: "60s",
      },
    }),
  )

  // Core
  .use("/files/*", privateResponseMiddleware)
  .route("/files", fileRoutes)
  .use("/notes/*", privateResponseMiddleware)
  .route("/notes", noteRoutes)

  // System
  .route("/", systemRoutes);

export type ApiApp = typeof apiApp;
