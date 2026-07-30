import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(8000),
  NEXT_PUBLIC_SITE_URL: z.url(),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
});

type Env = z.infer<typeof envSchema>;

function createEnv(): Env {
  const result = envSchema.safeParse(process.env);

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
