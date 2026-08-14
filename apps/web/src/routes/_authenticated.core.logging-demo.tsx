import { createFileRoute } from "@tanstack/react-router";
import { LoggingDemo } from "~/labs/core/logging/components/logging-demo";

export const Route = createFileRoute("/_authenticated/core/logging-demo")({
  component: LoggingDemo,
});
