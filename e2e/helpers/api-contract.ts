import { type APIRequestContext, expect } from "@playwright/test";

export async function expectSystemContract(request: APIRequestContext) {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({
    status: "ok",
    timestamp: expect.any(String),
    uptime: expect.any(Number),
  });

  const ready = await request.get("/api/ready");
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toEqual({ ready: true });

  const version = await request.get("/api/version");
  expect(version.status()).toBe(200);
  expect(await version.json()).toEqual({ name: "zomlab-api", version: "0.1.0" });

  const missing = await request.get("/api/does-not-exist");
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
}
