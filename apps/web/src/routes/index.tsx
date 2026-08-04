import { createFileRoute } from "@tanstack/react-router";
import { ScaffoldHome } from "../components/scaffold-home";

export const Route = createFileRoute("/")({
  component: ScaffoldHome,
});
