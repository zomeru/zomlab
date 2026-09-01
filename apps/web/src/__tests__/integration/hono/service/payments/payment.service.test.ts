import type {
  PaymentRepository,
  SerializedPaymentIdempotencyKeyRow,
  SerializedPaymentTransactionRow,
  SerializedPaymentWebhookEventRow,
} from "@zomlab/database";
import { describe, expect, test } from "vitest";
import { IdempotencyConflictError } from "~/integration/hono/errors/api-error";
import { createPaymentService } from "~/integration/hono/service/payments/payment.service";

function unused(): never {
  throw new Error("Unexpected repository call");
}

function createIdempotencyRepository() {
  const records = new Map<string, SerializedPaymentIdempotencyKeyRow>();
  let createdOperations = 0;

  const repository = {
    createTransaction: async () => unused(),
    findTransactionById: async () => unused(),
    findTransactionByUserAndId: async () => unused(),
    findTransactionByProviderReference: async () => unused(),
    findTransactionByProviderPayment: async () => unused(),
    listTransactionsByUser: async () => unused(),
    updateTransaction: async () => unused(),
    claimWebhook: async () => unused(),
    completeWebhook: async () => unused(),
    failWebhook: async () => unused(),
    listWebhooksByUser: async () => unused(),
    findWebhookByUserAndId: async () => unused(),
    async claimIdempotency(data) {
      const scope = `${data.userId}:${data.operation}:${data.key}`;
      const existing = records.get(scope);
      if (existing) return { claimed: false, record: existing };

      createdOperations += 1;
      const createdAt = (data.now ?? new Date()).toISOString();
      const record: SerializedPaymentIdempotencyKeyRow = {
        id: data.id,
        userId: data.userId,
        key: data.key,
        operation: data.operation,
        requestHash: data.requestHash,
        state: "processing",
        responseStatus: null,
        responseBody: null,
        createdAt,
        expiresAt: new Date(Date.parse(createdAt) + 120_000).toISOString(),
      };
      records.set(scope, record);
      return { claimed: true, record };
    },
    async completeIdempotency(id, responseStatus, responseBody) {
      const entry = Array.from(records.entries()).find(([, record]) => record.id === id);
      if (!entry) return unused();
      const [scope, record] = entry;
      const completed: SerializedPaymentIdempotencyKeyRow = {
        ...record,
        state: "completed",
        responseStatus,
        responseBody,
        expiresAt: new Date(Date.parse(record.createdAt) + 86_400_000).toISOString(),
      };
      records.set(scope, completed);
      return completed;
    },
    async listIdempotencyByUser(userId) {
      return Array.from(records.values()).filter((record) => record.userId === userId);
    },
  } satisfies PaymentRepository;

  return { repository, getCreatedOperations: () => createdOperations };
}

function createWebhookRepository() {
  let event: SerializedPaymentWebhookEventRow | undefined;
  let transaction: SerializedPaymentTransactionRow | undefined;
  let completedEvents = 0;

  const repository = {
    createTransaction: async () => unused(),
    findTransactionById: async () => undefined,
    findTransactionByUserAndId: async () => unused(),
    async findTransactionByProviderReference(provider, providerReferenceId) {
      return transaction?.provider === provider &&
        transaction.providerReferenceId === providerReferenceId
        ? transaction
        : undefined;
    },
    findTransactionByProviderPayment: async () => undefined,
    listTransactionsByUser: async () => unused(),
    async updateTransaction(id, data) {
      if (!transaction || transaction.id !== id) return undefined;
      transaction = { ...transaction, ...data, updatedAt: new Date().toISOString() };
      return transaction;
    },
    async claimWebhook(data) {
      if (event) {
        event = { ...event, duplicateCount: event.duplicateCount + 1 };
        return { claimed: false, event };
      }

      event = {
        id: data.id,
        userId: data.userId ?? null,
        provider: data.provider,
        providerEventId: data.providerEventId,
        eventType: data.eventType,
        status: "received",
        payload: data.payload,
        signatureHeaders: data.signatureHeaders,
        result: null,
        duplicateCount: 0,
        error: null,
        receivedAt: new Date().toISOString(),
        processedAt: null,
      };
      return { claimed: true, event };
    },
    async completeWebhook(id, result) {
      if (!event || event.id !== id) return unused();
      completedEvents += 1;
      event = {
        ...event,
        status: "processed",
        result,
        processedAt: new Date().toISOString(),
      };
      return event;
    },
    failWebhook: async () => unused(),
    listWebhooksByUser: async () => unused(),
    findWebhookByUserAndId: async () => unused(),
    claimIdempotency: async () => unused(),
    completeIdempotency: async () => unused(),
    listIdempotencyByUser: async () => unused(),
  } satisfies PaymentRepository;

  return {
    repository,
    getCompletedEvents: () => completedEvents,
    setTransaction(value: SerializedPaymentTransactionRow) {
      transaction = value;
    },
  };
}

