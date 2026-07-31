import cors from "@elysiajs/cors";
import { env } from "@zomlab/env";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { elysiaHelmet } from "elysiajs-helmet";
import { RateLimitError } from "../errors";

const isDev = process.env.NODE_ENV === "development";

/**
 * Security plugin: helmet (security headers), CORS, and rate limiting.
 *
 * Rate limiting is disabled in development to avoid throttling local work;
 * it keys on the real client IP behind a proxy chain.
 */
export const securityPlugin = new Elysia({ name: "security" })
  .use(
    elysiaHelmet({
      frameOptions: "DENY",
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsPolicy: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  )
  .use(
    cors({
      origin: [env.NEXT_PUBLIC_SITE_URL, env.BETTER_AUTH_URL],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(
    !isDev
      ? rateLimit({
          max: 100,
          duration: 60_000,
          errorResponse: new RateLimitError(),
          generator: ({ headers }) => {
            const forwardedFor = headers.get("x-forwarded-for");
            const realIp = headers.get("x-real-ip");
            return forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
          },
        })
      : (app) => app,
  );
