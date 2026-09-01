import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("API route Worker bindings", () => {
  test("passes the Cloudflare environment to the embedded Hono app", async () => {
    const route = await readFile(resolve(import.meta.dirname, "../../routes/api/$.ts"), "utf8");

    expect(route).toContain('import { env } from "cloudflare:workers";');
    expect(route).toContain("apiApp.fetch(request, env)");
  });

  test("reads payment secrets through the validated environment package", async () => {
    const paymentRoute = await readFile(
      resolve(import.meta.dirname, "../../integration/hono/routes/payments/payments.route.ts"),
      "utf8",
    );

    expect(paymentRoute).toContain('import { env } from "@zomlab/env";');
    expect(paymentRoute).not.toContain("c.env");
  });
});
