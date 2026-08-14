import { createFileRoute } from "@tanstack/react-router";
import DataBoundaries from "~/labs/core/crud/content/data-boundaries.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/crud/data-boundaries")({
  component: CrudDataBoundaries,
});

function CrudDataBoundaries() {
  return (
    <article className="mx-auto max-w-3xl">
      <DataBoundaries components={useMDXComponents({})} />
    </article>
  );
}
