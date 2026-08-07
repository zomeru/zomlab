import { createAuth } from "@zomlab/auth/create-auth";
import { workerPasswordProvider } from "@zomlab/auth/password/worker";
import { createDatabase, type Database } from "@zomlab/database";
import { parseApiWorkerEnv } from "@zomlab/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiErrorHandler, notFoundHandler } from "./errors/error-handler";
import type { AuthVariables } from "./middleware/auth";
import { requireSession } from "./middleware/auth";
import { createNoteRepository } from "./modules/notes/repository";
import { createNotesRouter } from "./modules/notes/routes";
import type { NoteService } from "./modules/notes/service";
import { createNoteService } from "./modules/notes/service";
import systemRoutes from "./routes/system";

export interface ApiBindings {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  SITE_URL: string;
  APP_ENV: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

type Auth = ReturnType<typeof createAuth>;

export interface AppVariables extends AuthVariables {
  getAuth: Auth;
  database: Database;
  noteService: NoteService;
}

export function createApp(bindings?: ApiBindings) {
  const app = new Hono<{
    Bindings: ApiBindings;
    Variables: AppVariables;
  }>();

  app.onError(apiErrorHandler);
  app.notFound(notFoundHandler);

  app.use(
    cors({
      origin: bindings?.SITE_URL ?? "*",
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  );

  app.use(async (c, next) => {
    const env =
      bindings ?? (parseApiWorkerEnv(c.env as unknown as Record<string, unknown>) as ApiBindings);

    console.log("Bindings:", env);

    const database = createDatabase({
      connectionString: env.DATABASE_URL,
    });

    const auth = createAuth({
      database,
      env: {
        BETTER_AUTH_URL: env.BETTER_AUTH_URL,
        BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
        SITE_URL: env.SITE_URL,
        GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      },
      password: workerPasswordProvider,
      sendMagicLink: async ({ email, url }) => {
        console.log(`[magic-link] Send to ${email}: ${url}`);
      },
    });

    c.set("getAuth", auth);
    c.set("database", database);
    await next();
  });

  app.on(["GET", "POST"], "/api/auth/*", (c) => {
    const auth = c.var.getAuth;
    return auth.handler(c.req.raw);
  });

  app.route("/", systemRoutes);

  app.use("/api/notes/*", requireSession);
  app.use("/api/notes/*", async (c, next) => {
    const database = c.var.database;
    const noteService = createNoteService(createNoteRepository(database));
    c.set("noteService", noteService);
    await next();
  });
  app.route("/", createNotesRouter());

  return app;
}

export type AppType = ReturnType<typeof createApp>;
