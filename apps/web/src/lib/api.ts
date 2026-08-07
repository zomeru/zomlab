import { env } from "@zomlab/env";
import { hc } from "hono/client";
import type { ApiApp } from "~/integration/hono/app";

export const client = hc<ApiApp>(env.VITE_SITE_URL, {
  init: {
    credentials: "include",
  },
});
