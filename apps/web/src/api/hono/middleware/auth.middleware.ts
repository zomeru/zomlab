// apps/web/src/api/hono/middleware/auth.middleware.ts

import { auth } from "@zomlab/auth";
import { createMiddleware } from "hono/factory";

import type { HonoEnv } from "../types";

export const requireAuth = createMiddleware<HonoEnv>(async (context, next) => {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  if (!session) {
    return context.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      },
      401,
    );
  }

  context.set("session", session);
  context.set("user", session.user);

  await next();
});
