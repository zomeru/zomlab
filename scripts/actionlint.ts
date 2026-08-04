import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { createLinter, type LintResult } from "actionlint";

export async function lintWorkflowFiles(files: string[]): Promise<LintResult[]> {
  const lint = await createLinter();
  const results = await Promise.all(
    files.map(async (file) => lint(await readFile(file, "utf8"), file)),
  );

  return results.flat();
}

function printResult(result: LintResult): void {
  console.error(
    `${result.file}:${result.line}:${result.column}: ${result.message} [${result.kind}]`,
  );
}

async function main(files: string[]): Promise<void> {
  if (files.length === 0) {
    throw new Error("Usage: pnpm exec tsx scripts/actionlint.ts <workflow> [...workflow]");
  }

  const results = await lintWorkflowFiles(files);

  if (results.length === 0) {
    return;
  }

  for (const result of results) {
    printResult(result);
  }

  process.exitCode = 1;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
