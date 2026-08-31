import { z } from "zod";

const sandboxKey = (prefix: string) =>
  z
    .string()
    .default("")
    .refine((value) => value === "" || value.startsWith(prefix), {
      message: `must be empty or start with ${prefix}`,
    });

const envSchema = z.object({
  APP_ENV: z.enum(["staging", "production"]).default("staging"),
  DATABASE_URL: z.url(),
  E2E_PORT: z.coerce.number().default(3100),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_ALLOWED_HOSTS: z.string().default(""),
  BETTER_AUTH_GITHUB_CLIENT_ID: z.string().default(""),
  BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().default(""),
  BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().default(""),
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().default(""),
  STRIPE_SECRET_KEY: sandboxKey("sk_test_"),
  STRIPE_PUBLISHABLE_KEY: sandboxKey("pk_test_"),
  STRIPE_WEBHOOK_SECRET: sandboxKey("whsec_"),
  PAYMONGO_PUBLIC_KEY: sandboxKey("pk_test_"),
  PAYMONGO_SECRET_KEY: sandboxKey("sk_test_"),
  PAYMONGO_WEBHOOK_SECRET: sandboxKey("whsk_"),
  PAYPAL_CLIENT_ID: z.string().default(""),
  PAYPAL_CLIENT_SECRET: z.string().default(""),
  PAYPAL_WEBHOOK_ID: z.string().default(""),
  PAYPAL_ENVIRONMENT: z.literal("sandbox").default("sandbox"),
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

export function resolveEnvSource(
  cloudflareEnv: Record<string, unknown> | undefined,
  processEnv: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...processEnv,
    ...cloudflareEnv,
    APP_ENV: cloudflareEnv?.APP_ENV ?? processEnv.APP_ENV ?? "staging",
  };
}

function parseEnv() {
  const envSource = resolveEnvSource(getCloudflareEnv(), process.env);
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
