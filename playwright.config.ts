import { defineConfig } from "@playwright/test";

const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
  },
  webServer: {
    command: "pnpm run with-env -- pnpm exec turbo run dev --filter=@zomlab/web --ui=stream",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_PORT: String(E2E_PORT),
    },
  },
});
