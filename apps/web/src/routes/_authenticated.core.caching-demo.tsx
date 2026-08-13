import { createFileRoute } from "@tanstack/react-router";
import { CachingDemo } from "~/labs/core/caching/components/caching-demo";

export const Route = createFileRoute("/_authenticated/core/caching-demo")({
  component: CachingDemo,
});
