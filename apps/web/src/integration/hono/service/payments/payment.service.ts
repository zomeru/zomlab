import {
  type CheckoutResponse,
  type CreateCheckoutBody,
  type IdempotencyDemoBody,
  type IdempotencyDemoResponse,
  type IdempotencyRecord,
  idempotencyRecordSchema,
  type PaymentConfigurationResponse,
  type PaymentMetadata,
  type PaymentProvider,
  type PaymentStatus,
  type PaymentTransaction,
  type PaymentWebhookEvent,
  paymentTransactionSchema,
  paymentWebhookEventSchema,
  type SignatureDemoProvider,
  type WebhookProcessingResult,
} from "@zomlab/contracts";
import type {
  IdempotencyResponseBody,
  PaymentRepository,
  SerializedPaymentIdempotencyKeyRow,
  SerializedPaymentTransactionRow,
  SerializedPaymentWebhookEventRow,
} from "@zomlab/database";
import {
  ApiError,
  IdempotencyConflictError,
  PaymentNotFoundError,
  PaymentStateError,
} from "~/integration/hono/errors/api-error";
import { createPaymongoProvider } from "~/integration/hono/providers/payments/paymongo.provider";
import { createPaypalProvider } from "~/integration/hono/providers/payments/paypal.provider";
import { createStripeProvider } from "~/integration/hono/providers/payments/stripe.provider";
import type {
  PaymongoPaymentConfig,
  PaypalPaymentConfig,
  ProviderCheckoutResult,
  ProviderStatusResult,
  StripePaymentConfig,
  VerifiedProviderWebhook,
} from "~/integration/hono/providers/payments/types";
import {
  createDemoSignature,
  createProviderIdempotencyKey,
  sha256Hex,
  validateDemoSignature,
} from "~/integration/hono/utils/payment-crypto";
import { sanitizeWebhookPayload } from "~/integration/hono/utils/payment-sanitize";

export interface PaymentProviderConfigs {
  stripe: StripePaymentConfig;
  paymongo: PaymongoPaymentConfig;
  paypal: PaypalPaymentConfig;
}

function publicTransaction(row: SerializedPaymentTransactionRow): PaymentTransaction {
  const { userId: _userId, ...transaction } = row;
  return paymentTransactionSchema.parse(transaction);
}

function publicWebhook(row: SerializedPaymentWebhookEventRow): PaymentWebhookEvent {
  const { userId: _userId, ...event } = row;
  return paymentWebhookEventSchema.parse(event);
}

function publicIdempotency(row: SerializedPaymentIdempotencyKeyRow): IdempotencyRecord {
  const { responseBody: _responseBody, userId: _userId, ...record } = row;
  return idempotencyRecordSchema.parse(record);
}

function requestHash(data: unknown): Promise<string> {
  return sha256Hex(JSON.stringify(data));
}

function canTransition(current: PaymentStatus, next: PaymentStatus): boolean {
  if (current === "succeeded") return next === "succeeded";
  if (current === "failed" || current === "canceled") {
    return next === "succeeded" || next === current;
  }
  return true;
}

function replayError(record: SerializedPaymentIdempotencyKeyRow): never {
  const body = record.responseBody;
  if (body?.kind !== "error" || !record.responseStatus) {
    throw new IdempotencyConflictError("This request is still being processed. Try again shortly.");
  }
  throw new ApiError(body.code, body.message, record.responseStatus);
}

