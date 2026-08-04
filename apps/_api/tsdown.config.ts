import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    // The standalone artifact cannot resolve pnpm's package-local transitive dependencies.
    alwaysBundle: () => true,
    onlyBundle: false,
  },
  entry: ["src/index.ts"],
  format: "cjs",
  platform: "node",
  sourcemap: true,
  target: "node24",
});
