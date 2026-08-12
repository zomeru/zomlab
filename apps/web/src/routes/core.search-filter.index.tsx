import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/search-filter/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/search-filter/")({
  component: SearchFilterOverview,
});

function SearchFilterOverview() {
  const components = useMDXComponents({});

  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={components} />
    </article>
  );
}
