import { describe, expect, it, vi } from "vitest";

interface AuthConfig {
  basePath: string;
  baseURL: string;
  secret: string;
  database: {
    adapter: unknown;
    provider: string;
  };
  account: {
    encryptOAuthTokens: boolean;
  };
  emailAndPassword: {
    minPasswordLength: number;
    maxPasswordLength: number;
    password: {
      hash: (password: string) => Promise<string>;
      verify: (input: { password: string; hash: string }) => Promise<boolean>;
    };
  };
  socialProviders: {
    github?: {
      clientId: string;
      clientSecret: string;
    };
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
  plugins: Array<{ type: string; sendMagicLink?: unknown }>;
}

interface MockAuth {
  config: AuthConfig;
  basePath: string;
  baseURL: string;
  secret: string;
  database: unknown;
  account: unknown;
  emailAndPassword: unknown;
  socialProviders: unknown;
  plugins: unknown;
}

vi.mock("better-auth", () => ({
  betterAuth: vi.fn().mockImplementation(
    (config: AuthConfig): MockAuth => ({
      config,
      basePath: config.basePath,
      baseURL: config.baseURL,
      secret: config.secret,
      database: config.database,
      account: config.account,
      emailAndPassword: config.emailAndPassword,
      socialProviders: config.socialProviders,
      plugins: config.plugins,
    }),
  ),
}));

vi.mock("better-auth/plugins", () => ({
  magicLink: vi.fn().mockImplementation((opts) => ({ type: "magicLink", ...opts })),
}));

vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: vi
    .fn()
    .mockImplementation((db, opts) => ({ adapter: db, provider: opts.provider })),
}));

vi.mock("@zomlab/database", () => ({
  createDatabase: vi.fn(),
  schema: {},
}));

vi.mock("@zomlab/env", () => ({
  env: {
    BETTER_AUTH_URL: "https://auth.example.com",
    BETTER_AUTH_SECRET: "a".repeat(32),
    NEXT_PUBLIC_SITE_URL: "https://example.com",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
  },
}));

import type { Database } from "@zomlab/database";
import { createAuth } from "./auth";
import type { PasswordProvider } from "./password/types";

const mockDatabase = {} as Database;
const mockPasswordProvider: PasswordProvider = {
  hash: vi.fn(),
  verify: vi.fn(),
};
const mockSendMagicLink = vi.fn();

// The mock returns MockAuth; cast createAuth result to access config in tests.
const createTestAuth = (options: {
  database: Database;
  env: {
    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
    SITE_URL: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  };
  password: PasswordProvider;
  sendMagicLink: (options: { email: string; url: string }) => Promise<void>;
}): MockAuth => createAuth(options) as unknown as MockAuth;

describe("createAuth factory", () => {
  const baseEnv = {
    BETTER_AUTH_URL: "https://auth.example.com",
    BETTER_AUTH_SECRET: "a".repeat(32),
    SITE_URL: "https://example.com",
    GITHUB_CLIENT_ID: "github-id",
    GITHUB_CLIENT_SECRET: "github-secret",
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
  };

  it("supplies /api/auth base path", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.basePath).toBe("/api/auth");
  });

  it("uses injected base URL and secret", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.baseURL).toBe("https://auth.example.com");
    expect(auth.config.secret).toBe(baseEnv.BETTER_AUTH_SECRET);
  });

  it("uses Drizzle PostgreSQL adapter", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.database).toBeDefined();
    expect(auth.config.database.adapter).toBe(mockDatabase);
    expect(auth.config.database.provider).toBe("pg");
  });

  it("uses existing password min/max and provider methods", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.emailAndPassword.minPasswordLength).toBe(8);
    expect(auth.config.emailAndPassword.maxPasswordLength).toBe(128);
    expect(auth.config.emailAndPassword.password.hash).toBe(mockPasswordProvider.hash);
    expect(auth.config.emailAndPassword.password.verify).toBe(mockPasswordProvider.verify);
  });

  it("enables OAuth token encryption", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.account.encryptOAuthTokens).toBe(true);
  });

  it("includes GitHub provider when both ID and secret are present", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.socialProviders.github).toBeDefined();
    expect(auth.config.socialProviders.github?.clientId).toBe("github-id");
    expect(auth.config.socialProviders.github?.clientSecret).toBe("github-secret");
  });

  it("includes Google provider when both ID and secret are present", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.socialProviders.google).toBeDefined();
    expect(auth.config.socialProviders.google?.clientId).toBe("google-id");
    expect(auth.config.socialProviders.google?.clientSecret).toBe("google-secret");
  });

  it("omits GitHub provider when ID or secret is missing", () => {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ...envWithoutGithub } = baseEnv;
    const auth = createTestAuth({
      database: mockDatabase,
      env: envWithoutGithub,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.socialProviders.github).toBeUndefined();
  });

  it("omits Google provider when ID or secret is missing", () => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ...envWithoutGoogle } = baseEnv;
    const auth = createTestAuth({
      database: mockDatabase,
      env: envWithoutGoogle,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.socialProviders.google).toBeUndefined();
  });

  it("includes magic link plugin with injected sender", () => {
    const auth = createTestAuth({
      database: mockDatabase,
      env: baseEnv,
      password: mockPasswordProvider,
      sendMagicLink: mockSendMagicLink,
    });
    expect(auth.config.plugins).toHaveLength(1);
    expect(auth.config.plugins[0]?.type).toBe("magicLink");
  });
});
