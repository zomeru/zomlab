import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RoutingDemo } from "~/labs/core/routing/components/routing-demo";

export const Route = createFileRoute("/_authenticated/core/routing-demo")({
  validateSearch: z.object({ topic: z.enum(["guard", "route", "search"]).optional() }),
  component: RoutingDemoRoute,
});

function RoutingDemoRoute() {
  return <RoutingDemo topic={Route.useSearch().topic ?? "route"} />;
}
