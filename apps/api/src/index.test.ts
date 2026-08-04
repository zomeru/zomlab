import { describe, expect, it } from "vitest";
import app from "./index";

describe("target API scaffold", () => {
  it("responds from the Worker entry", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "scaffold" });
  });
});
