import { createFileRoute } from "@tanstack/react-router";
import { JavaScriptPerformanceLab } from "~/labs/performance/javascript/javascript-performance-lab";

export const Route = createFileRoute("/_authenticated/performance/javascript")({
  component: JavaScriptPerformanceLab,
});
