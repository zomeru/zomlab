import { describe, expect, test } from "vitest";

import { resolveEnvSource } from "./index";

describe("resolveEnvSource", () => {
  test("prefers Cloudflare Worker APP_ENV over the local process environment", () => {
    expect(resolveEnvSource({ APP_ENV: "staging" }, { APP_ENV: "production" }).APP_ENV).toBe(
      "staging",
    );
  });

  test("defaults APP_ENV to staging when no runtime provides it", () => {
    expect(resolveEnvSource(undefined, {}).APP_ENV).toBe("staging");
  });
});
