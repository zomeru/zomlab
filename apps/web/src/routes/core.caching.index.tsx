import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/caching/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/caching/")({ component: CachingOverview });

function CachingOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
