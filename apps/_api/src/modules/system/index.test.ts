import { describe, expect, it } from "vitest";
import { system } from "./index";

describe("system routes", () => {
  it("returns health with uptime", async () => {
    const res = await system.handle(new Request("http://localhost/health"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns version info", async () => {
    const res = await system.handle(new Request("http://localhost/version"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string; version: string };
    expect(body.name).toBe("zomlab-api");
    expect(body.version).toBe("0.1.0");
  });

  it("returns ready", async () => {
    const res = await system.handle(new Request("http://localhost/ready"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ready: true });
  });
});
