import { createFileRoute } from "@tanstack/react-router";
import { StateManagementDemo } from "~/labs/core/state-management/components/state-management-demo";

export const Route = createFileRoute("/_authenticated/core/state-management-demo")({
  component: StateManagementDemo,
});
