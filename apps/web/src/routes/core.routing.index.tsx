import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/routing/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/routing/")({ component: RoutingOverview });

function RoutingOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
