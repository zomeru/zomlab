import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  magicLink: vi.fn((options) => ({ name: "magic-link", options })),
  tanstackStartCookies: vi.fn(() => ({ name: "tanstack-start-cookies" })),
}));

vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("@zomlab/database", () => ({
  db: {},
  schema: {
    accounts: {},
    rateLimits: {},
    sessions: {},
    users: {},
    verification: {},
  },
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn(),
}));

vi.mock("better-auth/plugins", () => ({
  magicLink: mocks.magicLink,
}));

vi.mock("better-auth/tanstack-start", () => ({
  tanstackStartCookies: mocks.tanstackStartCookies,
}));

import { createAuthOptions } from "./auth.server";
import { isDeployedEnvironment } from "./auth-environment";

const baseEnv = {
  APP_ENV: "development",
  BETTER_AUTH_ALLOWED_HOSTS: "app.example.com",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "https://zomlab.example.com",
  DATABASE_URL: "https://database.example.com",
  E2E_PORT: 3100,
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
} as const;

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

describe("createAuthOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("keeps test authentication behavior non-deployed", () => {
    const options = createAuthOptions({ ...baseEnv, APP_ENV: "test" });

    expect(options.baseURL).toMatchObject({
      allowedHosts: expect.arrayContaining(["localhost:3000", "127.0.0.1:3100"]),
      protocol: "auto",
    });
    expect(options.advanced).toMatchObject({ useSecureCookies: false });
    expect(options.rateLimit).toMatchObject({ enabled: false });
    expect(mocks.magicLink).toHaveBeenCalledOnce();
  });

  test("hardens deployed authentication behavior", () => {
    const options = createAuthOptions({ ...baseEnv, APP_ENV: "staging" });

    expect(options.baseURL).toMatchObject({
      allowedHosts: expect.not.arrayContaining(["localhost:3000"]),
      protocol: "https",
    });
    expect(options.advanced).toMatchObject({ useSecureCookies: true });
    expect(options.rateLimit).toMatchObject({ enabled: true });
    expect(mocks.magicLink).not.toHaveBeenCalled();
  });

  test("keeps a local staging Worker compatible with HTTP development", () => {
    const options = createAuthOptions({
      ...baseEnv,
      APP_ENV: "staging",
      BETTER_AUTH_URL: "http://localhost:3100",
    });

    expect(options.baseURL).toMatchObject({
      allowedHosts: expect.arrayContaining(["localhost:3100", "127.0.0.1:3100"]),
      protocol: "auto",
    });
    expect(options.advanced).toMatchObject({ useSecureCookies: false });
    expect(options.rateLimit).toMatchObject({ enabled: false });
    expect(mocks.magicLink).toHaveBeenCalledOnce();
  });
});
