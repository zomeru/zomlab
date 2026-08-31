import { createFileRoute } from "@tanstack/react-router";
import { IdempotencyDemo } from "~/labs/payments/components/idempotency-demo";

export const Route = createFileRoute("/_authenticated/payments/idempotency")({
  component: IdempotencyDemo,
});
