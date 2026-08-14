import { describe, expect, it, vi } from "vitest";
import { runStagingSmoke } from "./staging-smoke";

describe("runStagingSmoke", () => {
  it("verifies the public health and version contracts", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith("/api/health")) {
        return Response.json(
          { status: "ok", timestamp: "2026-08-13T00:00:00.000Z", uptime: 42 },
          { headers: { "x-request-id": "health-request" } },
        );
      }

      return Response.json(
        { name: "zomlab-api", version: "0.1.0" },
        { headers: { "x-request-id": "version-request" } },
      );
    });

    await expect(runStagingSmoke("https://staging.example.com/", fetcher)).resolves.toEqual({
      healthRequestId: "health-request",
      version: "0.1.0",
      versionRequestId: "version-request",
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, "https://staging.example.com/api/health", {
      headers: { accept: "application/json" },
      redirect: "manual",
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, "https://staging.example.com/api/version", {
      headers: { accept: "application/json" },
      redirect: "manual",
    });
  });

  it("fails with the endpoint and status when staging is unhealthy", async () => {
    const fetcher = vi.fn(async () => new Response("Unavailable", { status: 503 }));

    await expect(runStagingSmoke("https://staging.example.com", fetcher)).rejects.toThrow(
      "GET /api/health failed with status 503",
    );
  });

  it("does not require request IDs to be echoed in response headers", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ status: "ok", timestamp: "2026-08-13T00:00:00.000Z", uptime: 42 }),
      )
      .mockResolvedValueOnce(Response.json({ name: "zomlab-api", version: "0.1.0" }));

    await expect(runStagingSmoke("https://staging.example.com", fetcher)).resolves.toEqual({
      healthRequestId: null,
      version: "0.1.0",
      versionRequestId: null,
    });
  });

  it("explains how to authenticate when Cloudflare Access redirects the request", async () => {
    const fetcher = vi.fn(async () =>
      Response.redirect("https://team.cloudflareaccess.com/cdn-cgi/access/login", 302),
    );

    await expect(runStagingSmoke("https://staging.example.com", fetcher)).rejects.toThrow(
      "Cloudflare Access protected",
    );
  });
});
