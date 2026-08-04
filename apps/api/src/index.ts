import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { node } from "@elysia/node";
import { env } from "@zomlab/env";
import { Elysia } from "elysia";
import { app } from "./app";

export function startServer(port = env.API_PORT) {
  let server: { stop: () => unknown } | undefined;
  const standaloneApp = new Elysia({ adapter: node() })
    .mount(app.handle)
    .listen(port, (listener) => {
      server = listener;
    });

  return {
    app: standaloneApp,
    stop: () => server?.stop(),
  };
}

function isEntrypoint() {
  return fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
}

if (isEntrypoint()) {
  const standaloneServer = startServer();
  console.log(`🦊 Server is running on port ${env.API_PORT}`);

  const closeServer = () => {
    standaloneServer.stop();
  };

  process.once("SIGINT", closeServer);
  process.once("SIGTERM", closeServer);
}
