import { beforeEach, describe, expect, test, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock("stripe", () => {
  class StripeMock {
    static createFetchHttpClient() {
      return {};
    }

    checkout = {
      sessions: {
        create: stripeMocks.createCheckoutSession,
      },
    };
  }

  return { default: StripeMock };
});

import { createStripeProvider } from "~/integration/hono/providers/payments/stripe.provider";

describe("Stripe payment provider", () => {
  beforeEach(() => {
    stripeMocks.createCheckoutSession.mockReset();
  });

  test("disables Managed Payments for the provider-neutral sandbox product", async () => {
    stripeMocks.createCheckoutSession.mockResolvedValue({
      id: "cs_test_checkout",
      livemode: false,
      payment_intent: null,
      payment_status: "unpaid",
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_test_checkout",
    });

    await createStripeProvider({ secretKey: "sk_test_example", webhookSecret: "" }).createCheckout({
      amount: 50_000,
      currency: "PHP",
      description: "ZomLab Stripe sandbox payment",
      idempotencyKey: "provider-idempotency-key",
      origin: "http://localhost:3000",
      transactionId: "667a4f68-2f1d-41af-9d68-caeec25fbed6",
    });

    expect(stripeMocks.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ managed_payments: { enabled: false } }),
      { idempotencyKey: "provider-idempotency-key" },
    );
  });
});
