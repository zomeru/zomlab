import { createFileRoute } from "@tanstack/react-router";
import { ConcurrencyLab } from "~/labs/performance/concurrency/concurrency-lab";

export const Route = createFileRoute("/_authenticated/performance/concurrency")({
  component: ConcurrencyLab,
});
