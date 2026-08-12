import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export async function runZizmor(files: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const zizmor = spawn("zizmor", files, { stdio: "inherit" });

    zizmor.once("error", (error: Error & { code?: string }) => {
      if (error.code === "ENOENT") {
        reject(new Error("zizmor is not installed. Run: uv tool install zizmor==1.29.0"));
        return;
      }

      reject(error);
    });
    zizmor.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `zizmor failed with ${signal === null ? `exit code ${code}` : `signal ${signal}`}`,
        ),
      );
    });
  });
}

async function main(files: string[]): Promise<void> {
  if (files.length === 0) {
    throw new Error("Usage: pnpm exec tsx scripts/zizmor.ts <workflow> [...workflow]");
  }

  await runZizmor(files);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
