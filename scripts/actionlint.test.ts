import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { lintWorkflowFiles } from "./actionlint.js";

const REPOSITORY_ROOT = process.cwd();

describe("actionlint", () => {
  it("accepts the repository workflows through the pinned WASM linter", async () => {
    await expect(
      lintWorkflowFiles([
        resolve(REPOSITORY_ROOT, ".github/workflows/ci.yml"),
        resolve(REPOSITORY_ROOT, ".github/workflows/e2e.yml"),
      ]),
    ).resolves.toEqual([]);
  });
});
