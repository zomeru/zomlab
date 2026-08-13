import base from "@zomlab/vitest-config";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    exclude: [...configDefaults.exclude, "**/*.worker.test.ts"],
  },
});
