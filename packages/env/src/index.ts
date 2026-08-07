import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VITE_SITE_URL: z.url(),
  DATABASE_URL: z.url(),
  E2E_PORT: z.coerce.number().default(3100),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
});

type Env = z.infer<typeof envSchema>;

function getCloudflareEnv(): Record<string, unknown> | undefined {
  try {
    // cloudflare:workers is available in Workers runtime (including local dev via Vite plugin)
    const { env } = require("cloudflare:workers") as { env: Record<string, unknown> };
    return env;
  } catch {
    return undefined;
  }
}

function createEnv(): Env {
  const cloudflareEnv = getCloudflareEnv();

  const envSource = {
    ...process.env,
    ...(cloudflareEnv ?? {}),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };

  const result = envSchema.safeParse(envSource);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");

    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }

    process.exit(1);
  }

  return result.data;
}

let _env: Env | undefined;

export const env = new Proxy<Env>({} as Env, {
  get(_target, key: string) {
    if (!_env) {
      _env = createEnv();
    }
    return _env[key as keyof Env];
  },
});
