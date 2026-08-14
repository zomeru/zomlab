import { createFileRoute } from "@tanstack/react-router";
import StorageSecurity from "~/labs/core/file-uploads/content/storage-security.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/file-uploads/storage-security")({
  component: FileUploadsStorageSecurity,
});

function FileUploadsStorageSecurity() {
  return (
    <article className="mx-auto max-w-3xl">
      <StorageSecurity components={useMDXComponents({})} />
    </article>
  );
}
