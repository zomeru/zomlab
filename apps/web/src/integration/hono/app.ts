import { env } from "cloudflare:workers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import { rateLimiter } from "hono-rate-limiter";
import { apiErrorHandler, notFoundHandler } from "~/integration/hono/errors/error-handler";
import { noteServiceMiddleware } from "~/integration/hono/middleware/note-service.middleware";
import noteRoutes from "~/integration/hono/routes/core/notes.route";
import systemRoutes from "~/integration/hono/routes/system/system.route";
import type { HonoEnv } from "~/integration/hono/types";

export const apiApp = new OpenAPIHono<HonoEnv>()
  .basePath("/api")
  .onError(apiErrorHandler)
  .notFound(notFoundHandler)

  // Request normalization / infrastructure
  .use(trimTrailingSlash())
  .use(contextStorage())

  // Observability
  .use(logger())
  .use(timing())

  // Security
  .use(
    cors({
      origin: (origin) => origin,
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  )
  .use(csrf())

  // Development / presentation
  .use(prettyJSON())

  // Traffic protection
  .use(
    rateLimiter({
      // biome-ignore lint/style/noNonNullAssertion: RateLimiter Binding from Cloudflare
      binding: () => env.MY_RATE_LIMITER!,
      keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
      message: {
        error: "Rate limit exceeded",
        retryAfter: "60s",
      },
    }),
  )

  // Core
  .use("/notes", noteServiceMiddleware)
  .route("/notes", noteRoutes)

  // System
  .route("/system", systemRoutes);

export type ApiApp = typeof apiApp;
