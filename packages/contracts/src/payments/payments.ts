import { z } from "zod";

export const PAYMENT_MIN_AMOUNT = 100;
export const PAYMENT_MAX_AMOUNT = 100_000_000;
export const PAYMENT_DEFAULT_AMOUNT = 50_000;

export const paymentProviderSchema = z.enum(["stripe", "paymongo", "paypal"]);
export const paymentStatusSchema = z.enum([
  "created",
  "pending",
  "requires_action",
  "succeeded",
  "failed",
  "canceled",
]);

export const paymentMetadataSchema = z.strictObject({
  checkoutKind: z.enum(["hosted", "order"]).optional(),
  providerStatus: z.string().max(100).optional(),
  lastWebhookEventId: z.string().max(255).optional(),
  lastWebhookEventType: z.string().max(255).optional(),
  captureId: z.string().max(255).optional(),
  failureCode: z.string().max(100).optional(),
});

export const paymentTransactionSchema = z.strictObject({
  id: z.uuid(),
  provider: paymentProviderSchema,
  providerReferenceId: z.string().min(1).max(255).nullable(),
  providerPaymentId: z.string().min(1).max(255).nullable(),
  amount: z.number().int().min(1),
  currency: z.string().length(3),
  status: paymentStatusSchema,
  description: z.string().max(255),
  metadata: paymentMetadataSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const paymentAmountSchema = z
  .number()
  .int("Use an integer amount in minor units")
  .min(PAYMENT_MIN_AMOUNT, "Amount must be at least 100 minor units")
  .max(PAYMENT_MAX_AMOUNT, "Amount is above the demo limit");

export const createCheckoutBodySchema = z.strictObject({
  amount: paymentAmountSchema,
  currency: z.literal("PHP").default("PHP"),
  description: z.string().trim().min(1).max(120).default("ZomLab payment experiment"),
  idempotencyKey: z.string().trim().min(8).max(255),
});

export const checkoutResponseSchema = z.strictObject({
  transaction: paymentTransactionSchema,
  checkoutUrl: z.url(),
  replayed: z.boolean(),
});

export const paymentStatusResponseSchema = z.strictObject({
  transaction: paymentTransactionSchema,
});

export const paymentTransactionListQuerySchema = z.strictObject({
  provider: paymentProviderSchema.optional(),
});

export const paymentTransactionListResponseSchema = z.strictObject({
  items: z.array(paymentTransactionSchema),
  total: z.number().int().min(0),
});

export const paymentReferenceParamsSchema = z.strictObject({
  referenceId: z.string().min(1).max(255),
});

export const paymentTransactionParamsSchema = z.strictObject({ id: z.uuid() });

export const paypalCaptureBodySchema = z.strictObject({
  orderId: z.string().trim().min(1).max(255),
});

export const paymentConfigurationSchema = z.strictObject({
  stripe: z.boolean(),
  paymongo: z.boolean(),
  paypal: z.boolean(),
});

export const paymentConfigurationResponseSchema = z.strictObject({
  providers: paymentConfigurationSchema,
  mode: z.literal("sandbox"),
});

export const webhookStatusSchema = z.enum(["received", "processed", "failed"]);

export const signatureHeaderSummarySchema = z.strictObject({
  names: z.array(z.string().max(100)).max(8),
  timestamp: z.string().max(100).optional(),
  algorithm: z.string().max(100).optional(),
  transmissionId: z.string().max(100).optional(),
  certificateHost: z.string().max(255).optional(),
});

export const webhookProcessingResultSchema = z.strictObject({
  transactionId: z.uuid().optional(),
  transactionStatus: paymentStatusSchema.optional(),
  message: z.string().max(255),
});

export const paymentWebhookEventSchema = z.strictObject({
  id: z.uuid(),
  provider: paymentProviderSchema,
  providerEventId: z.string().min(1).max(255),
  eventType: z.string().min(1).max(255),
  status: webhookStatusSchema,
  payload: z.json(),
  signatureHeaders: signatureHeaderSummarySchema,
  result: webhookProcessingResultSchema.nullable(),
  duplicateCount: z.number().int().min(0),
  error: z.string().max(500).nullable(),
  receivedAt: z.iso.datetime(),
  processedAt: z.iso.datetime().nullable(),
});

export const paymentWebhookListResponseSchema = z.strictObject({
  items: z.array(paymentWebhookEventSchema),
  total: z.number().int().min(0),
});

export const webhookIdParamsSchema = z.strictObject({ id: z.uuid() });

export const webhookReceiptResponseSchema = z.strictObject({
  received: z.literal(true),
  duplicate: z.boolean(),
  eventId: z.string().min(1).max(255),
});

export const idempotencyStateSchema = z.enum(["processing", "completed"]);

export const idempotencyRecordSchema = z.strictObject({
  id: z.uuid(),
  key: z.string().min(1).max(255),
  operation: z.string().min(1).max(100),
  requestHash: z.string().length(64),
  state: idempotencyStateSchema,
  responseStatus: z.number().int().min(100).max(599).nullable(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});

export const idempotencyDemoBodySchema = z.strictObject({
  amount: paymentAmountSchema,
  currency: z.literal("PHP").default("PHP"),
  idempotencyKey: z.string().trim().min(8).max(255),
});

export const idempotencyDemoResponseSchema = z.strictObject({
  operationId: z.uuid(),
  amount: paymentAmountSchema,
  currency: z.literal("PHP"),
  record: idempotencyRecordSchema,
  replayed: z.boolean(),
});

export const idempotencyListResponseSchema = z.strictObject({
  items: z.array(idempotencyRecordSchema),
  total: z.number().int().min(0),
});

export const signatureDemoProviderSchema = z.enum(["stripe", "paymongo"]);
export const signatureDemoSignBodySchema = z.strictObject({
  provider: signatureDemoProviderSchema,
  payload: z.string().min(1).max(20_000),
});
export const signatureDemoValidateBodySchema = signatureDemoSignBodySchema.extend({
  signature: z.string().min(1).max(1_000),
});
export const signatureDemoSignResponseSchema = z.strictObject({
  signature: z.string().min(1),
});
export const signatureDemoValidateResponseSchema = z.strictObject({
  valid: z.boolean(),
  expectedSignature: z.string().min(1),
});

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentMetadata = z.infer<typeof paymentMetadataSchema>;
export type PaymentTransaction = z.infer<typeof paymentTransactionSchema>;
export type CreateCheckoutBody = z.infer<typeof createCheckoutBodySchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type PaymentStatusResponse = z.infer<typeof paymentStatusResponseSchema>;
export type PaymentTransactionListResponse = z.infer<typeof paymentTransactionListResponseSchema>;
export type PaymentConfigurationResponse = z.infer<typeof paymentConfigurationResponseSchema>;
export type SignatureHeaderSummary = z.infer<typeof signatureHeaderSummarySchema>;
export type WebhookProcessingResult = z.infer<typeof webhookProcessingResultSchema>;
export type PaymentWebhookEvent = z.infer<typeof paymentWebhookEventSchema>;
export type PaymentWebhookListResponse = z.infer<typeof paymentWebhookListResponseSchema>;
export type IdempotencyRecord = z.infer<typeof idempotencyRecordSchema>;
export type IdempotencyDemoBody = z.infer<typeof idempotencyDemoBodySchema>;
export type IdempotencyDemoResponse = z.infer<typeof idempotencyDemoResponseSchema>;
export type IdempotencyListResponse = z.infer<typeof idempotencyListResponseSchema>;
export type SignatureDemoProvider = z.infer<typeof signatureDemoProviderSchema>;
export type SignatureDemoSignResponse = z.infer<typeof signatureDemoSignResponseSchema>;
export type SignatureDemoValidateResponse = z.infer<typeof signatureDemoValidateResponseSchema>;
