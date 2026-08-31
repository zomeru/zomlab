import {
  ApiError,
  InvalidWebhookSignatureError,
  PaymentConfigurationError,
  PaymentProviderError,
} from "~/integration/hono/errors/api-error";
import { sha256Hex, verifyPaymongoSignature } from "~/integration/hono/utils/payment-crypto";
import { handleProviderError } from "./provider-errors";
import {
  asArray,
  asBoolean,
  asObject,
  asString,
  type JsonObject,
  readObjectAt,
  readStringAt,
} from "./provider-json";
import type {
  PaymongoPaymentConfig,
  ProviderCheckoutInput,
  ProviderCheckoutResult,
  ProviderStatusResult,
  VerifiedProviderWebhook,
} from "./types";

const PAYMONGO_API = "https://api.paymongo.com";

function assertPaymongoConfig(secretKey: string): void {
  if (!secretKey.startsWith("sk_test_")) throw new PaymentConfigurationError("PayMongo");
}

async function paymongoRequest(
  secretKey: string,
  path: string,
  init?: RequestInit,
): Promise<JsonObject> {
  assertPaymongoConfig(secretKey);
  const response = await fetch(`${PAYMONGO_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw Object.assign(new Error("PayMongo request failed"), { statusCode: response.status });
  }
  const body: unknown = await response.json();
  const object = asObject(body);
  if (!object) throw new PaymentProviderError("PayMongo returned an unexpected response");
  return object;
}

function mapPaymongoStatus(status: string | undefined): ProviderStatusResult["status"] {
  if (status === "paid" || status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "expired" || status === "cancelled" || status === "canceled") return "canceled";
  if (status === "awaiting_next_action") return "requires_action";
  return "pending";
}

function parseCheckoutStatus(payload: JsonObject): ProviderStatusResult {
  const attributes = readObjectAt(payload, "data", "attributes");
  if (!attributes) throw new PaymentProviderError("PayMongo returned an unexpected response");
  if (asBoolean(attributes.livemode)) {
    throw new PaymentProviderError("Live PayMongo sessions are not supported");
  }
  const paymentIntent = asObject(attributes.payment_intent);
  const payments = asArray(attributes.payments);
  const firstPayment = asObject(payments[0]);
  const firstPaymentAttributes = asObject(firstPayment?.attributes);
  const providerStatus =
    asString(firstPaymentAttributes?.status) ??
    asString(paymentIntent?.status) ??
    asString(attributes.status) ??
    "open";
  return {
    paymentId:
      asString(firstPayment?.id) ??
      asString(paymentIntent?.id) ??
      asString(attributes.payment_intent_id),
    providerStatus,
    status: mapPaymongoStatus(providerStatus),
  };
}

function firstDefined(...values: (string | undefined)[]): string | undefined {
  return values.find((value) => value !== undefined);
}

function parsePaymongoWebhook(payload: JsonObject) {
  const traditionalAttributes = readObjectAt(payload, "data", "attributes");
  const traditionalResource = asObject(traditionalAttributes?.data);
  const modernEnvelope = readObjectAt(payload, "data");
  const modernResource = asObject(modernEnvelope?.data);
  const resource = traditionalResource ?? modernResource;
  const resourceAttributes = asObject(resource?.attributes);
  const paymentIntent = asObject(resourceAttributes?.payment_intent);
  const payments = asArray(resourceAttributes?.payments);
  const firstPayment = asObject(payments[0]);
  const firstPaymentAttributes = asObject(firstPayment?.attributes);

  const eventType =
    asString(traditionalAttributes?.type) ?? asString(modernEnvelope?.type) ?? "unknown";
  const providerStatus =
    asString(firstPaymentAttributes?.status) ??
    asString(resourceAttributes?.status) ??
    (eventType.includes("paid") || eventType.includes("succeeded")
      ? "paid"
      : eventType.includes("failed")
        ? "failed"
        : undefined);

  return {
    eventId: readStringAt(payload, "data", "id"),
    eventType,
    paymentId: firstDefined(
      asString(firstPayment?.id),
      asString(paymentIntent?.id),
      resource?.type === "payment" ? asString(resource.id) : undefined,
    ),
    providerReferenceId:
      resource?.type === "checkout_session" || eventType.startsWith("checkout_session.")
        ? asString(resource?.id)
        : undefined,
    providerStatus,
    status: providerStatus ? mapPaymongoStatus(providerStatus) : undefined,
    transactionId: firstDefined(
      readStringAt(resourceAttributes, "metadata", "transactionId"),
      readStringAt(paymentIntent, "attributes", "metadata", "transactionId"),
      readStringAt(firstPaymentAttributes, "metadata", "transactionId"),
    ),
  };
}

export function createPaymongoProvider(config: PaymongoPaymentConfig) {
  return {
    async createCheckout(input: ProviderCheckoutInput): Promise<ProviderCheckoutResult> {
      try {
        const payload = await paymongoRequest(config.secretKey, "/v2/checkout_sessions", {
          method: "POST",
          headers: { "Idempotency-Key": input.idempotencyKey },
          body: JSON.stringify({
            data: {
              attributes: {
                cancel_url: `${input.origin}/payments/paymongo?state=canceled`,
                description: input.description,
                line_items: [
                  {
                    amount: input.amount,
                    currency: input.currency,
                    name: input.description,
                    quantity: 1,
                  },
                ],
                metadata: { transactionId: input.transactionId },
                payment_method_types: ["card"],
                reference_number: input.transactionId,
                show_description: true,
                show_line_items: true,
                success_url: `${input.origin}/payments/paymongo?state=returned&transaction_id=${input.transactionId}`,
              },
            },
          }),
        });
        const data = readObjectAt(payload, "data");
        const attributes = asObject(data?.attributes);
        const checkoutUrl =
          asString(attributes?.checkout_url) ??
          asString(attributes?.url) ??
          readStringAt(attributes, "next_action", "redirect_url");
        const providerReferenceId = asString(data?.id);
        if (!checkoutUrl || !providerReferenceId) {
          throw new PaymentProviderError("PayMongo did not return a checkout URL");
        }
        if (asBoolean(attributes?.livemode)) {
          throw new PaymentProviderError("Live PayMongo sessions are not supported");
        }
        return {
          checkoutUrl,
          paymentId: asString(attributes?.payment_intent_id),
          providerReferenceId,
          providerStatus: asString(attributes?.status) ?? "open",
          status: "pending",
        };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("PayMongo", "create the checkout session", error);
      }
    },

    async getStatus(referenceId: string): Promise<ProviderStatusResult> {
      try {
        return parseCheckoutStatus(
          await paymongoRequest(
            config.secretKey,
            `/v1/checkout_sessions/${encodeURIComponent(referenceId)}`,
          ),
        );
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("PayMongo", "verify the payment status", error);
      }
    },

    async verifyWebhook(rawBody: string, signature: string): Promise<VerifiedProviderWebhook> {
      assertPaymongoConfig(config.secretKey);
      if (!config.webhookSecret.startsWith("whsk_")) {
        throw new PaymentConfigurationError("PayMongo webhook");
      }
      if (!verifyPaymongoSignature(rawBody, signature, config.webhookSecret)) {
        throw new InvalidWebhookSignatureError();
      }

      let rawPayload: unknown;
      try {
        rawPayload = JSON.parse(rawBody);
      } catch {
        throw new InvalidWebhookSignatureError();
      }
      const payload = asObject(rawPayload);
      if (!payload) throw new InvalidWebhookSignatureError();
      const parsed = parsePaymongoWebhook(payload);
      const timestamp = signature
        .split(",")
        .find((part) => part.startsWith("t="))
        ?.slice(2);

      return {
        ...parsed,
        eventId: parsed.eventId ?? `body_${(await sha256Hex(rawBody)).slice(0, 48)}`,
        provider: "paymongo",
        rawPayload,
        signatureHeaders: {
          names: ["paymongo-signature"],
          ...(timestamp ? { timestamp } : {}),
          algorithm: "HMAC-SHA256",
        },
      };
    },
  };
}
