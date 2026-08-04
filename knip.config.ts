import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: ["scripts/package-manager-policy.test.ts", "scripts/vitest.config.ts"],
      ignoreDependencies: ["tsdown"],
      ignoreFiles: [".agents/**"],
    },
    "apps/api": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
    "apps/web": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx,css}", "content/**/*.mdx"],
      next: true,
      tailwind: true,
    },
    "packages/auth": {
      entry: ["src/auth.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["zod"],
    },
    "packages/database": {
      entry: ["src/client.ts"],
      project: ["src/**/*.ts", "prisma/**/*.prisma"],
      ignoreDependencies: ["@prisma/client", "pg"],
    },
    "packages/env": {
      project: ["src/**/*.ts"],
    },
    "packages/ui": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx,mdx}"],
    },
    "packages/vitest-config": {
      project: ["src/**/*.ts"],
    },
  },
};

export default config;
