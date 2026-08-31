import Stripe from "stripe";
import {
  ApiError,
  InvalidWebhookSignatureError,
  PaymentConfigurationError,
  PaymentProviderError,
} from "~/integration/hono/errors/api-error";
import { handleProviderError } from "./provider-errors";
import type {
  ProviderCheckoutInput,
  ProviderCheckoutResult,
  ProviderStatusResult,
  StripePaymentConfig,
  VerifiedProviderWebhook,
} from "./types";

function createStripeClient(secretKey: string): Stripe {
  if (!secretKey.startsWith("sk_test_")) throw new PaymentConfigurationError("Stripe");
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
}

function stripeStatus(session: Stripe.Checkout.Session): ProviderStatusResult {
  const paymentIntent = session.payment_intent;
  const paymentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (session.livemode) throw new PaymentProviderError("Live Stripe sessions are not supported");
  if (session.payment_status === "paid") {
    return { paymentId, providerStatus: session.payment_status, status: "succeeded" };
  }
  if (session.status === "expired") {
    return { paymentId, providerStatus: session.status, status: "canceled" };
  }
  return {
    paymentId,
    providerStatus: session.payment_status || session.status || "open",
    status: "pending",
  };
}

export function createStripeProvider(config: StripePaymentConfig) {
  return {
    async createCheckout(input: ProviderCheckoutInput): Promise<ProviderCheckoutResult> {
      const stripe = createStripeClient(config.secretKey);
      try {
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            managed_payments: { enabled: false },
            line_items: [
              {
                price_data: {
                  currency: input.currency.toLowerCase(),
                  product_data: { name: input.description },
                  unit_amount: input.amount,
                },
                quantity: 1,
              },
            ],
            metadata: { transactionId: input.transactionId },
            payment_intent_data: { metadata: { transactionId: input.transactionId } },
            success_url: `${input.origin}/payments/stripe?state=returned&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${input.origin}/payments/stripe?state=canceled`,
          },
          { idempotencyKey: input.idempotencyKey },
        );
        if (!session.url) throw new PaymentProviderError("Stripe did not return a checkout URL");
        const status = stripeStatus(session);
        return {
          checkoutUrl: session.url,
          paymentId: status.paymentId,
          providerReferenceId: session.id,
          providerStatus: status.providerStatus,
          status: status.status,
        };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("Stripe", "create the checkout session", error);
      }
    },

    async getStatus(referenceId: string): Promise<ProviderStatusResult> {
      const stripe = createStripeClient(config.secretKey);
      try {
        return stripeStatus(await stripe.checkout.sessions.retrieve(referenceId));
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("Stripe", "verify the payment status", error);
      }
    },

    async verifyWebhook(rawBody: string, signature: string): Promise<VerifiedProviderWebhook> {
      if (!config.webhookSecret.startsWith("whsec_")) {
        throw new PaymentConfigurationError("Stripe webhook");
      }
      const stripe = createStripeClient(config.secretKey);
      let event: Stripe.Event;
      try {
        event = await stripe.webhooks.constructEventAsync(
          rawBody,
          signature,
          config.webhookSecret,
          undefined,
          Stripe.createSubtleCryptoProvider(),
        );
      } catch {
        throw new InvalidWebhookSignatureError();
      }
      if (event.livemode) throw new InvalidWebhookSignatureError();

      const headerTimestamp = signature
        .split(",")
        .find((part) => part.startsWith("t="))
        ?.slice(2);
      const object = event.data.object;
      let transactionId: string | undefined;
      let providerReferenceId: string | undefined;
      let paymentId: string | undefined;
      let providerStatus: string | undefined;
      let status: VerifiedProviderWebhook["status"];

      if (event.type === "checkout.session.completed") {
        const session = object as Stripe.Checkout.Session;
        transactionId = session.metadata?.transactionId;
        providerReferenceId = session.id;
        paymentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        providerStatus = session.payment_status;
        status = session.payment_status === "paid" ? "succeeded" : "pending";
      } else if (
        event.type === "payment_intent.succeeded" ||
        event.type === "payment_intent.payment_failed"
      ) {
        const intent = object as Stripe.PaymentIntent;
        transactionId = intent.metadata.transactionId;
        paymentId = intent.id;
        providerStatus = intent.status;
        status = event.type === "payment_intent.succeeded" ? "succeeded" : "failed";
      }

      return {
        eventId: event.id,
        eventType: event.type,
        paymentId,
        provider: "stripe",
        providerReferenceId,
        providerStatus,
        rawPayload: JSON.parse(rawBody),
        signatureHeaders: {
          names: ["stripe-signature"],
          ...(headerTimestamp ? { timestamp: headerTimestamp } : {}),
          algorithm: "HMAC-SHA256",
        },
        status,
        transactionId,
      };
    },
  };
}
