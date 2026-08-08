// src/config/env.ts
import { z } from "zod";

const requiredServerEnv = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const;
const requiredClientEnv = ["VITE_SITE_URL"] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.url(),
  E2E_PORT: z.coerce.number().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
});

const clientEnvSchema = z.object({
  VITE_SITE_URL: z.url(),
});

// Read `getServerEnv()` per-request from server functions/middleware.
export const getServerEnv = () => {
  const parsed = envSchema.parse(process.env);

  for (const key of requiredServerEnv) {
    if (!parsed[key]) {
      throw new Error(`Missing required server environment variable: ${key}`);
    }
  }

  return parsed;
};

// Validate client environment (build-time, always safe)
export const getClientEnv = () => {
  const parsed = clientEnvSchema.parse(import.meta.env);

  for (const key of requiredClientEnv) {
    if (!parsed[key]) {
      throw new Error(`Missing required server environment variable: ${key}`);
    }
  }

  return parsed;
};
