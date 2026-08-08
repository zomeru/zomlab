import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db, schema } from "@zomlab/database";
import { env } from "@zomlab/env";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

function createAuth() {
  const options: BetterAuthOptions = {
    appName: "ZomLab",
    basePath: "/api/auth",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        accounts: schema.accounts,
        sessions: schema.sessions,
        verification: schema.verification,
      },
    }),

    account: {
      encryptOAuthTokens: true,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    socialProviders: {
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          console.log(`[magic-link] Send to ${email}: ${url}`);
        },
      }),
    ],
  };

  return betterAuth(options);
}

type AuthType = ReturnType<typeof createAuth>;

let _auth: AuthType | undefined;

function getAuth(): AuthType {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

export const auth = new Proxy({} as AuthType, {
  get(_target, key: string) {
    return getAuth()[key as keyof AuthType];
  },
});

export type Auth = AuthType;
export type AuthSession = AuthType["$Infer"]["Session"];
export type AuthUser = AuthSession["user"];
