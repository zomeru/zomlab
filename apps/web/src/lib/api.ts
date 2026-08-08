import { clientEnv, env } from "@zomlab/env";
import { hc } from "hono/client";
import type { ApiApp } from "~/integration/hono/app";

type Client = ReturnType<typeof hc<ApiApp>>;

let _client: Client | undefined;

function getClient(): Client {
  console.log("cleintEnv", clientEnv.VITE_SITE_URL);
  console.log("env", env);

  if (!_client) {
    _client = hc<ApiApp>(clientEnv.VITE_SITE_URL ?? "", {
      init: {
        credentials: "include",
      },
    });
  }
  return _client;
}

export const client = new Proxy({} as Client, {
  get(_target, key: string) {
    return getClient()[key as keyof Client];
  },
});
