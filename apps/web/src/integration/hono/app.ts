import { OpenAPIHono } from "@hono/zod-openapi";
// import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiErrorHandler, notFoundHandler } from "~/integration/hono/errors/error-handler";
import noteRoutes from "~/integration/hono/routes/core/notes.route";
import systemRoutes from "~/integration/hono/routes/system/system.route";
import type { HonoEnv } from "~/integration/hono/types";

export const apiApp = new OpenAPIHono<HonoEnv>()
  .basePath("/api")
  .onError(apiErrorHandler)
  .notFound(notFoundHandler)
  .use(
    cors({
      origin: "*",
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  )
  .route("/", noteRoutes)
  .route("/", systemRoutes);

export type ApiApp = typeof apiApp;
