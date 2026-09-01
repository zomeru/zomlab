import { createFileRoute } from "@tanstack/react-router";
import { CodeSplittingLab } from "~/labs/performance/code-splitting/code-splitting-lab";

export const Route = createFileRoute("/_authenticated/performance/code-splitting")({
  component: CodeSplittingLab,
});
