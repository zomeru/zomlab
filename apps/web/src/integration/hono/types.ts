import type { AuthSession, AuthUser } from "@zomlab/auth/server";

type AuthVariables = {
  session: AuthSession;
  user: AuthUser;
};

type AppBindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_GITHUB_CLIENT_ID: string;
  BETTER_AUTH_GITHUB_CLIENT_SECRET: string;
  BETTER_AUTH_GOOGLE_CLIENT_ID: string;
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: string;
  MY_RATE_LIMITER: RateLimit;
  FILE_UPLOADS: R2Bucket;
};

export interface HonoEnv {
  Variables: AuthVariables;
  Bindings: AppBindings;
}
