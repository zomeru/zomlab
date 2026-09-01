import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: fileURLToPath(
        new URL("./src/__tests__/realtime/realtime-test-worker.ts", import.meta.url),
      ),
      wrangler: {
        configPath: "./wrangler.jsonc",
        environment: "staging",
      },
    }),
  ],
  resolve: {
    alias: {
      "~": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    dir: "src/__tests__",
    include: ["**/*.worker.test.ts"],
  },
});
