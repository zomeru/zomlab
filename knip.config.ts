import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreExportsUsedInFile: true,
      ignoreDependencies: ["cloudflare"],
    },
    scripts: {
      project: ["**/*.ts"],
    },

    "apps/web": {
      entry: ["src/routes/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}", "src/**/*.mdx", "src/styles/**/*.css"],
      tailwind: true,
    },
    "packages/auth": {
      project: ["src/**/*.ts"],
    },
    "packages/database": {
      project: ["src/**/*.ts"],
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
