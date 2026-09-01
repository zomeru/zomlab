import { createFileRoute } from "@tanstack/react-router";
import { WebhooksDemo } from "~/labs/payments/components/webhooks-demo";

export const Route = createFileRoute("/_authenticated/payments/webhooks")({
  component: WebhooksDemo,
});
