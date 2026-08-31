import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProviderPaymentDemo } from "~/labs/payments/components/provider-payment-demo";

export const Route = createFileRoute("/_authenticated/payments/stripe")({
  validateSearch: z.object({
    state: z.enum(["canceled", "returned"]).optional(),
    session_id: z.string().max(255).optional(),
  }),
  component: StripePaymentsPage,
});

function StripePaymentsPage() {
  const search = Route.useSearch();
  return (
    <ProviderPaymentDemo
      provider="stripe"
      returnReference={search.session_id}
      returnState={search.state}
    />
  );
}
