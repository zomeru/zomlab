import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { runZizmor } from "./zizmor.js";

const REPOSITORY_ROOT = process.cwd();

describe("zizmor", () => {
  it("accepts the repository workflows through the installed security linter", async () => {
    await expect(
      runZizmor([
        resolve(REPOSITORY_ROOT, ".github/workflows/ci.yml"),
        resolve(REPOSITORY_ROOT, ".github/workflows/migrate-db.yml"),
        resolve(REPOSITORY_ROOT, ".github/workflows/e2e-tests.yml"),
      ]),
    ).resolves.toBeUndefined();
  });
});
