import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
  );
  temporaryDirectories.length = 0;
});

describe("writeE2eWorkerVars", () => {
  it("writes the E2E Worker variables to a dev-vars file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zomlab-e2e-vars-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, ".dev.vars");
    const module = await import("./write-e2e-worker-vars.js");
    const writeE2eWorkerVars = module.writeE2eWorkerVars;

    expect(writeE2eWorkerVars).toBeTypeOf("function");
    if (typeof writeE2eWorkerVars !== "function") {
      return;
    }

    await writeE2eWorkerVars({
      environment: {
        APP_ENV: "staging",
        BETTER_AUTH_GITHUB_CLIENT_ID: "github-client-id",
        BETTER_AUTH_GITHUB_CLIENT_SECRET: "github-client-secret",
        BETTER_AUTH_GOOGLE_CLIENT_ID: "google-client-id",
        BETTER_AUTH_GOOGLE_CLIENT_SECRET: "google-client-secret",
        BETTER_AUTH_SECRET: 'secret-with-"quotes"',
        DATABASE_URL: "postgresql://user:password@localhost:5432/zomlab",
      },
      outputPath,
    });

    await expect(readFile(outputPath, "utf8")).resolves.toBe(
      [
        'DATABASE_URL="postgresql://user:password@localhost:5432/zomlab"',
        'BETTER_AUTH_SECRET="secret-with-\\"quotes\\""',
        'BETTER_AUTH_GITHUB_CLIENT_ID="github-client-id"',
        'BETTER_AUTH_GITHUB_CLIENT_SECRET="github-client-secret"',
        'BETTER_AUTH_GOOGLE_CLIENT_ID="google-client-id"',
        'BETTER_AUTH_GOOGLE_CLIENT_SECRET="google-client-secret"',
        'BETTER_AUTH_URL="http://localhost:3100"',
        'BETTER_AUTH_ALLOWED_HOSTS="localhost:3100"',
        'E2E_PORT="3100"',
        'APP_ENV="staging"',
        "",
      ].join("\n"),
    );
  });
});
