import type { App } from "@api/app";
import { treaty } from "@elysia/eden";

/**
 * Eden treaty client — provides end-to-end type safety inferred
 * directly from the Elysia app definition.
 *
 * The API is embedded in Next.js at `/api/*`, so requests go to
 * the same origin. For SSR, pass the full server URL.
 *
 * NOTE: Uses `process.env.NEXT_PUBLIC_SITE_URL` directly (not
 * `@zomlab/env`) so this module stays safe to import from client
 * components — Next.js inlines `NEXT_PUBLIC_*` vars on both sides.
 *
 * Usage:
 *   const { data, error } = await api.health.get()
 *   const { data, error } = await api.version.get()
 *   const { data, error } = await api.ready.get()
 */

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Empty base makes treaty parse `/api` as a hostname — resolve against origin.
    return window.location.origin;
  }

  // SSR: point to the Next.js server
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export const api = treaty<App>(getBaseUrl()).api;
