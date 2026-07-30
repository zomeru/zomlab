import type { App } from "@api/app";
import { treaty } from "@elysia/eden";
import { env } from "@zomlab/env";

/**
 * Eden treaty client — provides end-to-end type safety inferred
 * directly from the Elysia app definition.
 *
 * The API is embedded in Next.js at `/api/*`, so requests go to
 * the same origin. For SSR, pass the full server URL.
 *
 * Usage:
 *   const { data, error } = await api.health.get()
 *   const { data, error } = await api.version.get()
 *   const { data, error } = await api.ready.get()
 */

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }

  // SSR: point to the Next.js server
  return env.NEXT_PUBLIC_SITE_URL;
}

export const api = treaty<App>(getBaseUrl()).api;
