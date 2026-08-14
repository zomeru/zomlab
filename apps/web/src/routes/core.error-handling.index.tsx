import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/error-handling/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/error-handling/")({
  component: ErrorHandlingOverview,
});

function ErrorHandlingOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
