import { createFileRoute } from "@tanstack/react-router";
import { ValidationDemo } from "~/labs/core/validation/components/validation-demo";

export const Route = createFileRoute("/_authenticated/core/validation-demo")({
  component: ValidationDemo,
});
