import { createFileRoute } from "@tanstack/react-router";
import { apiApp } from "~/integration/hono/app";

type HandlerContext = {
  request: Request;
};

function handleRequest({ request }: HandlerContext) {
  return apiApp.fetch(request);
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
