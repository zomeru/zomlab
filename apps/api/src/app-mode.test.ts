import { describe, expect, it, vi } from "vitest";

vi.mock("@zomlab/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@zomlab/database", () => ({
  db: { note: {} },
}));

vi.mock("@zomlab/env", () => ({
  env: {
    BETTER_AUTH_URL: "http://local",
    NEXT_PUBLIC_SITE_URL: "http://local",
  },
}));

import { app, elysiaApp } from "./app";

describe("API application modes", () => {
  it("serves system routes without the API prefix in standalone mode", async () => {
    expect((await app.handle(new Request("http://local/health"))).status).toBe(200);
    expect((await app.handle(new Request("http://local/api/health"))).status).toBe(404);
  });

  it("serves system routes with the API prefix in embedded mode", async () => {
    expect((await elysiaApp.handle(new Request("http://local/api/health"))).status).toBe(200);
    expect((await elysiaApp.handle(new Request("http://local/health"))).status).toBe(404);
  });
});
