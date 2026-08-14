import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      // The pool treats Wrangler's bare package entry as a project-relative file while
      // analyzing exports. Resolve it first; Wrangler still supplies bindings and flags.
      main: fileURLToPath(import.meta.resolve("@tanstack/react-start/server-entry")),
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
