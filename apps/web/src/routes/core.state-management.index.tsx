import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/state-management/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/state-management/")({
  component: StateManagementOverview,
});

function StateManagementOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
