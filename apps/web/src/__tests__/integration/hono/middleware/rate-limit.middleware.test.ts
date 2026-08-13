import { describe, expect, test } from "vitest";

import { getRateLimitKey } from "~/integration/hono/middleware/rate-limit.middleware";

describe("getRateLimitKey", () => {
  test("prefers Cloudflare's client IP over forwarded proxy values", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.4, 198.51.100.5",
    });

    expect(getRateLimitKey(headers)).toBe("203.0.113.10");
  });

  test("uses the first forwarded IP outside Cloudflare", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.4, 198.51.100.5",
    });

    expect(getRateLimitKey(headers)).toBe("198.51.100.4");
  });

  test("returns undefined for direct local requests", () => {
    expect(getRateLimitKey(new Headers())).toBeUndefined();
    expect(getRateLimitKey(new Headers({ "cf-connecting-ip": "127.0.0.1" }))).toBeUndefined();
    expect(getRateLimitKey(new Headers({ "cf-connecting-ip": "127.4.5.6" }))).toBeUndefined();
    expect(getRateLimitKey(new Headers({ "x-forwarded-for": "::1" }))).toBeUndefined();
  });
});
