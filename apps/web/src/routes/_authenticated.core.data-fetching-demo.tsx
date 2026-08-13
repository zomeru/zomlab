import { createFileRoute } from "@tanstack/react-router";
import { DataFetchingDemo } from "~/labs/core/data-fetching/components/data-fetching-demo";

export const Route = createFileRoute("/_authenticated/core/data-fetching-demo")({
  component: DataFetchingDemo,
});
