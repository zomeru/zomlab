import { createFileRoute } from "@tanstack/react-router";
import { MemoizationLab } from "~/labs/performance/memoization/memoization-lab";

export const Route = createFileRoute("/_authenticated/performance/memoization")({
  component: MemoizationLab,
});
