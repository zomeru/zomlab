import { Elysia } from "elysia";
import { notes } from "./modules/core/crud";
import { system } from "./modules/system";
import { authPlugin } from "./plugins/auth";
import { docsPlugin } from "./plugins/docs";
import { errorPlugin } from "./plugins/error";
import { securityPlugin } from "./plugins/security";

/**
 * Elysia application — single source of truth for the API.
 *
 * All plugins and modules are registered here. The exported `App` type
 * is consumed by Eden on the frontend for end-to-end type safety.
 */
export const app = new Elysia()
  .use(errorPlugin)
  .use(securityPlugin)
  .use(authPlugin)
  .use(docsPlugin)
  .use(system)
  .use(notes);

export const elysiaApp = new Elysia({ prefix: "/api" }).use(app);

export type App = typeof elysiaApp;
