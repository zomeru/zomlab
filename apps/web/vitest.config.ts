import { resolve } from "node:path";
import base from "@zomlab/vitest-config";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  ...base,
  resolve: {
    alias: {
      "~": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    ...base.test,
    exclude: [...configDefaults.exclude, "**/*.worker.test.ts"],
  },
});
