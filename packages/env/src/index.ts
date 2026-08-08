import { z } from "zod";

const serverEnvSchema = z.object({
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

const clientEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VITE_SITE_URL: z.string().min(1).optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;

const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;

function getCloudflareEnv(): Record<string, unknown> | undefined {
  try {
    const { env } = require("cloudflare:workers") as { env: Record<string, unknown> };
    return env;
  } catch {
    return undefined;
  }
}

function getEnvSource(): Record<string, unknown> {
  if (isBrowser) {
    const importMeta = import.meta as unknown as { env: Record<string, unknown> };
    return { ...importMeta.env };
  }

  return {
    ...process.env,
    ...(getCloudflareEnv() ?? {}),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

function parseEnv() {
  const envSource = getEnvSource();
  const schema = isBrowser ? clientEnvSchema : serverEnvSchema;
  const result = schema.safeParse(envSource);

  if (!result.success) {
    if (isBrowser) {
      return envSource as ClientEnv;
    }
    const message = [
      "Invalid environment variables:",
      ...result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`),
    ].join("\n");
    throw new Error(message);
  }

  return result.data;
}

let _serverEnv: ServerEnv | undefined;
let _clientEnv: ClientEnv | undefined;

export const env = new Proxy<ServerEnv>({} as ServerEnv, {
  get(_target, key: string) {
    if (!_serverEnv) {
      _serverEnv = parseEnv() as ServerEnv;
    }
    return _serverEnv[key as keyof ServerEnv];
  },
});

export const clientEnv = new Proxy<ClientEnv>({} as ClientEnv, {
  get(_target, key: string) {
    if (!_clientEnv) {
      _clientEnv = parseEnv() as ClientEnv;
    }
    return _clientEnv[key as keyof ClientEnv];
  },
});
