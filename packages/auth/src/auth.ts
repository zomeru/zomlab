import { prismaAdapter } from "@better-auth/prisma-adapter";
import { hash, type Options, verify } from "@node-rs/argon2";
import { db } from "@zomlab/database";
import { env } from "@zomlab/env";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Argon2id parameters tuned for interactive login.
 * 64 MiB memory, 3 iterations, 4 parallel lanes, 32-byte output.
 */
const argon2Options: Options = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
  algorithm: 2, // Argon2id
};

// Inferred type — do NOT add an explicit `ReturnType<typeof betterAuth>` annotation.
// betterAuth({...specific config...}) returns Auth<SpecificConfig>, not Auth<BetterAuthOptions>,
// and the explicit annotation causes a TS2322 incompatibility.
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  account: {
    // Encrypt OAuth tokens at rest (AES-256-GCM) using the auth secret.
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    password: {
      hash: (password) => hash(password, argon2Options),
      verify: ({ password, hash: storedHash }) => verify(storedHash, password, argon2Options),
    },
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
});
