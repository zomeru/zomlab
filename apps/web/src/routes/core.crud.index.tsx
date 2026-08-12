import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/crud/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/crud/")({
  component: CrudOverview,
});

function CrudOverview() {
  const components = useMDXComponents({});

  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={components} />
    </article>
  );
}
