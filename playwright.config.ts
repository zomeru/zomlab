import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;
const E2E_PORT = Number(isCI ? 3000 : (process.env.E2E_PORT ?? 3100));
const baseURL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
  },
  webServer: {
    command: "pnpm run with-env -- pnpm exec turbo run dev --filter=@zomlab/web --ui=stream",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      E2E_PORT: String(E2E_PORT),
    },
  },
});
