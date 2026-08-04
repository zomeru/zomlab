import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPOSITORY_ROOT = process.cwd();
const APPROVED_MIGRATION_HISTORY = new Set([
  "docs/plans/stack-migration/00-migration-design.md",
  "docs/plans/stack-migration/01-pnpm-package-manager.md",
]);
const PACKAGE_JSON_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;
const LEGACY_RUNTIME = ["b", "un"].join("");
const LEGACY_SETUP_PROVIDER = ["oven", "sh"].join("-");
const LEGACY_TOOLING_PATTERN = new RegExp(
  [
    `\\b${LEGACY_RUNTIME}\\b`,
    `${LEGACY_RUNTIME}x`,
    `${LEGACY_RUNTIME}\\.lock`,
    `setup-${LEGACY_RUNTIME}`,
    LEGACY_SETUP_PROVIDER,
    `${LEGACY_RUNTIME}-types`,
    `from ["']${LEGACY_RUNTIME}["']`,
    `#!\\/usr\\/bin\\/env ${LEGACY_RUNTIME}`,
  ].join("|"),
  "i",
);
const FULL_GIT_SHA = /^[a-f0-9]{40}$/;

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function gitFiles(): string[] {
  const output = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd: REPOSITORY_ROOT,
    encoding: "buffer",
  });

  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((file) => !isExcluded(file));
}

function isExcluded(file: string): boolean {
  return (
    file.startsWith(".agents/") ||
    file.startsWith(".claude/") ||
    APPROVED_MIGRATION_HISTORY.has(file) ||
    isGeneratedArtifact(file)
  );
}

function isGeneratedArtifact(file: string): boolean {
  const generatedDirectory =
    /(^|\/)(?:\.next|coverage|dist|generated|playwright-report|test-results)(?:\/|$)/;
  const binaryExtension = /\.(?:gif|ico|jpeg|jpg|node|pdf|png|webp)$/i;

  return file === "pnpm-lock.yaml" || generatedDirectory.test(file) || binaryExtension.test(file);
}

function textFile(file: string): string | undefined {
  const contents = readFileSync(join(REPOSITORY_ROOT, file));

  return contents.includes(0) ? undefined : contents.toString("utf8");
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(REPOSITORY_ROOT, file), "utf8")) as T;
}

function packageManagerVersion(packageManager: string): string | undefined {
  const match = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageManager);

  return match?.[1];
}

function workspacePackageGlobs(workspace: string): string[] {
  const packagesBlock = /^packages:\s*\n((?:^[ \t]+.*(?:\n|$))*)/m.exec(workspace)?.[1] ?? "";

  return [...packagesBlock.matchAll(/^\s*-\s*["']?([^"'\s]+)["']?\s*$/gm)].map(([, glob]) => glob);
}

