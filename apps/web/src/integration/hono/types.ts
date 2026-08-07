import type { AuthSession, AuthUser } from "@zomlab/auth";
import type { NoteService } from "~/integration/hono/service/core/notes.service";

export type AuthVariables = {
  session: AuthSession;
  user: AuthUser;
};

export interface AppVariables extends AuthVariables {
  noteService: NoteService;
}

export type AppBindings = {
  VITE_SITE_URL: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export interface HonoEnv {
  Variables: AppVariables;
  Bindings: AppBindings;
}
