import {
  ApiError,
  InvalidWebhookSignatureError,
  PaymentConfigurationError,
  PaymentProviderError,
} from "~/integration/hono/errors/api-error";
import { handleProviderError } from "./provider-errors";
import {
  asArray,
  asObject,
  asString,
  type JsonObject,
  readObjectAt,
  readStringAt,
} from "./provider-json";
import type {
  PaypalPaymentConfig,
  ProviderCheckoutInput,
  ProviderCheckoutResult,
  ProviderStatusResult,
  VerifiedProviderWebhook,
} from "./types";

const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";
const PAYPAL_WEBHOOK_TOLERANCE_MS = 5 * 60 * 1_000;

function assertPaypalConfig(config: PaypalPaymentConfig, webhook = false): void {
  if (
    config.environment !== "sandbox" ||
    config.clientId.length === 0 ||
    config.clientSecret.length === 0 ||
    (webhook && config.webhookId.length === 0)
  ) {
    throw new PaymentConfigurationError(webhook ? "PayPal webhook" : "PayPal");
  }
}

function formatMinorUnits(amount: number): string {
  const whole = Math.trunc(amount / 100);
  const fraction = amount % 100;
  return `${whole}.${fraction.toString().padStart(2, "0")}`;
}

async function getPaypalAccessToken(config: PaypalPaymentConfig): Promise<string> {
  assertPaypalConfig(config);
  const response = await fetch(`${PAYPAL_SANDBOX_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw Object.assign(new Error("PayPal authentication failed"), { statusCode: response.status });
  }
  const payload: unknown = await response.json();
  const token = readStringAt(payload, "access_token");
  if (!token) throw new PaymentProviderError("PayPal returned an unexpected response");
  return token;
}

async function paypalRequest(
  config: PaypalPaymentConfig,
  path: string,
  init?: RequestInit,
): Promise<JsonObject> {
  const token = await getPaypalAccessToken(config);
  const response = await fetch(`${PAYPAL_SANDBOX_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw Object.assign(new Error("PayPal request failed"), { statusCode: response.status });
  }
  const body: unknown = await response.json();
  const object = asObject(body);
  if (!object) throw new PaymentProviderError("PayPal returned an unexpected response");
  return object;
}

function findPaypalCapture(payload: JsonObject): JsonObject | undefined {
  const purchaseUnits = asArray(payload.purchase_units);
  for (const purchaseUnit of purchaseUnits) {
    const captures = asArray(readObjectAt(purchaseUnit, "payments")?.captures);
    const capture = asObject(captures[0]);
    if (capture) return capture;
  }
  return undefined;
}

function mapPaypalStatus(payload: JsonObject): ProviderStatusResult {
  const orderStatus = asString(payload.status) ?? "CREATED";
  const capture = findPaypalCapture(payload);
  const captureStatus = asString(capture?.status);
  const providerStatus = captureStatus ?? orderStatus;
  const status =
    providerStatus === "COMPLETED"
      ? "succeeded"
      : providerStatus === "DECLINED" || providerStatus === "FAILED" || providerStatus === "VOIDED"
        ? "failed"
        : providerStatus === "APPROVED"
          ? "requires_action"
          : "pending";
  return { paymentId: asString(capture?.id), providerStatus, status };
}

function getApprovalUrl(payload: JsonObject): string | undefined {
  for (const link of asArray(payload.links)) {
    const object = asObject(link);
    const rel = asString(object?.rel);
    if (rel === "payer-action" || rel === "approve") return asString(object?.href);
  }
  return undefined;
}

function trustedCertificateHost(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".paypal.com")) return undefined;
    return url.hostname;
  } catch {
    return undefined;
  }
}

function paypalWebhookStatus(eventType: string): VerifiedProviderWebhook["status"] {
  if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.COMPLETED") {
    return "succeeded";
  }
  if (
    eventType === "PAYMENT.CAPTURE.DECLINED" ||
    eventType === "CHECKOUT.PAYMENT-APPROVAL.REVERSED"
  ) {
    return "failed";
  }
  if (eventType === "CHECKOUT.ORDER.APPROVED") return "requires_action";
  if (eventType === "PAYMENT.CAPTURE.PENDING") return "pending";
  return undefined;
}

