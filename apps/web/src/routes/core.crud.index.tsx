import { createFileRoute } from "@tanstack/react-router";
import Architecture from "~/labs/core/crud/content/architecture.mdx";
import Overview from "~/labs/core/crud/content/overview.mdx";
import Pitfalls from "~/labs/core/crud/content/pitfalls.mdx";
import RequestFlow from "~/labs/core/crud/content/request-flow.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/crud/")({
  component: CrudOverview,
});

function CrudOverview() {
  const components = useMDXComponents({});

  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <Overview components={components} />
      <Architecture components={components} />
      <RequestFlow components={components} />
      <Pitfalls components={components} />
    </article>
  );
}