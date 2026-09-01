import { describe, expect, test } from "vitest";
import type { ApiError } from "~/integration/hono/errors/api-error";
import { readLimitedRequestText } from "~/integration/hono/utils/payment-request";

describe("readLimitedRequestText", () => {
  test("preserves the exact raw webhook body", async () => {
    const body = '{\n  "type": "payment.succeeded"\n}\n';
    await expect(
      readLimitedRequestText(
        new Request("https://example.com/webhook", { method: "POST", body }),
        1_000,
      ),
    ).resolves.toBe(body);
  });

  test("rejects webhook bodies over the configured limit", async () => {
    const request = new Request("https://example.com/webhook", {
      method: "POST",
      body: "payload-too-large",
    });
    await expect(readLimitedRequestText(request, 4)).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      status: 413,
    } satisfies Partial<ApiError>);
  });
});
