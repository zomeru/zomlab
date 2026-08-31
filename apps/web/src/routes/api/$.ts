import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";

type HandlerContext = {
  request: Request;
};

async function handleRequest({ request }: HandlerContext) {
  const { apiApp } = await import("~/integration/hono/app");
  return apiApp.fetch(request, env);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handleRequest,
      POST: handleRequest,
      PUT: handleRequest,
      PATCH: handleRequest,
      DELETE: handleRequest,
      OPTIONS: handleRequest,
    },
  },
});
