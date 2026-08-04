import Architecture from "@content/core/crud/architecture.mdx";
import Overview from "@content/core/crud/overview.mdx";
import Pitfalls from "@content/core/crud/pitfalls.mdx";
import RequestFlow from "@content/core/crud/request-flow.mdx";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CRUD — Core — ZomLab" };

export default function CrudPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <Overview />
      <Architecture />
      <RequestFlow />
      <Pitfalls />
    </article>
  );
}
