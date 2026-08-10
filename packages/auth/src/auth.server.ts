import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db, schema } from "@zomlab/database";
import { env } from "@zomlab/env";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { isDeployedAuthEnvironment } from "./auth-environment";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

function getAllowedHosts(authEnv: typeof env) {
  const configuredHost = new URL(authEnv.BETTER_AUTH_URL).host;
  const hosts = new Set(
    authEnv.BETTER_AUTH_ALLOWED_HOSTS.split(",")
      .map((host) => host.trim())
      .filter(Boolean),
  );
  hosts.add(configuredHost);

  if (!isDeployedAuthEnvironment(authEnv.APP_ENV, authEnv.BETTER_AUTH_URL)) {
    hosts.add("localhost:3000");
    hosts.add(`localhost:${authEnv.E2E_PORT}`);
    hosts.add("127.0.0.1:3000");
    hosts.add(`127.0.0.1:${authEnv.E2E_PORT}`);
  }

  return [...hosts];
}

export function createAuthOptions(authEnv: typeof env = env): BetterAuthOptions {
  const allowedHosts = getAllowedHosts(authEnv);
  const isDeployed = isDeployedAuthEnvironment(authEnv.APP_ENV, authEnv.BETTER_AUTH_URL);
  return {
    appName: "ZomLab",
    basePath: "/api/auth",
    baseURL: {
      allowedHosts,
      fallback: authEnv.BETTER_AUTH_URL,
      protocol: isDeployed ? "https" : "auto",
    },
    trustedOrigins: allowedHosts.flatMap((host) =>
      host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? [`http://${host}`]
        : [`https://${host}`],
    ),
    secret: authEnv.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        accounts: schema.accounts,
        sessions: schema.sessions,
        verifications: schema.verifications,
        rateLimits: schema.rateLimits,
      },
    }),

    account: {
      encryptOAuthTokens: true,
    },
    advanced: {
      useSecureCookies: isDeployed,
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
      ...(authEnv.BETTER_AUTH_GITHUB_CLIENT_ID && authEnv.BETTER_AUTH_GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: authEnv.BETTER_AUTH_GITHUB_CLIENT_ID,
              clientSecret: authEnv.BETTER_AUTH_GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      ...(authEnv.BETTER_AUTH_GOOGLE_CLIENT_ID && authEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: authEnv.BETTER_AUTH_GOOGLE_CLIENT_ID,
              clientSecret: authEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    rateLimit: {
      enabled: isDeployed,
      storage: "database",
    },
    plugins: [
      ...(!isDeployed
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
}

function createAuth() {
  return betterAuth(createAuthOptions());
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
