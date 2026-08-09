import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.url(),
  E2E_PORT: z.coerce.number().default(3100),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_ALLOWED_HOSTS: z.string().default(""),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
});

type ServerEnv = z.infer<typeof envSchema>;

function getCloudflareEnv(): Record<string, unknown> | undefined {
  try {
    const { env } = require("cloudflare:workers") as { env: Record<string, unknown> };
    return env;
  } catch {
    return undefined;
  }
}

function getEnvSource(): Record<string, unknown> {
  return {
    ...process.env,
    ...(getCloudflareEnv() ?? {}),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

function parseEnv() {
  const envSource = getEnvSource();
  const result = envSchema.safeParse(envSource);

  if (!result.success) {
    const message = [
      "Invalid environment variables:",
      ...result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`),
    ].join("\n");
    throw new Error(message);
  }

  return result.data;
}

let _serverEnv: ServerEnv | undefined;

export const env = new Proxy<ServerEnv>({} as ServerEnv, {
  get(_target, key: string) {
    if (!_serverEnv) {
      _serverEnv = parseEnv() as ServerEnv;
    }
    return _serverEnv[key as keyof ServerEnv];
  },
});
