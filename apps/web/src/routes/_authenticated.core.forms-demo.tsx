import { createFileRoute } from "@tanstack/react-router";
import { FormsDemo } from "~/labs/core/forms/components/forms-demo";

export const Route = createFileRoute("/_authenticated/core/forms-demo")({
  component: FormsDemo,
});
