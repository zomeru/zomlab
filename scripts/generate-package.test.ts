import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { generatePackage } from "./generate-package.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("generatePackage", () => {
  it("creates workspace manifests and pnpm next steps", () => {
    const directory = mkdtempSync(join(tmpdir(), "zomlab-generate-package-"));
    temporaryDirectories.push(directory);
    const write = vi.fn();

    generatePackage({
      directory,
      name: "example-package",
      projectVersion: "1.2.3",
      typescriptVersion: "6.0.3",
      write,
    });

    const packageManifest = JSON.parse(
      readFileSync(join(directory, "packages/example-package/package.json"), "utf-8"),
    ) as { devDependencies: Record<string, string> };

    expect(packageManifest.devDependencies).toMatchObject({
      "@zomlab/tsconfig": "workspace:*",
      "@zomlab/vitest-config": "workspace:*",
    });
    expect(write).toHaveBeenCalledWith("  1. pnpm install        # link new workspace");
    expect(write).toHaveBeenCalledWith("  2. pnpm check:all  # verify everything works");
  });
});
