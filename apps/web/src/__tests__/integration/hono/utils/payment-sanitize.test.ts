import { describe, expect, test } from "vitest";
import { sanitizeWebhookPayload } from "~/integration/hono/utils/payment-sanitize";

describe("sanitizeWebhookPayload", () => {
  test("removes credentials and personal payment fields while preserving event state", () => {
    expect(
      sanitizeWebhookPayload({
        id: "evt_123",
        type: "payment.paid",
        authorization: "Bearer secret",
        data: {
          status: "paid",
          email: "buyer@example.com",
          billing: { address: "private" },
          customer_email: "buyer@example.com",
          shipping_details: { name: "Private Buyer" },
        },
      }),
    ).toEqual({
      id: "evt_123",
      type: "payment.paid",
      authorization: "[redacted]",
      data: {
        status: "paid",
        email: "[redacted]",
        billing: "[redacted]",
        customer_email: "[redacted]",
        shipping_details: "[redacted]",
      },
    });
  });
});
