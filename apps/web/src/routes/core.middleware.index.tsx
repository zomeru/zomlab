import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/middleware/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/middleware/")({ component: MiddlewareOverview });

function MiddlewareOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
