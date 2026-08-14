import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";

describe("apiErrorHandler", () => {
  it("serializes validation issues using the public API contract", async () => {
    const app = new Hono().onError(apiErrorHandler).post("/", () => {
      z.object({ title: z.string().min(1) }).parse({ title: "" });
      return new Response(null, { status: 204 });
    });

    const response = await app.request("/", { method: "POST" });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: {
        code: "VALIDATION",
        detail: [{ path: "title", message: expect.any(String) }],
      },
    });
  });

  it("preserves intentional HTTP errors from security middleware", async () => {
    const app = new Hono().onError(apiErrorHandler).delete("/", () => {
      throw new HTTPException(403, { message: "Forbidden" });
    });

    const response = await app.request("/", { method: "DELETE" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
  });

  it("masks unexpected route failures as internal server errors", async () => {
    const app = new Hono().onError(apiErrorHandler).get("/", () => {
      throw new Error("database unavailable");
    });

    const response = await app.request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    });
  });
});
