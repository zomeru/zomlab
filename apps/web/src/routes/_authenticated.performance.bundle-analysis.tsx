import { createFileRoute } from "@tanstack/react-router";
import { BundleAnalysisLab } from "~/labs/performance/bundle-analysis/bundle-analysis-lab";

export const Route = createFileRoute("/_authenticated/performance/bundle-analysis")({
  component: BundleAnalysisLab,
});
