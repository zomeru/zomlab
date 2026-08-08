import { hc } from "hono/client";
import { getClientEnv } from "~/config/env";
import type { ApiApp } from "~/integration/hono/app";

type Client = ReturnType<typeof hc<ApiApp>>;

let _client: Client | undefined;

function getClient(): Client {
  const viteSiteUrl = getClientEnv().VITE_SITE_URL;

  if (!_client) {
    _client = hc<ApiApp>(viteSiteUrl, {
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
