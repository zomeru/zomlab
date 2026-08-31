import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  checkoutResponseSchema,
  createCheckoutBodySchema,
  idempotencyDemoBodySchema,
  idempotencyDemoResponseSchema,
  idempotencyListResponseSchema,
  paymentConfigurationResponseSchema,
  paymentReferenceParamsSchema,
  paymentStatusResponseSchema,
  paymentTransactionListQuerySchema,
  paymentTransactionListResponseSchema,
  paymentTransactionParamsSchema,
  paymentWebhookEventSchema,
  paymentWebhookListResponseSchema,
  paypalCaptureBodySchema,
  signatureDemoSignBodySchema,
  signatureDemoSignResponseSchema,
  signatureDemoValidateBodySchema,
  signatureDemoValidateResponseSchema,
  webhookIdParamsSchema,
} from "@zomlab/contracts";
import { createPaymentRepository } from "@zomlab/database";
import { env } from "@zomlab/env";
import { InvalidWebhookSignatureError } from "~/integration/hono/errors/api-error";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import { createPaymongoProvider } from "~/integration/hono/providers/payments/paymongo.provider";
import { createPaypalProvider } from "~/integration/hono/providers/payments/paypal.provider";
import { createStripeProvider } from "~/integration/hono/providers/payments/stripe.provider";
import {
  createPaymentService,
  type PaymentProviderConfigs,
} from "~/integration/hono/service/payments/payment.service";
import type { HonoEnv } from "~/integration/hono/types";
import { readLimitedRequestText } from "~/integration/hono/utils/payment-request";

const paymentService = createPaymentService(createPaymentRepository());

function providerConfigs(): PaymentProviderConfigs {
  return {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    paymongo: {
      secretKey: env.PAYMONGO_SECRET_KEY,
      webhookSecret: env.PAYMONGO_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: env.PAYPAL_CLIENT_ID,
      clientSecret: env.PAYPAL_CLIENT_SECRET,
      environment: env.PAYPAL_ENVIRONMENT,
      webhookId: env.PAYPAL_WEBHOOK_ID,
    },
  };
}

function applicationOrigin(): string {
  return new URL(env.BETTER_AUTH_URL).origin;
}

