import { afterEach, describe, expect, test, vi } from "vitest";
import { PaymentConfigurationError } from "~/integration/hono/errors/api-error";
import { createPaymongoProvider } from "~/integration/hono/providers/payments/paymongo.provider";
import { hmacSha256Hex } from "~/integration/hono/utils/payment-crypto";

const config = { secretKey: "sk_test_example", webhookSecret: "whsk_example" };

function jsonResponse(body: unknown): Response {
  return Response.json(body);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PayMongo payment provider", () => {
  test("uses the documented v2 create and v1 retrieval endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            id: "cs_checkout",
            attributes: {
              checkout_url: "https://checkout.paymongo.com/cs_checkout",
              livemode: false,
              status: "active",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            attributes: {
              livemode: false,
              payments: [{ id: "pay_1", attributes: { status: "paid" } }],
              status: "active",
            },
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const provider = createPaymongoProvider(config);

    await provider.createCheckout({
      amount: 10_000,
      currency: "PHP",
      description: "PayMongo sandbox test",
      idempotencyKey: "provider-key",
      origin: "https://example.com",
      transactionId: "10000000-0000-4000-8000-000000000000",
    });
    await expect(provider.getStatus("cs_checkout/encoded")).resolves.toMatchObject({
      paymentId: "pay_1",
      status: "succeeded",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.paymongo.com/v2/checkout_sessions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.paymongo.com/v1/checkout_sessions/cs_checkout%2Fencoded",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  test("rejects live credentials for the sandbox-only lab", async () => {
    await expect(
      createPaymongoProvider({ ...config, secretKey: "sk_live_example" }).getStatus("cs_live"),
    ).rejects.toBeInstanceOf(PaymentConfigurationError);
  });

  test("verifies and parses the current checkout-session webhook envelope", async () => {
    const rawBody = JSON.stringify({
      data: {
        type: "checkout_session.payment.paid",
        data: {
          id: "cs_checkout",
          type: "checkout_session",
          attributes: {
            metadata: { transactionId: "10000000-0000-4000-8000-000000000000" },
            payments: [{ id: "pay_1", attributes: { status: "paid" } }],
          },
        },
      },
    });
    const timestamp = Math.floor(Date.now() / 1_000).toString();
    const signature = `t=${timestamp},te=${hmacSha256Hex(`${timestamp}.${rawBody}`, config.webhookSecret)},li=`;

    await expect(
      createPaymongoProvider(config).verifyWebhook(rawBody, signature),
    ).resolves.toMatchObject({
      eventType: "checkout_session.payment.paid",
      paymentId: "pay_1",
      provider: "paymongo",
      providerReferenceId: "cs_checkout",
      status: "succeeded",
      transactionId: "10000000-0000-4000-8000-000000000000",
    });
  });
});
