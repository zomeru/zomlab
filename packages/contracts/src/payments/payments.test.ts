import { describe, expect, test } from "vitest";
import { createCheckoutBodySchema, PAYMENT_MAX_AMOUNT, PAYMENT_MIN_AMOUNT } from "./payments";

describe("payment amount validation", () => {
  test("accepts integer PHP minor-unit amounts inside the supported range", () => {
    expect(
      createCheckoutBodySchema.parse({
        amount: PAYMENT_MIN_AMOUNT,
        currency: "PHP",
        description: "Test checkout",
        idempotencyKey: "payment-key-1",
      }).amount,
    ).toBe(PAYMENT_MIN_AMOUNT);
  });

  test.each([0, PAYMENT_MIN_AMOUNT - 1, PAYMENT_MAX_AMOUNT + 1, 100.5])(
    "rejects unsafe amount %s",
    (amount) => {
      expect(
        createCheckoutBodySchema.safeParse({
          amount,
          currency: "PHP",
          description: "Test checkout",
          idempotencyKey: "payment-key-1",
        }).success,
      ).toBe(false);
    },
  );
});