describe("payment idempotency service", () => {
  test("returns the persisted response for the same key and request", async () => {
    const fake = createIdempotencyRepository();
    const service = createPaymentService(fake.repository);
    const request = { amount: 100_000, currency: "PHP" as const, idempotencyKey: "same-key" };

    const first = await service.runIdempotencyDemo("user-1", request);
    const replay = await service.runIdempotencyDemo("user-1", request);

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.operationId).toBe(first.operationId);
    expect(fake.getCreatedOperations()).toBe(1);
  });

  test("rejects the same key when the request body changes", async () => {
    const fake = createIdempotencyRepository();
    const service = createPaymentService(fake.repository);
    await service.runIdempotencyDemo("user-1", {
      amount: 100_000,
      currency: "PHP",
      idempotencyKey: "same-key",
    });

    await expect(
      service.runIdempotencyDemo("user-1", {
        amount: 200_000,
        currency: "PHP",
        idempotencyKey: "same-key",
      }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(fake.getCreatedOperations()).toBe(1);
  });

  test("allows only one owner when matching requests arrive concurrently", async () => {
    const fake = createIdempotencyRepository();
    const service = createPaymentService(fake.repository);
    const request = {
      amount: 100_000,
      currency: "PHP" as const,
      idempotencyKey: "concurrent-key",
    };

    const results = await Promise.all([
      service.runIdempotencyDemo("user-1", request),
      service.runIdempotencyDemo("user-1", request),
    ]);

    expect(new Set(results.map((result) => result.operationId)).size).toBe(1);
    expect(fake.getCreatedOperations()).toBe(1);
  });
});

describe("payment webhook service", () => {
  test("acknowledges a duplicate delivery without processing it twice", async () => {
    const fake = createWebhookRepository();
    const service = createPaymentService(fake.repository);
    const webhook = {
      eventId: "evt_duplicate",
      eventType: "payment.succeeded",
      provider: "stripe" as const,
      rawPayload: { id: "evt_duplicate", secret: "must-not-be-stored" },
      signatureHeaders: { names: ["stripe-signature"], algorithm: "HMAC-SHA256" },
      status: "succeeded" as const,
    };

    const first = await service.processWebhook(webhook);
    const duplicate = await service.processWebhook(webhook);

    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(fake.getCompletedEvents()).toBe(1);
  });

  test("reconciles a repeated event that arrived before its transaction was linked", async () => {
    const fake = createWebhookRepository();
    const service = createPaymentService(fake.repository);
    const webhook = {
      eventId: "evt_early",
      eventType: "checkout.session.completed",
      provider: "stripe" as const,
      providerReferenceId: "cs_early",
      rawPayload: { id: "evt_early" },
      signatureHeaders: { names: ["stripe-signature"], algorithm: "HMAC-SHA256" },
      status: "succeeded" as const,
    };

    expect(await service.processWebhook(webhook)).toEqual({
      duplicate: false,
      eventId: "evt_early",
    });
    fake.setTransaction({
      id: "10000000-0000-4000-8000-000000000000",
      userId: "user-1",
      provider: "stripe",
      providerReferenceId: "cs_early",
      providerPaymentId: null,
      amount: 10_000,
      currency: "PHP",
      status: "pending",
      description: "Early webhook test",
      metadata: { checkoutKind: "hosted" },
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(await service.processWebhook(webhook)).toEqual({
      duplicate: true,
      eventId: "evt_early",
    });
    expect(fake.getCompletedEvents()).toBe(2);
  });
});
