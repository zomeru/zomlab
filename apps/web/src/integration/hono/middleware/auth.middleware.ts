// apps/web/src/api/hono/middleware/auth.middleware.ts

import { auth } from "@zomlab/auth";
import { createMiddleware } from "hono/factory";

import type { HonoEnv } from "../types";

export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      },
      401,
    );
  }

  c.set("session", session);
  c.set("user", session.user);

  await next();
});
