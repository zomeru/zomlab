import { createMiddleware } from "hono/factory";

export const privateResponseMiddleware = createMiddleware(async (c, next) => {
  await next();

  c.header("Cache-Control", "private, no-store");
  c.header("Pragma", "no-cache");

  const vary = new Set(
    (c.res.headers.get("Vary") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  vary.add("Cookie");
  c.header("Vary", [...vary].join(", "));
});
