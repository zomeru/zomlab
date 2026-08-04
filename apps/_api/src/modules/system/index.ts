import { Elysia } from "elysia";
import { SystemModel } from "./model";

export const system = new Elysia({ tags: ["System"] })
  .state("startTime", Date.now())
  .model(SystemModel)
  .get(
    "/health",
    ({ store }) => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - store.startTime,
    }),
    { response: "healthResponse" },
  )
  .get("/version", () => ({ name: "zomlab-api", version: "0.1.0" }), {
    response: "versionResponse",
  })
  .get("/ready", () => ({ ready: true }), { response: "readyResponse" });
