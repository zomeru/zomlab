import { createFileRoute } from "@tanstack/react-router";
import { ErrorHandlingDemo } from "~/labs/core/error-handling/components/error-handling-demo";

export const Route = createFileRoute("/_authenticated/core/error-handling-demo")({
  component: ErrorHandlingDemo,
});
