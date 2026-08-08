import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok"]),
  timestamp: z.iso.datetime(),
  uptime: z.number(),
});

export const readyResponseSchema = z.object({
  ready: z.boolean(),
});

export const versionResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadyResponse = z.infer<typeof readyResponseSchema>;
export type VersionResponse = z.infer<typeof versionResponseSchema>;