const app = new OpenAPIHono<HonoEnv>({
  defaultHook: (result, c) => {
    if (!result.success) return apiErrorHandler(result.error, c);
  },
})
  .openapi(
    createRoute({
      method: "get",
      path: "/configuration",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "Sandbox provider configuration status",
          content: { "application/json": { schema: paymentConfigurationResponseSchema } },
        },
      },
    }),
    async (c) => c.json(paymentService.configuration(providerConfigs())),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/transactions",
      middleware: [requireAuth] as const,
      request: { query: paymentTransactionListQuerySchema },
      responses: {
        200: {
          description: "Authenticated user's payment history",
          content: { "application/json": { schema: paymentTransactionListResponseSchema } },
        },
      },
    }),
    async (c) => {
      const query = c.req.valid("query");
      return c.json(await paymentService.listTransactions(c.var.user.id, query.provider));
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/transactions/{id}/status",
      middleware: [requireAuth] as const,
      request: { params: paymentTransactionParamsSchema },
      responses: {
        200: {
          description: "Transaction status verified against its provider",
          content: { "application/json": { schema: paymentStatusResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.refreshTransactionStatus(
          c.var.user.id,
          c.req.valid("param").id,
          providerConfigs(),
        ),
      ),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/stripe/checkout",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: createCheckoutBodySchema } } },
      },
      responses: {
        201: {
          description: "Stripe Checkout session created",
          content: { "application/json": { schema: checkoutResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.createCheckout(
          "stripe",
          c.var.user.id,
          c.req.valid("json"),
          applicationOrigin(),
          providerConfigs(),
        ),
        201,
      ),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/paymongo/checkout",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: createCheckoutBodySchema } } },
      },
      responses: {
        201: {
          description: "PayMongo Checkout session created",
          content: { "application/json": { schema: checkoutResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.createCheckout(
          "paymongo",
          c.var.user.id,
          c.req.valid("json"),
          applicationOrigin(),
          providerConfigs(),
        ),
        201,
      ),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/paypal/order",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: createCheckoutBodySchema } } },
      },
      responses: {
        201: {
          description: "PayPal sandbox order created",
          content: { "application/json": { schema: checkoutResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.createCheckout(
          "paypal",
          c.var.user.id,
          c.req.valid("json"),
          applicationOrigin(),
          providerConfigs(),
        ),
        201,
      ),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/stripe/status/{referenceId}",
      middleware: [requireAuth] as const,
      request: { params: paymentReferenceParamsSchema },
      responses: {
        200: {
          description: "Stripe status verified against the provider",
          content: { "application/json": { schema: paymentStatusResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.refreshStatus(
          "stripe",
          c.var.user.id,
          c.req.valid("param").referenceId,
          providerConfigs(),
        ),
      ),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/paymongo/status/{referenceId}",
      middleware: [requireAuth] as const,
      request: { params: paymentReferenceParamsSchema },
      responses: {
        200: {
          description: "PayMongo status verified against the provider",
          content: { "application/json": { schema: paymentStatusResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.refreshStatus(
          "paymongo",
          c.var.user.id,
          c.req.valid("param").referenceId,
          providerConfigs(),
        ),
      ),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/paypal/status/{referenceId}",
      middleware: [requireAuth] as const,
      request: { params: paymentReferenceParamsSchema },
      responses: {
        200: {
          description: "PayPal order status verified against the provider",
          content: { "application/json": { schema: paymentStatusResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.refreshStatus(
          "paypal",
          c.var.user.id,
          c.req.valid("param").referenceId,
          providerConfigs(),
        ),
      ),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/paypal/capture",
      middleware: [requireAuth] as const,
      request: { body: { content: { "application/json": { schema: paypalCaptureBodySchema } } } },
      responses: {
        200: {
          description: "Approved PayPal order captured",
          content: { "application/json": { schema: paymentStatusResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(
        await paymentService.capturePaypal(
          c.var.user.id,
          c.req.valid("json").orderId,
          providerConfigs(),
        ),
      ),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/webhooks",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "Recent verified webhook events for the authenticated user",
          content: { "application/json": { schema: paymentWebhookListResponseSchema } },
        },
      },
    }),
    async (c) => c.json(await paymentService.listWebhooks(c.var.user.id)),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/webhooks/{id}",
      middleware: [requireAuth] as const,
      request: { params: webhookIdParamsSchema },
      responses: {
        200: {
          description: "Sanitized webhook event detail",
          content: { "application/json": { schema: paymentWebhookEventSchema } },
        },
      },
    }),
    async (c) => c.json(await paymentService.getWebhook(c.var.user.id, c.req.valid("param").id)),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/idempotency",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: idempotencyDemoBodySchema } } },
      },
      responses: {
        201: {
          description: "Idempotent logical payment operation",
          content: { "application/json": { schema: idempotencyDemoResponseSchema } },
        },
      },
    }),
    async (c) =>
      c.json(await paymentService.runIdempotencyDemo(c.var.user.id, c.req.valid("json")), 201),
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/idempotency",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "Recent server-side idempotency records",
          content: { "application/json": { schema: idempotencyListResponseSchema } },
        },
      },
    }),
    async (c) => c.json(await paymentService.listIdempotency(c.var.user.id)),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/signatures/sign",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: signatureDemoSignBodySchema } } },
      },
      responses: {
        200: {
          description: "Educational HMAC signature",
          content: { "application/json": { schema: signatureDemoSignResponseSchema } },
        },
      },
    }),
    async (c) => {
      const data = c.req.valid("json");
      return c.json(paymentService.signDemo(data.provider, data.payload));
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/signatures/validate",
      middleware: [requireAuth] as const,
      request: {
        body: { content: { "application/json": { schema: signatureDemoValidateBodySchema } } },
      },
      responses: {
        200: {
          description: "Educational HMAC validation result",
          content: { "application/json": { schema: signatureDemoValidateResponseSchema } },
        },
      },
    }),
    async (c) => {
      const data = c.req.valid("json");
      return c.json(paymentService.validateDemo(data.provider, data.payload, data.signature));
    },
  )
  .doc31("/docs", {
    openapi: "3.1.0",
    info: { title: "Payments", version: "1" },
  })
  .post("/webhooks/stripe", async (c) => {
    const rawBody = await readLimitedRequestText(c.req.raw);
    const signature = c.req.header("stripe-signature");
    if (!signature) throw new InvalidWebhookSignatureError();
    const verified = await createStripeProvider(providerConfigs().stripe).verifyWebhook(
      rawBody,
      signature,
    );
    const result = await paymentService.processWebhook(verified);
    return c.json({ received: true as const, ...result });
  })
  .post("/webhooks/paymongo", async (c) => {
    const rawBody = await readLimitedRequestText(c.req.raw);
    const signature = c.req.header("paymongo-signature");
    if (!signature) throw new InvalidWebhookSignatureError();
    const verified = await createPaymongoProvider(providerConfigs().paymongo).verifyWebhook(
      rawBody,
      signature,
    );
    const result = await paymentService.processWebhook(verified);
    return c.json({ received: true as const, ...result });
  })
  .post("/webhooks/paypal", async (c) => {
    const rawBody = await readLimitedRequestText(c.req.raw);
    const verified = await createPaypalProvider(providerConfigs().paypal).verifyWebhook(
      rawBody,
      c.req.raw.headers,
    );
    const result = await paymentService.processWebhook(verified);
    return c.json({ received: true as const, ...result });
  });

export default app;
