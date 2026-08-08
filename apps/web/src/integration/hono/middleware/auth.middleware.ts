// apps/web/src/integration/hono/middleware/auth.middleware.ts

import { auth } from "@zomlab/auth";
import { createMiddleware } from "hono/factory";

import { UnauthorizedError } from "../errors/api-error";
import type { HonoEnv } from "../types";

export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new UnauthorizedError("Authentication is required.");
  }

  c.set("session", session);
  c.set("user", session.user);

  await next();
});
