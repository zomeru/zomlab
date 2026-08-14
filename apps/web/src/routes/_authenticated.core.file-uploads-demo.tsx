import { createFileRoute } from "@tanstack/react-router";
import { FileUploadsDemo } from "~/labs/core/file-uploads/components/file-uploads-demo";

export const Route = createFileRoute("/_authenticated/core/file-uploads-demo")({
  component: FileUploadsDemo,
});
