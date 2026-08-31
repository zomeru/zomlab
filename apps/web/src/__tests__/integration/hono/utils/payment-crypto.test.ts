import { describe, expect, test } from "vitest";
import {
  constantTimeEqualHex,
  createDemoSignature,
  hmacSha256Hex,
  validateDemoSignature,
  verifyPaymongoSignature,
} from "~/integration/hono/utils/payment-crypto";

describe("payment signatures", () => {
  const now = new Date("2026-08-30T00:00:00.000Z");

  test("validates PayMongo test signatures over timestamp dot raw body", () => {
    const payload = '{"data":{"id":"evt_test"}}';
    const timestamp = Math.floor(now.getTime() / 1_000).toString();
    const signature = hmacSha256Hex(`${timestamp}.${payload}`, "whsk_test");

    expect(
      verifyPaymongoSignature(payload, `t=${timestamp},te=${signature},li=`, "whsk_test", now),
    ).toBe(true);
    expect(
      verifyPaymongoSignature(
        `${payload} `,
        `t=${timestamp},te=${signature},li=`,
        "whsk_test",
        now,
      ),
    ).toBe(false);
  });

  test("rejects PayMongo webhook replays outside the timestamp tolerance", () => {
    const payload = "{}";
    const timestamp = Math.floor(now.getTime() / 1_000 - 301).toString();
    const signature = hmacSha256Hex(`${timestamp}.${payload}`, "whsk_test");
    expect(
      verifyPaymongoSignature(payload, `t=${timestamp},te=${signature}`, "whsk_test", now),
    ).toBe(false);
  });

  test("invalidates the educational signature after the raw payload changes", () => {
    const signature = createDemoSignature("stripe", '{"type":"payment.succeeded"}', now);
    expect(validateDemoSignature("stripe", '{"type":"payment.succeeded"}', signature).valid).toBe(
      true,
    );
    expect(validateDemoSignature("stripe", '{"type":"payment.failed"}', signature).valid).toBe(
      false,
    );
  });

  test("constant-time helper rejects malformed or different-length digests", () => {
    expect(constantTimeEqualHex("aa", "aa")).toBe(true);
    expect(constantTimeEqualHex("aa", "ab")).toBe(false);
    expect(constantTimeEqualHex("aa", "aaaa")).toBe(false);
    expect(constantTimeEqualHex("not-hex", "not-hex")).toBe(false);
  });
});
