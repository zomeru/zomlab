import { createFileRoute } from "@tanstack/react-router";
import ErrorContract from "~/labs/core/error-handling/content/error-contract.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/error-handling/error-contract")({
  component: ErrorHandlingContract,
});

function ErrorHandlingContract() {
  return (
    <article className="mx-auto max-w-3xl">
      <ErrorContract components={useMDXComponents({})} />
    </article>
  );
}
