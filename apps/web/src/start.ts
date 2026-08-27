import { env } from "cloudflare:workers";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const canonicalHostRedirect = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);

  if (url.hostname === "zomlab.zomer.workers.dev") {
    const canonicalUrl = new URL(env.BETTER_AUTH_URL);

    return Response.redirect(`${canonicalUrl.origin}${url.pathname}${url.search}`, 301);
  }

  return next();
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

const privateHtmlResponses = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const contentType = result.response.headers.get("Content-Type");

  if (contentType?.includes("text/html")) {
    result.response.headers.set("Cache-Control", "private, no-store");
    result.response.headers.set("Pragma", "no-cache");

    const vary = new Set(
      (result.response.headers.get("Vary") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    vary.add("Cookie");
    result.response.headers.set("Vary", [...vary].join(", "));
  }

  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalHostRedirect, csrfMiddleware, privateHtmlResponses],
}));
