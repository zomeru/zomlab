import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db, schema } from "@zomlab/database";
import { env } from "@zomlab/env";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

function getAllowedHosts() {
  const configuredHost = new URL(env.BETTER_AUTH_URL).host;
  const hosts = new Set(
    env.BETTER_AUTH_ALLOWED_HOSTS.split(",")
      .map((host) => host.trim())
      .filter(Boolean),
  );
  hosts.add(configuredHost);

  if (env.APP_ENV === "development") {
    hosts.add("localhost:3000");
    hosts.add(`localhost:${env.E2E_PORT}`);
    hosts.add("127.0.0.1:3000");
    hosts.add(`127.0.0.1:${env.E2E_PORT}`);
  }

  return [...hosts];
}

function createAuth() {
  const allowedHosts = getAllowedHosts();
  const options: BetterAuthOptions = {
    appName: "ZomLab",
    basePath: "/api/auth",
    baseURL: {
      allowedHosts,
      fallback: env.BETTER_AUTH_URL,
      protocol: env.APP_ENV === "development" ? "auto" : "https",
    },
    trustedOrigins: allowedHosts.flatMap((host) =>
      host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? [`http://${host}`]
        : [`https://${host}`],
    ),
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        accounts: schema.accounts,
        sessions: schema.sessions,
        verification: schema.verification,
        rateLimits: schema.rateLimits,
      },
    }),

    account: {
      encryptOAuthTokens: true,
    },
    advanced: {
      useSecureCookies: env.APP_ENV !== "development",
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
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
    rateLimit: {
      enabled: env.APP_ENV !== "development",
      storage: "database",
    },
    plugins: [
      ...(env.APP_ENV === "development"
        ? [
            magicLink({
              sendMagicLink: async ({ email, url }) => {
                console.info(`[magic-link] Send to ${email}: ${url}`);
              },
            }),
          ]
        : []),
      tanstackStartCookies(),
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
