import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CheckoutResponse,
  CreateCheckoutBody,
  IdempotencyDemoBody,
  IdempotencyDemoResponse,
  IdempotencyListResponse,
  PaymentConfigurationResponse,
  PaymentProvider,
  PaymentStatusResponse,
  PaymentTransactionListResponse,
  PaymentWebhookEvent,
  PaymentWebhookListResponse,
  SignatureDemoProvider,
  SignatureDemoSignResponse,
  SignatureDemoValidateResponse,
} from "@zomlab/contracts";
import { client } from "~/lib/api";
import { readJsonResponse } from "~/lib/api-response";
import { queryKeys } from "~/lib/query-keys";

export function usePaymentConfiguration() {
  return useQuery({
    queryKey: queryKeys.payments.configuration,
    queryFn: async () =>
      readJsonResponse<PaymentConfigurationResponse>(
        await client.api.payments.configuration.$get(),
        "Payment configuration could not be loaded",
      ),
  });
}

export function usePaymentTransactions(provider?: PaymentProvider) {
  return useQuery({
    queryKey: queryKeys.payments.transactions(provider),
    queryFn: async () =>
      readJsonResponse<PaymentTransactionListResponse>(
        await client.api.payments.transactions.$get({
          query: provider ? { provider } : {},
        }),
        "Payment history could not be loaded",
      ),
  });
}

export function useCreateCheckout(provider: PaymentProvider) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCheckoutBody) => {
      const response =
        provider === "stripe"
          ? await client.api.payments.stripe.checkout.$post({ json: data })
          : provider === "paymongo"
            ? await client.api.payments.paymongo.checkout.$post({ json: data })
            : await client.api.payments.paypal.order.$post({ json: data });
      return readJsonResponse<CheckoutResponse>(
        response,
        `${provider} checkout could not be created`,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.transactions(provider) }),
  });
}

export function usePaymentStatus(provider: PaymentProvider, referenceId: string | undefined) {
  return useQuery({
    enabled: Boolean(referenceId),
    queryKey: queryKeys.payments.status(provider, referenceId ?? ""),
    queryFn: async () => {
      if (!referenceId) throw new Error("Payment reference is required");
      const response =
        provider === "stripe"
          ? await client.api.payments.stripe.status[":referenceId"].$get({
              param: { referenceId },
            })
          : provider === "paymongo"
            ? await client.api.payments.paymongo.status[":referenceId"].$get({
                param: { referenceId },
              })
            : await client.api.payments.paypal.status[":referenceId"].$get({
                param: { referenceId },
              });
      return readJsonResponse<PaymentStatusResponse>(
        response,
        `${provider} payment status could not be verified`,
      );
    },
  });
}

export function usePaymentTransactionStatus(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.payments.status("paymongo", id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Payment transaction ID is required");
      return readJsonResponse<PaymentStatusResponse>(
        await client.api.payments.transactions[":id"].status.$get({ param: { id } }),
        "The PayMongo payment status could not be verified",
      );
    },
  });
}

export function useCapturePaypal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) =>
      readJsonResponse<PaymentStatusResponse>(
        await client.api.payments.paypal.capture.$post({ json: { orderId } }),
        "The approved PayPal order could not be captured",
      ),
    onSuccess: (data) => {
      if (data.transaction.providerReferenceId) {
        queryClient.setQueryData(
          queryKeys.payments.status("paypal", data.transaction.providerReferenceId),
          data,
        );
      }
      return queryClient.invalidateQueries({
        queryKey: queryKeys.payments.transactions("paypal"),
      });
    },
  });
}

export function usePaymentWebhooks() {
  return useQuery({
    queryKey: queryKeys.payments.webhooks,
    queryFn: async () =>
      readJsonResponse<PaymentWebhookListResponse>(
        await client.api.payments.webhooks.$get(),
        "Webhook events could not be loaded",
      ),
  });
}

export function usePaymentWebhook(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.payments.webhook(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Webhook event ID is required");
      return readJsonResponse<PaymentWebhookEvent>(
        await client.api.payments.webhooks[":id"].$get({ param: { id } }),
        "Webhook event details could not be loaded",
      );
    },
  });
}

export function useIdempotencyRecords() {
  return useQuery({
    queryKey: queryKeys.payments.idempotency,
    queryFn: async () =>
      readJsonResponse<IdempotencyListResponse>(
        await client.api.payments.idempotency.$get(),
        "Idempotency records could not be loaded",
      ),
  });
}

export function useRunIdempotencyDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IdempotencyDemoBody) =>
      readJsonResponse<IdempotencyDemoResponse>(
        await client.api.payments.idempotency.$post({ json: data }),
        "The idempotent operation could not be completed",
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.idempotency }),
  });
}

export function useSignDemoPayload() {
  return useMutation({
    mutationFn: async (data: { provider: SignatureDemoProvider; payload: string }) =>
      readJsonResponse<SignatureDemoSignResponse>(
        await client.api.payments.signatures.sign.$post({ json: data }),
        "The sample payload could not be signed",
      ),
  });
}

export function useValidateDemoSignature() {
  return useMutation({
    mutationFn: async (data: {
      provider: SignatureDemoProvider;
      payload: string;
      signature: string;
    }) =>
      readJsonResponse<SignatureDemoValidateResponse>(
        await client.api.payments.signatures.validate.$post({ json: data }),
        "The sample signature could not be validated",
      ),
  });
}
