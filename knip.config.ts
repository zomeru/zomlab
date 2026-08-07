import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreFiles: [".agents/**", ".opencode/**"],
      ignoreExportsUsedInFile: true,
    },
    scripts: {
      project: ["**/*.ts"],
    },

    "apps/_web": {
      entry: ["src/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx,css}", "content/**/*.mdx"],
      next: true,
      tailwind: true,
      ignoreExportsUsedInFile: true,
    },
    "apps/api": {
      entry: ["src/**/*.ts"],
      project: ["src/**/*.ts"],
    },
    "apps/web": {
      entry: ["src/routes/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}", "src/styles/**/*.css"],
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