function uncommentedYamlLines(workflow: string): string[] {
  return workflow
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .map((line) => line.replace(/\s+#.*$/, ""));
}

function workflowStepBlocks(workflow: string): string[] {
  const steps: string[] = [];
  let currentStep: string[] | undefined;

  for (const line of uncommentedYamlLines(workflow)) {
    if (/^\s*-\s+(?:name|run|uses):/.test(line)) {
      if (currentStep !== undefined) {
        steps.push(currentStep.join("\n"));
      }

      currentStep = [line.replace(/^(\s*)-\s+/, "$1")];
      continue;
    }

    currentStep?.push(line);
  }

  if (currentStep !== undefined) {
    steps.push(currentStep.join("\n"));
  }

  return steps;
}

function isPnpmSetupStep(step: string): boolean {
  const action = /^\s*uses:\s*pnpm\/action-setup@([^\s#]+)\s*$/m.exec(step)?.[1];

  return action !== undefined && FULL_GIT_SHA.test(action);
}

function isNodePnpmCacheStep(step: string, nodeVersion: string): boolean {
  return (
    /^\s*uses:\s*actions\/setup-node@[^\s#]+\s*$/m.test(step) &&
    new RegExp(
      `^\\s*node-version:\\s*["']?${nodeVersion.replaceAll(".", "\\.")}["']?\\s*$`,
      "m",
    ).test(step) &&
    /^\s*cache:\s*["']?pnpm["']?\s*$/m.test(step) &&
    /^\s*cache-dependency-path:\s*["']?pnpm-lock\.yaml["']?\s*$/m.test(step)
  );
}

function hasFrozenPnpmInstall(step: string): boolean {
  const lines = step.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line === undefined) {
      continue;
    }

    const run = /^(\s*)run:\s*(.*)$/.exec(line);

    if (run === null) {
      continue;
    }

    const [, indentation, command] = run;

    if (command === "pnpm install --frozen-lockfile") {
      return true;
    }

    if (!/^[>|][-+]?$/.test(command)) {
      continue;
    }

    for (const commandLine of lines.slice(index + 1)) {
      if (commandLine.trim().length === 0) {
        continue;
      }

      if (commandLine.search(/\S/) <= indentation.length) {
        break;
      }

      if (commandLine.trim() === "pnpm install --frozen-lockfile") {
        return true;
      }
    }
  }

  return false;
}

function setupPnpmVersion(step: string): string | undefined {
  return /^\s*version:\s*["']?([^"'\s]+)["']?\s*$/m.exec(step)?.[1];
}

function hasRunCommand(step: string, command: RegExp): boolean {
  return step.split("\n").some((line) => /^\s*run:\s*/.test(line) && command.test(line));
}

describe("package-manager policy", () => {
  it("does not retain legacy runtime tooling outside approved history", () => {
    const matches = gitFiles().flatMap((file) => {
      const source = textFile(file);

      if (source === undefined) {
        return [];
      }

      return source
        .split("\n")
        .map((line, index) => ({ file, index, line }))
        .filter(({ line }) => LEGACY_TOOLING_PATTERN.test(line))
        .map(({ index, line }) => `${file}:${index + 1}:${line.trim()}`);
    });

    expect(matches).toEqual([]);
  });

  it("pins pnpm consistently in the root manifest", () => {
    const manifest = readJson<{
      devEngines?: { packageManager?: { name?: string; version?: string } };
      packageManager?: string;
    }>("package.json");
    const packageManager = manifest.packageManager ?? "";
    const version = packageManagerVersion(packageManager);

    expect(version).toBeDefined();
    expect(manifest.devEngines?.packageManager?.name).toBe("pnpm");
    expect(manifest.devEngines?.packageManager?.version).toBe(version);
  });

  it("defines only the application and package workspace globs", () => {
    const workspaceFile = join(REPOSITORY_ROOT, "pnpm-workspace.yaml");

    expect(existsSync(workspaceFile)).toBe(true);

    const workspace = readFileSync(workspaceFile, "utf8");

    expect(workspacePackageGlobs(workspace)).toEqual(["apps/*", "packages/*"]);
  });

  it("owns the dependency graph with the pnpm lockfile", () => {
    expect(existsSync(join(REPOSITORY_ROOT, "pnpm-lock.yaml"))).toBe(true);
    expect(existsSync(join(REPOSITORY_ROOT, `${LEGACY_RUNTIME}.lock`))).toBe(false);
  });

  it("uses workspace protocol for every internal package dependency", () => {
    const violations = gitFiles()
      .filter((file) => file.endsWith("package.json"))
      .flatMap((file) => {
        const manifest = readJson<PackageManifest>(file);

        return PACKAGE_JSON_FIELDS.flatMap((field) =>
          Object.entries(manifest[field] ?? {})
            .filter(([name, version]) => name.startsWith("@zomlab/") && version !== "workspace:*")
            .map(([name, version]) => `${file}:${field}.${name}=${version}`),
        );
      });

    expect(violations).toEqual([]);
  });

  it("runs the lockfile-pinned workflow linter from the CI workflow", () => {
    const manifest = readJson<{ scripts?: Record<string, string> }>("package.json");
    const workflow = textFile(".github/workflows/ci.yml") ?? "";

    expect(manifest.scripts?.["lint:workflows"]).toBe(
      "pnpm exec tsx scripts/actionlint.ts .github/workflows/ci.yml .github/workflows/e2e.yml",
    );
    expect(uncommentedYamlLines(workflow)).toContain("        run: pnpm run lint:workflows");
  });

  it("uses pnpm setup, Node caching, and frozen installs in every CI workflow", () => {
    const workflowFiles = gitFiles().filter(
      (file) => file.startsWith(".github/workflows/") && /\.ya?ml$/.test(file),
    );
    const forbiddenPackageManagerTooling = new RegExp(
      [
        `\\b${LEGACY_RUNTIME}(?:x)?\\b`,
        "\\bnpm\\b",
        "\\byarn\\b",
        `setup-${LEGACY_RUNTIME}`,
        "setup-(?:npm|yarn)",
        LEGACY_SETUP_PROVIDER,
      ].join("|"),
      "i",
    );

    expect(workflowFiles.length).toBeGreaterThan(0);

    const manifest = readJson<{ packageManager?: string }>("package.json");
    const pnpmVersion = packageManagerVersion(manifest.packageManager ?? "");
    const nodeVersion = readFileSync(join(REPOSITORY_ROOT, ".node-version"), "utf8").trim();

    expect(pnpmVersion).toBeDefined();
    expect(nodeVersion).toMatch(/^24\./);

    for (const file of workflowFiles) {
      const workflow = textFile(file) ?? "";
      const steps = workflowStepBlocks(workflow);
      const activeYaml = uncommentedYamlLines(workflow).join("\n");
      const pnpmSetupStep = steps.find(isPnpmSetupStep);
      const installIndex = steps.findIndex(hasFrozenPnpmInstall);
      const requiredCommandSteps = steps
        .map((step, index) => ({ step, index }))
        .filter(({ step }) =>
          hasRunCommand(step, /\b(?:db:(?:generate|push)|test|build|playwright)\b/),
        );

      expect(steps.some(isPnpmSetupStep), file).toBe(true);
      expect(setupPnpmVersion(pnpmSetupStep ?? ""), file).toBe(pnpmVersion);
      expect(
        steps.some((step) => isNodePnpmCacheStep(step, nodeVersion)),
        file,
      ).toBe(true);
      expect(steps.some(hasFrozenPnpmInstall), file).toBe(true);
      expect(installIndex, file).toBeGreaterThanOrEqual(0);
      expect(requiredCommandSteps.length, file).toBeGreaterThan(0);

      for (const { index } of requiredCommandSteps) {
        expect(installIndex, file).toBeLessThan(index);
      }

      for (const line of activeYaml
        .split("\n")
        .filter((entry) => /^\s*run:\s*.*\bturbo\b/.test(entry))) {
        expect(line, file).toMatch(/\bturbo run\b/);
      }

      expect(activeYaml, file).not.toMatch(forbiddenPackageManagerTooling);
    }
  });
});
