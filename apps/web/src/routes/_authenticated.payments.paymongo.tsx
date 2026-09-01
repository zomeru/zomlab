import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProviderPaymentDemo } from "~/labs/payments/components/provider-payment-demo";

export const Route = createFileRoute("/_authenticated/payments/paymongo")({
  validateSearch: z.object({
    state: z.enum(["canceled", "returned"]).optional(),
    transaction_id: z.uuid().optional(),
  }),
  component: PaymongoPaymentsPage,
});

function PaymongoPaymentsPage() {
  const search = Route.useSearch();
  return (
    <ProviderPaymentDemo
      provider="paymongo"
      returnState={search.state}
      returnTransactionId={search.transaction_id}
    />
  );
}
