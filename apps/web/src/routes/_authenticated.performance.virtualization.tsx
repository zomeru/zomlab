import { createFileRoute } from "@tanstack/react-router";
import { VirtualizationLab } from "~/labs/performance/virtualization/virtualization-lab";

export const Route = createFileRoute("/_authenticated/performance/virtualization")({
  component: VirtualizationLab,
});
