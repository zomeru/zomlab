import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/logging/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/logging/")({ component: LoggingOverview });

function LoggingOverview() {
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={useMDXComponents({})} />
    </article>
  );
}
