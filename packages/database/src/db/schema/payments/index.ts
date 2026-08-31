import type {
  PaymentMetadata,
  PaymentProvider,
  PaymentStatus,
  SignatureHeaderSummary,
  WebhookProcessingResult,
} from "@zomlab/contracts";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "../auth";

export type SanitizedJsonValue =
  | boolean
  | number
  | string
  | null
  | SanitizedJsonValue[]
  | SanitizedWebhookPayload;

/** A provider payload after personal, credential, and authorization fields have been removed. */
export interface SanitizedWebhookPayload {
  [key: string]: SanitizedJsonValue | undefined;
}

export type IdempotencyResponseBody =
  | {
      kind: "checkout";
      checkoutUrl: string;
      transactionId: string;
    }
  | {
      kind: "demo";
      amount: number;
      currency: "PHP";
      operationId: string;
    }
  | {
      kind: "paypal_capture";
      transactionId: string;
    }
  | {
      kind: "error";
      code: string;
      message: string;
    };

export type IdempotencyState = "processing" | "completed";
export type WebhookStatus = "received" | "processed" | "failed";

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).$type<PaymentProvider>().notNull(),
    /** Checkout session or order ID used to reconcile the browser return with the provider. */
    providerReferenceId: varchar("provider_reference_id", { length: 255 }),
    /** Final PaymentIntent, payment, or capture ID when one exists. */
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: varchar("status", { length: 32 }).$type<PaymentStatus>().notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    metadata: jsonb("metadata").$type<PaymentMetadata>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payment_transactions_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("payment_transactions_provider_status_idx").on(table.provider, table.status),
    uniqueIndex("payment_transactions_provider_reference_unique").on(
      table.provider,
      table.providerReferenceId,
    ),
    uniqueIndex("payment_transactions_provider_payment_unique").on(
      table.provider,
      table.providerPaymentId,
    ),
  ],
);

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    provider: varchar("provider", { length: 32 }).$type<PaymentProvider>().notNull(),
    providerEventId: varchar("provider_event_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 }).$type<WebhookStatus>().notNull(),
    /** Sanitized provider JSON; credentials, authorization data, and personal fields are removed. */
    payload: jsonb("payload").$type<SanitizedWebhookPayload>().notNull(),
    /** Header names and non-secret verification metadata; raw signatures are never persisted. */
    signatureHeaders: jsonb("signature_headers").$type<SignatureHeaderSummary>().notNull(),
    result: jsonb("result").$type<WebhookProcessingResult>(),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    error: varchar("error", { length: 500 }),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_webhook_events_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
    index("payment_webhook_events_user_id_received_at_idx").on(table.userId, table.receivedAt),
    index("payment_webhook_events_provider_status_idx").on(table.provider, table.status),
  ],
);

export const paymentIdempotencyKeys = pgTable(
  "payment_idempotency_keys",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    operation: varchar("operation", { length: 100 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    state: varchar("state", { length: 32 }).$type<IdempotencyState>().notNull(),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body").$type<IdempotencyResponseBody>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("payment_idempotency_keys_scope_unique").on(
      table.userId,
      table.operation,
      table.key,
    ),
    index("payment_idempotency_keys_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("payment_idempotency_keys_expires_at_idx").on(table.expiresAt),
  ],
);

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id],
  }),
}));

export const paymentWebhookEventsRelations = relations(paymentWebhookEvents, ({ one }) => ({
  user: one(users, {
    fields: [paymentWebhookEvents.userId],
    references: [users.id],
  }),
}));

export const paymentIdempotencyKeysRelations = relations(paymentIdempotencyKeys, ({ one }) => ({
  user: one(users, {
    fields: [paymentIdempotencyKeys.userId],
    references: [users.id],
  }),
}));

export type PaymentTransactionRow = typeof paymentTransactions.$inferSelect;
export type PaymentWebhookEventRow = typeof paymentWebhookEvents.$inferSelect;
export type PaymentIdempotencyKeyRow = typeof paymentIdempotencyKeys.$inferSelect;
