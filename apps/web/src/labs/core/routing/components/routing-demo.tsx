"use client";

import { Link } from "@tanstack/react-router";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";

export type RoutingTopic = "guard" | "route" | "search";

const topics: Record<RoutingTopic, { description: string; label: string; takeaway: string }> = {
  route: {
    description:
      "File names define route identity, while createFileRoute keeps navigation and parameters typed.",
    label: "File routes",
    takeaway: "The route tree is generated from files; application code never edits it directly.",
  },
  search: {
    description:
      "Validated search parameters make filters and pagination shareable, refresh-safe application state.",
    label: "Search parameters",
    takeaway: "The URL is application state.",
  },
  guard: {
    description:
      "The pathless authenticated layout checks the session before private pages render or preload.",
    label: "Route guards",
    takeaway: "Navigation guards improve UX; API middleware still enforces data security.",
  },
};

export function RoutingDemo({ topic }: { topic: RoutingTopic }) {
  const current = topics[topic];

  return (
    <CoreDemoShell
      description="Move between typed route concepts and keep the selected lesson in the URL."
      title="Routing"
    >
      <nav className="flex flex-wrap gap-2" aria-label="Routing topics">
        {(Object.entries(topics) as Array<[RoutingTopic, (typeof topics)[RoutingTopic]]>).map(
          ([value, item]) => (
            <Button asChild key={value} variant="outline">
              <Link
                activeOptions={{ exact: true, includeSearch: true }}
                activeProps={{
                  "aria-current": "page",
                  className: "bg-primary text-primary-foreground",
                }}
                search={value === "route" ? {} : { topic: value }}
                to="/core/routing-demo"
              >
                {item.label}
              </Link>
            </Button>
          ),
        )}
      </nav>

      <Card className="mt-5" role="region" aria-live="polite" aria-labelledby="routing-topic">
        <CardHeader>
          <p className="font-mono text-xs text-muted-foreground">
            /core/routing-demo{topic === "route" ? "" : `?topic=${topic}`}
          </p>
          <CardTitle id="routing-topic">{current.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-7 text-muted-foreground">{current.description}</p>
          <p className="rounded-lg bg-muted px-4 py-3 font-medium text-foreground">
            {current.takeaway}
          </p>
        </CardContent>
      </Card>
    </CoreDemoShell>
  );
}
