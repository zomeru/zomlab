import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreFiles: [".agents/**", ".claude/**", ".codex/**", ".graphify-out/**", ".opencode/**"],
    },
    scripts: {
      entry: [
        "verify-worker-probes.ts",
        "verify-auth-worker.ts",
        "worker-probes/index.ts",
        "worker-probes/authorize.ts",
      ],
      project: ["**/*.ts"],
    },
    "apps/_api": {
      project: ["src/**/*.ts"],
    },
    "apps/_web": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx,css}", "content/**/*.mdx"],
      next: true,
      tailwind: true,
    },
    "apps/api": {
      entry: ["src/compatibility/argon2-probe.ts"],
      project: ["src/**/*.ts"],
    },
    "apps/web": {
      entry: ["src/routes/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}"],
    },
    "packages/auth": {
      entry: ["src/auth.ts", "scripts/verify-auth-worker.ts"],
      project: ["src/**/*.ts", "scripts/**/*.ts"],
      ignoreDependencies: ["zod"],
    },
    "packages/database": {
      project: ["src/**/*.ts", "prisma/**/*.prisma"],
      ignoreDependencies: ["@prisma/client"],
    },
    "packages/env": {
      project: ["src/**/*.ts"],
    },
    "packages/contracts": {
      project: ["src/**/*.ts"],
    },
    "packages/ui": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}"],
    },
    "packages/vitest-config": {
      project: ["src/**/*.ts"],
    },
  },
};

export default config;
