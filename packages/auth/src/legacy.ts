import { createDatabase, type Database } from "@zomlab/database";
import { env } from "@zomlab/env";
import { createAuth } from "./auth";
import { nodePasswordProvider } from "./password/node";

let _legacyAuth: ReturnType<typeof createAuth> | undefined;

export function getLegacyAuth() {
  if (!_legacyAuth) {
    const globalForDb = globalThis as unknown as {
      db: Database | undefined;
    };

    function getDb(): Database {
      if (!globalForDb.db) {
        globalForDb.db = createDatabase({
          connectionString: env.DATABASE_URL,
        });
      }
      return globalForDb.db;
    }

    _legacyAuth = createAuth({
      database: getDb(),
      env: {
        BETTER_AUTH_URL: env.BETTER_AUTH_URL,
        BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
        SITE_URL: env.NEXT_PUBLIC_SITE_URL,
        GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      },
      password: nodePasswordProvider,
      sendMagicLink: async ({ email, url }) => {
        console.log(`[magic-link] Send to ${email}: ${url}`);
      },
    });
  }
  return _legacyAuth;
}
