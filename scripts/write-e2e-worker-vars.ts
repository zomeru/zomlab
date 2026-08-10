import { writeFile } from "node:fs/promises";

export type WriteE2eWorkerVarsOptions = {
  environment: NodeJS.ProcessEnv;
  outputPath: string;
};

const E2E_WORKER_DEFAULTS = {
  BETTER_AUTH_URL: "http://localhost:3100",
  BETTER_AUTH_ALLOWED_HOSTS: "localhost:3100",
  E2E_PORT: "3100",
} as const;

function quoteValue(value: string | undefined): string {
  return JSON.stringify(value ?? "");
}

export async function writeE2eWorkerVars({
  environment,
  outputPath,
}: WriteE2eWorkerVarsOptions): Promise<void> {
  const variables = {
    DATABASE_URL: environment.DATABASE_URL,
    BETTER_AUTH_SECRET: environment.BETTER_AUTH_SECRET,
    BETTER_AUTH_GITHUB_CLIENT_ID: environment.BETTER_AUTH_GITHUB_CLIENT_ID,
    BETTER_AUTH_GITHUB_CLIENT_SECRET: environment.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    BETTER_AUTH_GOOGLE_CLIENT_ID: environment.BETTER_AUTH_GOOGLE_CLIENT_ID,
    BETTER_AUTH_GOOGLE_CLIENT_SECRET: environment.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    ...E2E_WORKER_DEFAULTS,
    APP_ENV: environment.APP_ENV,
  };
  const contents = `${Object.entries(variables)
    .map(([key, value]) => `${key}=${quoteValue(value)}`)
    .join("\n")}\n`;

  await writeFile(outputPath, contents);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeE2eWorkerVars({
    environment: process.env,
    outputPath: "apps/web/.dev.vars",
  }).catch((error: unknown) => {
    console.error(`Failed to write E2E Worker variables: ${String(error)}`);
    process.exitCode = 1;
  });
}
