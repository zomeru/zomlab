import { createFileRoute } from "@tanstack/react-router";
import Overview from "~/labs/core/file-uploads/content/overview.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/file-uploads/")({
  component: FileUploadsOverview,
});

function FileUploadsOverview() {
  const components = useMDXComponents({});
  return (
    <article className="mx-auto max-w-3xl">
      <Overview components={components} />
    </article>
  );
}
