import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { RateLimitError } from "../errors";
import { errorPlugin } from "./error";

describe("public error contract", () => {
  it("maps rate limit errors to the stable 429 envelope", async () => {
    const testApp = new Elysia().use(errorPlugin).get("/rate-limited", () => {
      throw new RateLimitError();
    });

    const response = await testApp.handle(new Request("http://local/rate-limited"));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests",
      },
    });
  });

  it("masks unhandled error details in the stable 500 envelope", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const testApp = new Elysia().use(errorPlugin).get("/internal", () => {
      throw new Error("sensitive");
    });

    try {
      const response = await testApp.handle(new Request("http://local/internal"));
      const body = await response.json();
      const serializedBody = JSON.stringify(body);

      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      });
      expect(serializedBody).not.toContain("sensitive");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
