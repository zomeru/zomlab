import { t } from "elysia";

export const SystemModel = {
  healthResponse: t.Object({
    status: t.Literal("ok"),
    timestamp: t.String(),
    uptime: t.Number(),
  }),
  versionResponse: t.Object({
    name: t.String(),
    version: t.String(),
  }),
  readyResponse: t.Object({
    ready: t.Boolean(),
  }),
} as const;
