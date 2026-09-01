import { createFileRoute } from "@tanstack/react-router";
import { PerformanceCachingLab } from "~/labs/performance/caching/caching-lab";

export const Route = createFileRoute("/_authenticated/performance/caching")({
  component: PerformanceCachingLab,
});
