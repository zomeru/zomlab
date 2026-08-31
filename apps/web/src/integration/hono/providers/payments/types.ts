import type { PaymentProvider, PaymentStatus, SignatureHeaderSummary } from "@zomlab/contracts";

export interface ProviderCheckoutInput {
  amount: number;
  currency: "PHP";
  description: string;
  idempotencyKey: string;
  origin: string;
  transactionId: string;
}

export interface ProviderCheckoutResult {
  checkoutUrl: string;
  paymentId?: string;
  providerReferenceId: string;
  providerStatus: string;
  status: PaymentStatus;
}

export interface ProviderStatusResult {
  paymentId?: string;
  providerStatus: string;
  status: PaymentStatus;
}

export interface VerifiedProviderWebhook {
  eventId: string;
  eventType: string;
  paymentId?: string;
  provider: PaymentProvider;
  providerReferenceId?: string;
  providerStatus?: string;
  rawPayload: unknown;
  signatureHeaders: SignatureHeaderSummary;
  status?: PaymentStatus;
  transactionId?: string;
}

export interface StripePaymentConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface PaymongoPaymentConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface PaypalPaymentConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox";
  webhookId: string;
}
