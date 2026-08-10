import type { AuthSession, AuthUser } from "@zomlab/auth/server";
import type { NoteService } from "~/integration/hono/service/core/notes.service";

type AuthVariables = {
  session: AuthSession;
  user: AuthUser;
};

interface AppVariables extends AuthVariables {
  noteService: NoteService;
}

type AppBindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_GITHUB_CLIENT_ID: string;
  BETTER_AUTH_GITHUB_CLIENT_SECRET: string;
  BETTER_AUTH_GOOGLE_CLIENT_ID: string;
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: string;
  MY_RATE_LIMITER: RateLimit;
};

export interface HonoEnv {
  Variables: AppVariables;
  Bindings: AppBindings;
}
