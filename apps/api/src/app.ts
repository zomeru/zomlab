import { Elysia, t } from "elysia";

export const app = new Elysia()
  .state("startTime", Date.now())
  .get("/health", ({ store }) => ({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - store.startTime,
  }))
  .get(
    "/version",
    () => ({
      name: "zomlab-api",
      version: "0.1.0",
    }),
    {
      response: t.Object({
        name: t.String(),
        version: t.String(),
      }),
    },
  )
  .get("/ready", () => ({ ready: true }));

export const elysiaApp = new Elysia({ prefix: "/api" }).use(app);

export type App = typeof elysiaApp;