export function createPaymentService(repository: PaymentRepository) {
  async function getOwnedTransaction(userId: string, id: string) {
    const transaction = await repository.findTransactionByUserAndId(userId, id);
    if (!transaction) throw new PaymentNotFoundError();
    return transaction;
  }

  async function getOwnedTransactionByReference(
    userId: string,
    provider: PaymentProvider,
    referenceId: string,
  ) {
    const transaction = await repository.findTransactionByProviderReference(provider, referenceId);
    if (!transaction || transaction.userId !== userId) throw new PaymentNotFoundError();
    return transaction;
  }

  async function updateFromProvider(
    transaction: SerializedPaymentTransactionRow,
    result: ProviderStatusResult,
  ) {
    const status = canTransition(transaction.status, result.status)
      ? result.status
      : transaction.status;
    const updated = await repository.updateTransaction(transaction.id, {
      ...(result.paymentId ? { providerPaymentId: result.paymentId } : {}),
      status,
      metadata: { ...transaction.metadata, providerStatus: result.providerStatus },
    });
    if (!updated) throw new PaymentNotFoundError();
    return updated;
  }

  async function persistIdempotentError(recordId: string, error: ApiError): Promise<never> {
    await repository.completeIdempotency(recordId, error.status, {
      kind: "error",
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return {
    configuration(configs: PaymentProviderConfigs): PaymentConfigurationResponse {
      return {
        mode: "sandbox",
        providers: {
          stripe:
            configs.stripe.secretKey.startsWith("sk_test_") &&
            configs.stripe.webhookSecret.startsWith("whsec_"),
          paymongo:
            configs.paymongo.secretKey.startsWith("sk_test_") &&
            configs.paymongo.webhookSecret.startsWith("whsk_"),
          paypal:
            configs.paypal.environment === "sandbox" &&
            configs.paypal.clientId.length > 0 &&
            configs.paypal.clientSecret.length > 0 &&
            configs.paypal.webhookId.length > 0,
        },
      };
    },

    async listTransactions(userId: string, provider?: PaymentProvider) {
      const items = await repository.listTransactionsByUser(userId, provider);
      return { items: items.map(publicTransaction), total: items.length };
    },

    async createCheckout(
      provider: PaymentProvider,
      userId: string,
      data: CreateCheckoutBody,
      origin: string,
      configs: PaymentProviderConfigs,
    ): Promise<CheckoutResponse> {
      const operation = `${provider}.checkout.create`;
      const hash = await requestHash({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
      });
      const claim = await repository.claimIdempotency({
        id: crypto.randomUUID(),
        userId,
        key: data.idempotencyKey,
        operation,
        requestHash: hash,
      });

      if (!claim.claimed) {
        if (claim.record.requestHash !== hash) {
          throw new IdempotencyConflictError(
            "This idempotency key was already used with different payment details.",
          );
        }
        if (claim.record.state !== "completed") {
          throw new IdempotencyConflictError("This payment request is still being processed.");
        }
        if (claim.record.responseBody?.kind === "error") replayError(claim.record);
        if (claim.record.responseBody?.kind !== "checkout") {
          throw new IdempotencyConflictError("The stored idempotency response is not reusable.");
        }
        const transaction = await getOwnedTransaction(
          userId,
          claim.record.responseBody.transactionId,
        );
        return {
          checkoutUrl: claim.record.responseBody.checkoutUrl,
          replayed: true,
          transaction: publicTransaction(transaction),
        };
      }

      const transactionId = crypto.randomUUID();
      const metadata: PaymentMetadata = {
        checkoutKind: provider === "paypal" ? "order" : "hosted",
      };
      const transaction = await repository.createTransaction({
        id: transactionId,
        userId,
        provider,
        amount: data.amount,
        currency: data.currency,
        status: "created",
        description: data.description,
        metadata,
      });
      const providerKey = await createProviderIdempotencyKey(
        userId,
        operation,
        data.idempotencyKey,
      );

      let checkout: ProviderCheckoutResult;
      try {
        const input = {
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          idempotencyKey: providerKey,
          origin,
          transactionId,
        } as const;
        checkout =
          provider === "stripe"
            ? await createStripeProvider(configs.stripe).createCheckout(input)
            : provider === "paymongo"
              ? await createPaymongoProvider(configs.paymongo).createCheckout(input)
              : await createPaypalProvider(configs.paypal).createOrder(input);
      } catch (error) {
        if (error instanceof ApiError) {
          await repository.updateTransaction(transaction.id, {
            status: "failed",
            metadata: { ...metadata, failureCode: error.code },
          });
          return persistIdempotentError(claim.record.id, error);
        }
        throw error;
      }

      const updated = await repository.updateTransaction(transaction.id, {
        providerReferenceId: checkout.providerReferenceId,
        ...(checkout.paymentId ? { providerPaymentId: checkout.paymentId } : {}),
        status: checkout.status,
        metadata: { ...metadata, providerStatus: checkout.providerStatus },
      });
      if (!updated) throw new PaymentNotFoundError();
      await repository.completeIdempotency(claim.record.id, 201, {
        kind: "checkout",
        checkoutUrl: checkout.checkoutUrl,
        transactionId,
      });
      return {
        checkoutUrl: checkout.checkoutUrl,
        replayed: false,
        transaction: publicTransaction(updated),
      };
    },

    async refreshStatus(
      provider: PaymentProvider,
      userId: string,
      referenceId: string,
      configs: PaymentProviderConfigs,
    ) {
      const transaction = await getOwnedTransactionByReference(userId, provider, referenceId);
      const result =
        provider === "stripe"
          ? await createStripeProvider(configs.stripe).getStatus(referenceId)
          : provider === "paymongo"
            ? await createPaymongoProvider(configs.paymongo).getStatus(referenceId)
            : await createPaypalProvider(configs.paypal).getStatus(referenceId);
      return { transaction: publicTransaction(await updateFromProvider(transaction, result)) };
    },

    async refreshTransactionStatus(userId: string, id: string, configs: PaymentProviderConfigs) {
      const transaction = await getOwnedTransaction(userId, id);
      if (!transaction.providerReferenceId) {
        throw new PaymentStateError("The provider has not assigned a payment reference yet.");
      }
      const referenceId = transaction.providerReferenceId;
      const result =
        transaction.provider === "stripe"
          ? await createStripeProvider(configs.stripe).getStatus(referenceId)
          : transaction.provider === "paymongo"
            ? await createPaymongoProvider(configs.paymongo).getStatus(referenceId)
            : await createPaypalProvider(configs.paypal).getStatus(referenceId);
      return { transaction: publicTransaction(await updateFromProvider(transaction, result)) };
    },

    async capturePaypal(userId: string, orderId: string, configs: PaymentProviderConfigs) {
      const transaction = await getOwnedTransactionByReference(userId, "paypal", orderId);
      const operation = "paypal.order.capture";
      const hash = await requestHash({ orderId });
      const claim = await repository.claimIdempotency({
        id: crypto.randomUUID(),
        userId,
        key: orderId,
        operation,
        requestHash: hash,
      });
      if (!claim.claimed) {
        if (claim.record.requestHash !== hash) {
          throw new IdempotencyConflictError(
            "This PayPal order does not match the stored capture.",
          );
        }
        if (claim.record.state !== "completed") {
          throw new IdempotencyConflictError("This PayPal capture is still being processed.");
        }
        if (claim.record.responseBody?.kind === "error") replayError(claim.record);
        if (claim.record.responseBody?.kind !== "paypal_capture") {
          throw new IdempotencyConflictError("The stored capture response is not reusable.");
        }
        return {
          transaction: publicTransaction(
            await getOwnedTransaction(userId, claim.record.responseBody.transactionId),
          ),
        };
      }

      if (transaction.status === "succeeded") {
        await repository.completeIdempotency(claim.record.id, 200, {
          kind: "paypal_capture",
          transactionId: transaction.id,
        });
        return { transaction: publicTransaction(transaction) };
      }

      try {
        const providerKey = await createProviderIdempotencyKey(userId, operation, orderId);
        const result = await createPaypalProvider(configs.paypal).captureOrder(
          orderId,
          providerKey,
        );
        const updated = await updateFromProvider(transaction, result);
        await repository.completeIdempotency(claim.record.id, 200, {
          kind: "paypal_capture",
          transactionId: transaction.id,
        });
        return { transaction: publicTransaction(updated) };
      } catch (error) {
        if (error instanceof ApiError) return persistIdempotentError(claim.record.id, error);
        throw error;
      }
    },

    async processWebhook(webhook: VerifiedProviderWebhook) {
      const candidate = webhook.transactionId
        ? await repository.findTransactionById(webhook.transactionId)
        : webhook.providerReferenceId
          ? await repository.findTransactionByProviderReference(
              webhook.provider,
              webhook.providerReferenceId,
            )
          : webhook.paymentId
            ? await repository.findTransactionByProviderPayment(webhook.provider, webhook.paymentId)
            : undefined;
      const transaction = candidate?.provider === webhook.provider ? candidate : undefined;
      const claim = await repository.claimWebhook({
        id: crypto.randomUUID(),
        ...(transaction ? { userId: transaction.userId } : {}),
        provider: webhook.provider,
        providerEventId: webhook.eventId,
        eventType: webhook.eventType,
        payload: sanitizeWebhookPayload(webhook.rawPayload),
        signatureHeaders: webhook.signatureHeaders,
      });

      if (!claim.claimed && claim.event.status !== "failed") {
        return { duplicate: true, eventId: webhook.eventId };
      }

      try {
        let result: WebhookProcessingResult = {
          message: "Verified event did not match a local transaction.",
        };
        if (transaction) {
          const nextStatus =
            webhook.status && canTransition(transaction.status, webhook.status)
              ? webhook.status
              : transaction.status;
          const updated = await repository.updateTransaction(transaction.id, {
            ...(webhook.providerReferenceId
              ? { providerReferenceId: webhook.providerReferenceId }
              : {}),
            ...(webhook.paymentId ? { providerPaymentId: webhook.paymentId } : {}),
            status: nextStatus,
            metadata: {
              ...transaction.metadata,
              lastWebhookEventId: webhook.eventId,
              lastWebhookEventType: webhook.eventType,
              ...(webhook.providerStatus ? { providerStatus: webhook.providerStatus } : {}),
            },
          });
          if (!updated) throw new PaymentNotFoundError();
          result = {
            message: "Transaction state updated from a verified provider event.",
            transactionId: updated.id,
            transactionStatus: updated.status,
          };
        }
        await repository.completeWebhook(claim.event.id, result);
        return { duplicate: !claim.claimed, eventId: webhook.eventId };
      } catch (error) {
        await repository.failWebhook(claim.event.id, "Webhook processing failed; retry is safe.");
        throw error;
      }
    },

    async listWebhooks(userId: string) {
      const items = await repository.listWebhooksByUser(userId);
      return { items: items.map(publicWebhook), total: items.length };
    },

    async getWebhook(userId: string, id: string) {
      const event = await repository.findWebhookByUserAndId(userId, id);
      if (!event) throw new PaymentNotFoundError();
      return publicWebhook(event);
    },

    async runIdempotencyDemo(
      userId: string,
      data: IdempotencyDemoBody,
    ): Promise<IdempotencyDemoResponse> {
      const operation = "payment.demo.create";
      const hash = await requestHash({ amount: data.amount, currency: data.currency });
      const claim = await repository.claimIdempotency({
        id: crypto.randomUUID(),
        userId,
        key: data.idempotencyKey,
        operation,
        requestHash: hash,
      });
      if (!claim.claimed) {
        if (claim.record.requestHash !== hash) {
          throw new IdempotencyConflictError(
            "This idempotency key was already used with a different amount.",
          );
        }
        if (claim.record.state !== "completed") {
          throw new IdempotencyConflictError("This operation is still being processed.");
        }
        if (claim.record.responseBody?.kind !== "demo") replayError(claim.record);
        return {
          amount: claim.record.responseBody.amount,
          currency: claim.record.responseBody.currency,
          operationId: claim.record.responseBody.operationId,
          record: publicIdempotency(claim.record),
          replayed: true,
        };
      }

      const response: IdempotencyResponseBody = {
        kind: "demo",
        amount: data.amount,
        currency: data.currency,
        operationId: claim.record.id,
      };
      const completed = await repository.completeIdempotency(claim.record.id, 201, response);
      return {
        amount: data.amount,
        currency: data.currency,
        operationId: claim.record.id,
        record: publicIdempotency(completed),
        replayed: false,
      };
    },

    async listIdempotency(userId: string) {
      const items = await repository.listIdempotencyByUser(userId);
      return { items: items.map(publicIdempotency), total: items.length };
    },

    signDemo(provider: SignatureDemoProvider, payload: string) {
      return { signature: createDemoSignature(provider, payload) };
    },

    validateDemo(provider: SignatureDemoProvider, payload: string, signature: string) {
      return validateDemoSignature(provider, payload, signature);
    },
  };
}
