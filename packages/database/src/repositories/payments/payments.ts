import type {
  PaymentMetadata,
  PaymentProvider,
  PaymentStatus,
  SignatureHeaderSummary,
  WebhookProcessingResult,
} from "@zomlab/contracts";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { db } from "../../client";
import {
  type IdempotencyResponseBody,
  type PaymentIdempotencyKeyRow,
  type PaymentTransactionRow,
  type PaymentWebhookEventRow,
  paymentIdempotencyKeys,
  paymentTransactions,
  paymentWebhookEvents,
  type SanitizedWebhookPayload,
} from "../../db/schema/payments";
import { serializeDates } from "../util";

const PROCESSING_TTL_MS = 2 * 60 * 1_000;
const COMPLETED_TTL_MS = 24 * 60 * 60 * 1_000;

export type SerializedPaymentTransactionRow = Omit<
  PaymentTransactionRow,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedPaymentWebhookEventRow = Omit<
  PaymentWebhookEventRow,
  "processedAt" | "receivedAt"
> & {
  processedAt: string | null;
  receivedAt: string;
};

export type SerializedPaymentIdempotencyKeyRow = Omit<
  PaymentIdempotencyKeyRow,
  "createdAt" | "expiresAt"
> & {
  createdAt: string;
  expiresAt: string;
};

export function getProcessingExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PROCESSING_TTL_MS);
}

export function getCompletedExpiry(now = new Date()): Date {
  return new Date(now.getTime() + COMPLETED_TTL_MS);
}

