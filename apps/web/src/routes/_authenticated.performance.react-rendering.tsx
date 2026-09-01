import { createFileRoute } from "@tanstack/react-router";
import { ReactRenderingLab } from "~/labs/performance/react-rendering/react-rendering-lab";

export const Route = createFileRoute("/_authenticated/performance/react-rendering")({
  component: ReactRenderingLab,
});
