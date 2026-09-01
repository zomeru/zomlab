import { createFileRoute } from "@tanstack/react-router";
import { ApiPerformanceLab } from "~/labs/performance/api/api-performance-lab";

export const Route = createFileRoute("/_authenticated/performance/api")({
  component: ApiPerformanceLab,
});
