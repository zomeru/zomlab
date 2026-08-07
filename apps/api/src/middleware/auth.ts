import type { createAuth } from "@zomlab/auth/";
import type { Context, Next } from "hono";

type Auth = ReturnType<typeof createAuth>;

export interface AuthVariables {
  user: { id: string; email: string; name?: string | null } | null;
  session: { id: string; userId: string } | null;
}

export async function requireAuth(c: Context, next: Next) {
  const auth = c.var.getAuth as Auth | undefined;

  if (!auth) {
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Auth not configured" } },
      500,
    );
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
}
