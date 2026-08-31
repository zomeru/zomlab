import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProviderPaymentDemo } from "~/labs/payments/components/provider-payment-demo";

export const Route = createFileRoute("/_authenticated/payments/paypal")({
  validateSearch: z.object({
    state: z.enum(["canceled", "returned"]).optional(),
    token: z.string().max(255).optional(),
  }),
  component: PaypalPaymentsPage,
});

function PaypalPaymentsPage() {
  const search = Route.useSearch();
  return (
    <ProviderPaymentDemo
      provider="paypal"
      returnReference={search.token}
      returnState={search.state}
    />
  );
}
