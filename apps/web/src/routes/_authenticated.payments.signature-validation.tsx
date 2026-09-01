import { createFileRoute } from "@tanstack/react-router";
import { SignatureValidationDemo } from "~/labs/payments/components/signature-validation-demo";

export const Route = createFileRoute("/_authenticated/payments/signature-validation")({
  component: SignatureValidationDemo,
});
