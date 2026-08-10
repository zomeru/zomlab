import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("route authentication guards", () => {
  test("checks sessions only during real auth-boundary navigations", async () => {
    const routesDirectory = resolve(import.meta.dirname, "../../routes");
    const [root, login, signup, authenticated] = await Promise.all([
      readFile(resolve(routesDirectory, "__root.tsx"), "utf8"),
      readFile(resolve(routesDirectory, "login.tsx"), "utf8"),
      readFile(resolve(routesDirectory, "signup.tsx"), "utf8"),
      readFile(resolve(routesDirectory, "_authenticated.tsx"), "utf8"),
    ]);

    expect(root).not.toContain('import { getSession } from "~/lib/auth.function"');
    expect(root).not.toContain("beforeLoad");

    for (const route of [login, signup, authenticated]) {
      expect(route).toContain('import { getSession } from "~/lib/auth.function"');
      expect(route).toContain("preload");
      expect(route).toContain("await getSession()");
    }

    expect(login).toMatch(/if \(preload\) \{\s+return;/);
    expect(signup).toMatch(/if \(preload\) \{\s+return;/);
    expect(authenticated).toMatch(/if \(preload\) \{\s+throw redirect/);
  });
});