export function createPaymentRepository() {
  return {
    async createTransaction(data: {
      id: string;
      userId: string;
      provider: PaymentProvider;
      amount: number;
      currency: string;
      status: PaymentStatus;
      description: string;
      metadata: PaymentMetadata;
    }): Promise<SerializedPaymentTransactionRow> {
      const [row] = await db.insert(paymentTransactions).values(data).returning();
      if (!row) throw new Error("Payment transaction insert did not return a row");
      return serializeDates<PaymentTransactionRow>(row);
    },

    async findTransactionById(id: string): Promise<SerializedPaymentTransactionRow | undefined> {
      const [row] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, id))
        .limit(1);
      return row ? serializeDates<PaymentTransactionRow>(row) : undefined;
    },

    async findTransactionByUserAndId(
      userId: string,
      id: string,
    ): Promise<SerializedPaymentTransactionRow | undefined> {
      const [row] = await db
        .select()
        .from(paymentTransactions)
        .where(and(eq(paymentTransactions.id, id), eq(paymentTransactions.userId, userId)))
        .limit(1);
      return row ? serializeDates<PaymentTransactionRow>(row) : undefined;
    },

    async findTransactionByProviderReference(
      provider: PaymentProvider,
      providerReferenceId: string,
    ): Promise<SerializedPaymentTransactionRow | undefined> {
      const [row] = await db
        .select()
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.provider, provider),
            eq(paymentTransactions.providerReferenceId, providerReferenceId),
          ),
        )
        .limit(1);
      return row ? serializeDates<PaymentTransactionRow>(row) : undefined;
    },

    async findTransactionByProviderPayment(
      provider: PaymentProvider,
      providerPaymentId: string,
    ): Promise<SerializedPaymentTransactionRow | undefined> {
      const [row] = await db
        .select()
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.provider, provider),
            eq(paymentTransactions.providerPaymentId, providerPaymentId),
          ),
        )
        .limit(1);
      return row ? serializeDates<PaymentTransactionRow>(row) : undefined;
    },

    async listTransactionsByUser(
      userId: string,
      provider?: PaymentProvider,
    ): Promise<SerializedPaymentTransactionRow[]> {
      const where = provider
        ? and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.provider, provider))
        : eq(paymentTransactions.userId, userId);
      const rows = await db
        .select()
        .from(paymentTransactions)
        .where(where)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(50);
      return serializeDates<PaymentTransactionRow[]>(rows);
    },

    async updateTransaction(
      id: string,
      data: {
        providerReferenceId?: string;
        providerPaymentId?: string | null;
        status?: PaymentStatus;
        metadata?: PaymentMetadata;
      },
    ): Promise<SerializedPaymentTransactionRow | undefined> {
      const [row] = await db
        .update(paymentTransactions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(paymentTransactions.id, id))
        .returning();
      return row ? serializeDates<PaymentTransactionRow>(row) : undefined;
    },

    async claimWebhook(data: {
      id: string;
      userId?: string;
      provider: PaymentProvider;
      providerEventId: string;
      eventType: string;
      payload: SanitizedWebhookPayload;
      signatureHeaders: SignatureHeaderSummary;
    }): Promise<{ claimed: boolean; event: SerializedPaymentWebhookEventRow }> {
      const [inserted] = await db
        .insert(paymentWebhookEvents)
        .values({ ...data, status: "received" })
        .onConflictDoNothing({
          target: [paymentWebhookEvents.provider, paymentWebhookEvents.providerEventId],
        })
        .returning();

      if (inserted) {
        return { claimed: true, event: serializeDates<PaymentWebhookEventRow>(inserted) };
      }

      const [duplicate] = await db
        .update(paymentWebhookEvents)
        .set({ duplicateCount: sql`${paymentWebhookEvents.duplicateCount} + 1` })
        .where(
          and(
            eq(paymentWebhookEvents.provider, data.provider),
            eq(paymentWebhookEvents.providerEventId, data.providerEventId),
          ),
        )
        .returning();
      if (!duplicate) throw new Error("Webhook conflict row could not be loaded");
      return { claimed: false, event: serializeDates<PaymentWebhookEventRow>(duplicate) };
    },

    async completeWebhook(
      id: string,
      result: WebhookProcessingResult,
    ): Promise<SerializedPaymentWebhookEventRow> {
      const [row] = await db
        .update(paymentWebhookEvents)
        .set({ status: "processed", result, error: null, processedAt: new Date() })
        .where(eq(paymentWebhookEvents.id, id))
        .returning();
      if (!row) throw new Error("Webhook event could not be completed");
      return serializeDates<PaymentWebhookEventRow>(row);
    },

    async failWebhook(id: string, error: string): Promise<SerializedPaymentWebhookEventRow> {
      const [row] = await db
        .update(paymentWebhookEvents)
        .set({ status: "failed", error: error.slice(0, 500), processedAt: new Date() })
        .where(eq(paymentWebhookEvents.id, id))
        .returning();
      if (!row) throw new Error("Webhook event could not be marked failed");
      return serializeDates<PaymentWebhookEventRow>(row);
    },

    async listWebhooksByUser(userId: string): Promise<SerializedPaymentWebhookEventRow[]> {
      const rows = await db
        .select()
        .from(paymentWebhookEvents)
        .where(eq(paymentWebhookEvents.userId, userId))
        .orderBy(desc(paymentWebhookEvents.receivedAt))
        .limit(50);
      return serializeDates<PaymentWebhookEventRow[]>(rows);
    },

    async findWebhookByUserAndId(
      userId: string,
      id: string,
    ): Promise<SerializedPaymentWebhookEventRow | undefined> {
      const [row] = await db
        .select()
        .from(paymentWebhookEvents)
        .where(and(eq(paymentWebhookEvents.id, id), eq(paymentWebhookEvents.userId, userId)))
        .limit(1);
      return row ? serializeDates<PaymentWebhookEventRow>(row) : undefined;
    },

    async claimIdempotency(data: {
      id: string;
      userId: string;
      key: string;
      operation: string;
      requestHash: string;
      now?: Date;
    }): Promise<{ claimed: boolean; record: SerializedPaymentIdempotencyKeyRow }> {
      const now = data.now ?? new Date();
      const expiresAt = getProcessingExpiry(now);
      const [claimed] = await db
        .insert(paymentIdempotencyKeys)
        .values({
          id: data.id,
          userId: data.userId,
          key: data.key,
          operation: data.operation,
          requestHash: data.requestHash,
          state: "processing",
          expiresAt,
        })
        .onConflictDoUpdate({
          target: [
            paymentIdempotencyKeys.userId,
            paymentIdempotencyKeys.operation,
            paymentIdempotencyKeys.key,
          ],
          set: {
            id: data.id,
            requestHash: data.requestHash,
            state: "processing",
            responseStatus: null,
            responseBody: null,
            createdAt: now,
            expiresAt,
          },
          setWhere: lte(paymentIdempotencyKeys.expiresAt, now),
        })
        .returning();

      if (claimed) {
        return { claimed: true, record: serializeDates<PaymentIdempotencyKeyRow>(claimed) };
      }

      const [existing] = await db
        .select()
        .from(paymentIdempotencyKeys)
        .where(
          and(
            eq(paymentIdempotencyKeys.userId, data.userId),
            eq(paymentIdempotencyKeys.operation, data.operation),
            eq(paymentIdempotencyKeys.key, data.key),
          ),
        )
        .limit(1);
      if (!existing) throw new Error("Idempotency conflict row could not be loaded");
      return { claimed: false, record: serializeDates<PaymentIdempotencyKeyRow>(existing) };
    },

    async completeIdempotency(
      id: string,
      responseStatus: number,
      responseBody: IdempotencyResponseBody,
    ): Promise<SerializedPaymentIdempotencyKeyRow> {
      const [row] = await db
        .update(paymentIdempotencyKeys)
        .set({
          state: "completed",
          responseStatus,
          responseBody,
          expiresAt: getCompletedExpiry(),
        })
        .where(eq(paymentIdempotencyKeys.id, id))
        .returning();
      if (!row) throw new Error("Idempotency record could not be completed");
      return serializeDates<PaymentIdempotencyKeyRow>(row);
    },

    async listIdempotencyByUser(userId: string): Promise<SerializedPaymentIdempotencyKeyRow[]> {
      const rows = await db
        .select()
        .from(paymentIdempotencyKeys)
        .where(eq(paymentIdempotencyKeys.userId, userId))
        .orderBy(desc(paymentIdempotencyKeys.createdAt))
        .limit(50);
      return serializeDates<PaymentIdempotencyKeyRow[]>(rows);
    },
  };
}

export type PaymentRepository = ReturnType<typeof createPaymentRepository>;
