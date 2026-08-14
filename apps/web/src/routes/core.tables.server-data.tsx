import { createFileRoute } from "@tanstack/react-router";
import ServerData from "~/labs/core/tables/content/server-data.mdx";
import { useMDXComponents } from "~/mdx-components";

export const Route = createFileRoute("/core/tables/server-data")({
  component: TablesServerData,
});

function TablesServerData() {
  return (
    <article className="mx-auto max-w-3xl">
      <ServerData components={useMDXComponents({})} />
    </article>
  );
}
