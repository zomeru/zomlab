import type { AuthSession, AuthUser } from "@zomlab/auth/server";
import type { TimingVariables } from "hono/timing";

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
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PAYMONGO_SECRET_KEY: string;
  PAYMONGO_WEBHOOK_SECRET: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  MY_RATE_LIMITER: RateLimit;
  FILE_UPLOADS: R2Bucket;
};

export interface HonoEnv {
  Variables: AuthVariables & TimingVariables;
  Bindings: AppBindings;
}
