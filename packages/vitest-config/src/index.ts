import type { UserWorkspaceConfig } from "vitest/config";

const config: UserWorkspaceConfig = {
  test: {
    pool: "threads",
    testTimeout: 30_000,
    hookTimeout: 15_000,
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
};

export default config;
