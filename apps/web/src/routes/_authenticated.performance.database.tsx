import { createFileRoute } from "@tanstack/react-router";
import { DatabasePerformanceLab } from "~/labs/performance/database/database-performance-lab";

export const Route = createFileRoute("/_authenticated/performance/database")({
  component: DatabasePerformanceLab,
});
