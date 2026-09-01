import { afterEach, describe, expect, test, vi } from "vitest";
import { PaymentConfigurationError } from "~/integration/hono/errors/api-error";
import { createPaypalProvider } from "~/integration/hono/providers/payments/paypal.provider";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PayPal payment provider", () => {
  test("uses only the sandbox API for configured lab credentials", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: "sandbox-token" }))
      .mockResolvedValueOnce(
        Response.json({
          id: "order-1",
          links: [
            { href: "https://www.sandbox.paypal.com/checkoutnow?token=order-1", rel: "approve" },
          ],
          status: "CREATED",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await createPaypalProvider({
      clientId: "sandbox-client",
      clientSecret: "sandbox-secret",
      webhookId: "sandbox-webhook",
    }).createOrder({
      amount: 10_000,
      currency: "PHP",
      description: "PayPal sandbox test",
      idempotencyKey: "provider-key",
      origin: "https://example.com",
      transactionId: "10000000-0000-4000-8000-000000000000",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("rejects missing sandbox credentials before making a request", async () => {
    await expect(
      createPaypalProvider({ clientId: "", clientSecret: "", webhookId: "" }).getStatus("order-1"),
    ).rejects.toBeInstanceOf(PaymentConfigurationError);
  });
});
