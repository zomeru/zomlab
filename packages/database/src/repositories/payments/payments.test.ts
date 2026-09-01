import { describe, expect, test } from "vitest";
import { getCompletedExpiry, getProcessingExpiry } from "./payments";

describe("payment idempotency expiry windows", () => {
  const now = new Date("2026-08-30T00:00:00.000Z");

  test("keeps an active processing claim short enough to recover from an interrupted worker", () => {
    expect(getProcessingExpiry(now).toISOString()).toBe("2026-08-30T00:02:00.000Z");
  });

  test("keeps a completed response available for a full day", () => {
    expect(getCompletedExpiry(now).toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });
});