export function createPaypalProvider(config: PaypalPaymentConfig) {
  return {
    async createOrder(input: ProviderCheckoutInput): Promise<ProviderCheckoutResult> {
      try {
        const payload = await paypalRequest(config, "/v2/checkout/orders", {
          method: "POST",
          headers: { "PayPal-Request-Id": input.idempotencyKey, Prefer: "return=representation" },
          body: JSON.stringify({
            intent: "CAPTURE",
            payment_source: {
              paypal: {
                experience_context: {
                  cancel_url: `${input.origin}/payments/paypal?state=canceled`,
                  return_url: `${input.origin}/payments/paypal?state=returned`,
                  shipping_preference: "NO_SHIPPING",
                  user_action: "PAY_NOW",
                },
              },
            },
            purchase_units: [
              {
                amount: {
                  currency_code: input.currency,
                  value: formatMinorUnits(input.amount),
                },
                custom_id: input.transactionId,
                description: input.description,
                reference_id: input.transactionId,
              },
            ],
          }),
        });
        const checkoutUrl = getApprovalUrl(payload);
        const providerReferenceId = asString(payload.id);
        if (!checkoutUrl || !providerReferenceId) {
          throw new PaymentProviderError("PayPal did not return an approval URL");
        }
        const status = mapPaypalStatus(payload);
        return {
          checkoutUrl,
          paymentId: status.paymentId,
          providerReferenceId,
          providerStatus: status.providerStatus,
          status: status.status,
        };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("PayPal", "create the order", error);
      }
    },

    async captureOrder(orderId: string, idempotencyKey: string): Promise<ProviderStatusResult> {
      try {
        return mapPaypalStatus(
          await paypalRequest(
            config,
            `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
            {
              method: "POST",
              headers: { "PayPal-Request-Id": idempotencyKey, Prefer: "return=representation" },
              body: "{}",
            },
          ),
        );
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("PayPal", "capture the approved order", error);
      }
    },

    async getStatus(orderId: string): Promise<ProviderStatusResult> {
      try {
        return mapPaypalStatus(
          await paypalRequest(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}`),
        );
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return handleProviderError("PayPal", "verify the order status", error);
      }
    },

    async verifyWebhook(
      rawBody: string,
      headers: Headers,
      now = new Date(),
    ): Promise<VerifiedProviderWebhook> {
      assertPaypalConfig(config, true);
      const authAlgorithm = headers.get("paypal-auth-algo");
      const certificateUrl = headers.get("paypal-cert-url");
      const transmissionId = headers.get("paypal-transmission-id");
      const transmissionSignature = headers.get("paypal-transmission-sig");
      const transmissionTime = headers.get("paypal-transmission-time");
      const certificateHost = certificateUrl ? trustedCertificateHost(certificateUrl) : undefined;
      const transmittedAt = transmissionTime ? Date.parse(transmissionTime) : Number.NaN;
      if (
        !authAlgorithm ||
        !certificateUrl ||
        !certificateHost ||
        !transmissionId ||
        !transmissionSignature ||
        !transmissionTime ||
        !Number.isFinite(transmittedAt) ||
        Math.abs(now.getTime() - transmittedAt) > PAYPAL_WEBHOOK_TOLERANCE_MS
      ) {
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

      let verification: JsonObject;
      try {
        verification = await paypalRequest(config, "/v1/notifications/verify-webhook-signature", {
          method: "POST",
          body: JSON.stringify({
            auth_algo: authAlgorithm,
            cert_url: certificateUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSignature,
            transmission_time: transmissionTime,
            webhook_event: rawPayload,
            webhook_id: config.webhookId,
          }),
        });
      } catch {
        throw new InvalidWebhookSignatureError();
      }
      if (asString(verification.verification_status) !== "SUCCESS") {
        throw new InvalidWebhookSignatureError();
      }

      const eventId = asString(payload.id);
      const eventType = asString(payload.event_type);
      const resource = asObject(payload.resource);
      if (!eventId || !eventType || !resource) throw new InvalidWebhookSignatureError();
      const providerReferenceId =
        readStringAt(resource, "supplementary_data", "related_ids", "order_id") ??
        (eventType.startsWith("CHECKOUT.ORDER.") ? asString(resource.id) : undefined);

      return {
        eventId,
        eventType,
        paymentId: eventType.startsWith("PAYMENT.CAPTURE.") ? asString(resource.id) : undefined,
        provider: "paypal",
        providerReferenceId,
        providerStatus: asString(resource.status),
        rawPayload,
        signatureHeaders: {
          names: [
            "paypal-auth-algo",
            "paypal-cert-url",
            "paypal-transmission-id",
            "paypal-transmission-sig",
            "paypal-transmission-time",
          ],
          algorithm: authAlgorithm,
          certificateHost,
          timestamp: transmissionTime,
          transmissionId,
        },
        status: paypalWebhookStatus(eventType),
      };
    },
  };
}
