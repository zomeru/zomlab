import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreDependencies: ["tsdown", "bun-types"],
      ignoreFiles: [".agents/**"],
    },
    "apps/api": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
    "apps/web": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}"],
      next: true,
      tailwind: true,
      ignoreDependencies: ["tailwindcss"],
    },
    "packages/auth": {
      entry: ["src/auth.ts", "src/client.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["zod"],
    },
    "packages/database": {
      entry: ["src/client.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["@prisma/client", "pg"],
    },
    "packages/env": {
      project: ["src/**/*.ts"],
    },
    "packages/ui": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}"],
      ignoreDependencies: ["react-dom", "@types/react-dom"],
    },
    "packages/tsconfig": {
      project: ["**/*.json"],
    },
    "packages/vitest-config": {
      project: ["src/**/*.ts"],
    },
  },
};

export default config;
