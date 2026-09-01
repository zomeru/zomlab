import { createFileRoute } from "@tanstack/react-router";
import { ProfilingLab } from "~/labs/performance/profiling/profiling-lab";

export const Route = createFileRoute("/_authenticated/performance/profiling")({
  component: ProfilingLab,
});
