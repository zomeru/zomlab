import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/validation/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/validation/")({ component: ValidationOverview });

function ValidationOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
