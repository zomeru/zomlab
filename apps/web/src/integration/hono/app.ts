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
import paymentRoutes from "~/integration/hono/routes/payments/payments.route";
import realtimeRoutes from "~/integration/hono/routes/realtime/realtime.route";
import systemRoutes from "~/integration/hono/routes/system/system.route";
import type { HonoEnv } from "~/integration/hono/types";
import { getRateLimitKey } from "~/integration/hono/utils/rate-limit";

function getRateLimitBinding() {
  if (!env.MY_RATE_LIMITER) {
    throw new Error("Missing Cloudflare MY_RATE_LIMITER binding");
  }

  return env.MY_RATE_LIMITER;
}

function isWebSocketUpgrade(c: { req: { header(name: string): string | undefined } }): boolean {
  return c.req.header("Upgrade")?.toLowerCase() === "websocket";
}

const secureResponseHeaders = secureHeaders();

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
  .use(timing({ enabled: (c) => !isWebSocketUpgrade(c) }))

  // Security
  .use(csrf())
  // A 101 response has immutable headers; security headers continue to apply to every HTTP route.
  .use((c, next) => (isWebSocketUpgrade(c) ? next() : secureResponseHeaders(c, next)))

  // Traffic protection
  .use(
    rateLimiter({
      binding: getRateLimitBinding,
      keyGenerator: (c) => getRateLimitKey(c.req.raw.headers) ?? "local",
      skip: (c) => getRateLimitKey(c.req.raw.headers) === undefined,
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

  // Payments
  .use("/payments/*", privateResponseMiddleware)
  .route("/payments", paymentRoutes)

  // Realtime
  .use("/realtime/sse", privateResponseMiddleware)
  .use("/realtime/chat/*", privateResponseMiddleware)
  .use("/realtime/notifications/*", privateResponseMiddleware)
  .route("/realtime", realtimeRoutes)

  // System
  .route("/", systemRoutes);

export type ApiApp = typeof apiApp;
