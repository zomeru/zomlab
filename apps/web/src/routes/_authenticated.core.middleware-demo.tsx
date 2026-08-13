import { createFileRoute } from "@tanstack/react-router";
import { MiddlewareDemo } from "~/labs/core/middleware/components/middleware-demo";

export const Route = createFileRoute("/_authenticated/core/middleware-demo")({
  component: MiddlewareDemo,
});
