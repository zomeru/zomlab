import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

function StatusPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">System Status</h1>
      <p className="mt-2 text-muted-foreground">Monitor the health of ZomLab services.</p>
    </div>
  );
}
