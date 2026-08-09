import { describe, expect, test } from "vitest";

import { isDeployedEnvironment } from "./auth-environment";

describe("isDeployedEnvironment", () => {
  test.each(["staging", "production"] as const)("hardens the %s deployment", (appEnv) => {
    expect(isDeployedEnvironment(appEnv)).toBe(true);
  });

  test.each(["development", "test"] as const)(
    "retains non-production behavior for %s",
    (appEnv) => {
      expect(isDeployedEnvironment(appEnv)).toBe(false);
    },
  );
});
