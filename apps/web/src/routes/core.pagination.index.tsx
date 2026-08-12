import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/pagination/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/pagination/")({
  component: PaginationOverview,
});

function PaginationOverview() {
  const components = useMDXComponents({});

  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={components} />
    </article>
  );
}
