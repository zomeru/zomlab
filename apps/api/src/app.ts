import { Elysia } from "elysia";

export const app = new Elysia().get("/", () => "Hello from Elysia!");

export const elysiaApp = new Elysia({ prefix: "/api" }).use(app);
