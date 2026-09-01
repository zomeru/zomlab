import { createFileRoute } from "@tanstack/react-router";
import { LazyLoadingLab } from "~/labs/performance/lazy-loading/lazy-loading-lab";

export const Route = createFileRoute("/_authenticated/performance/lazy-loading")({
  component: LazyLoadingLab,
});
