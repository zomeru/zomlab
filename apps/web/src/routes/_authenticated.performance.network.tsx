import { createFileRoute } from "@tanstack/react-router";
import { NetworkPerformanceLab } from "~/labs/performance/network/network-performance-lab";

export const Route = createFileRoute("/_authenticated/performance/network")({
  component: NetworkPerformanceLab,
});
