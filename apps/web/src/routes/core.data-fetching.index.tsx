import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/data-fetching/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/data-fetching/")({
  component: DataFetchingOverview,
});

function DataFetchingOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
