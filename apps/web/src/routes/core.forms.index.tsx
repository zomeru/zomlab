import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/forms/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/forms/")({ component: FormsOverview });

function FormsOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
