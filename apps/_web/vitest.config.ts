import base from "@zomlab/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(
  mergeConfig(base, {
    test: {
      environment: "jsdom",
    },
  }),
);
