import { Elysia } from "elysia";
import { env } from "@zomlab/env";

const app = new Elysia()
  .get("/", () => "Hello from Elysia!")
  .listen(env.API_PORT);

console.log(
  `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`,
);
