import { hc } from "hono/client";
import type { ApiApp } from "~/integration/hono/app";

type Client = ReturnType<typeof hc<ApiApp>>;

let _client: Client | undefined;

function getClient(): Client {
  if (!_client) {
    _client = hc<ApiApp>(import.meta.env.VITE_SITE_URL, {
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
