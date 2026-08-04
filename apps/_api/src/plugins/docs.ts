import { openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

const isDev = process.env.NODE_ENV === "development";

/** Dev-only documentation: Swagger UI + OpenAPI schema. Never exposed in production. */
export const docsPlugin = new Elysia({ name: "docs" })
  .use(
    isDev
      ? swagger({
          path: "/docs",
          documentation: {
            info: {
              title: "ZomLab API",
              version: "0.1.0",
            },
            tags: [{ name: "Notes" }, { name: "System" }],
          },
        })
      : (app) => app,
  )
  .use(isDev ? openapi() : (app) => app);
