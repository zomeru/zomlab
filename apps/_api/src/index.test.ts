import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const apiDirectory = resolve(sourceDirectory, "..");
const rootDirectory = resolve(apiDirectory, "../..");
const entrypoint = resolve(sourceDirectory, "index.ts");
const builtEntrypoint = resolve(apiDirectory, "dist/index.cjs");
const appModule = resolve(sourceDirectory, "app.ts");

const runningProcesses = new Set<ChildProcess>();

function getAvailablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Could not allocate an ephemeral port"));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolvePort(address.port);
      });
    });
  });
}

function spawnStandaloneServer(port: number): ChildProcess {
  const child = spawn(process.execPath, ["--env-file=.env", "--import", "tsx", entrypoint], {
    cwd: rootDirectory,
    env: {
      ...process.env,
      API_PORT: String(port),
    },
    stdio: "pipe",
  });

  runningProcesses.add(child);
  return child;
}

function spawnBuiltStandaloneServer(port: number): ChildProcess {
  const child = spawn(process.execPath, ["--env-file=.env", builtEntrypoint], {
    cwd: rootDirectory,
    env: {
      ...process.env,
      API_PORT: String(port),
    },
    stdio: "pipe",
  });

  runningProcesses.add(child);
  return child;
}

async function waitForHealth(port: number): Promise<Response> {
  const healthUrl = `http://127.0.0.1:${port}/health`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  throw new Error(`Standalone API did not become ready: ${String(lastError)}`);
}

async function stopProcess(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) {
    runningProcesses.delete(child);
    return child.exitCode;
  }

  child.kill("SIGTERM");
  const [exitCode] = await once(child, "exit");
  runningProcesses.delete(child);
  return exitCode as number | null;
}

afterEach(async () => {
  await Promise.all([...runningProcesses].map(stopProcess));
});

describe("standalone Node API", () => {
  it("runs the built Node artifact", async () => {
    execFileSync("pnpm", ["--filter", "@zomlab/legacy-api", "build"], {
      cwd: rootDirectory,
      stdio: "pipe",
    });

    const port = await getAvailablePort();
    const child = spawnBuiltStandaloneServer(port);
    const health = await waitForHealth(port);

    expect(await health.json()).toMatchObject({ status: "ok" });
    expect(await stopProcess(child)).toBe(0);
  });

  it("serves the health and missing-route contracts", async () => {
    const port = await getAvailablePort();
    const child = spawnStandaloneServer(port);

    const health = await waitForHealth(port);
    expect(await health.json()).toMatchObject({ status: "ok" });

    const missingRoute = await fetch(`http://127.0.0.1:${port}/missing-route`);
    expect(missingRoute.status).toBe(404);
    expect(await missingRoute.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route /missing-route does not exist",
      },
    });

    expect(await stopProcess(child)).toBe(0);
  });

  it("does not start a listener when importing the shared app", async () => {
    const child = spawn(
      process.execPath,
      ["--env-file=.env", "--import", "tsx", "--eval", `import(${JSON.stringify(appModule)})`],
      { cwd: rootDirectory, env: process.env, stdio: "pipe" },
    );

    const [exitCode] = await once(child, "exit");
    expect(exitCode).toBe(0);
  });

  it("closes the standalone listener after SIGTERM", async () => {
    const port = await getAvailablePort();
    const child = spawnStandaloneServer(port);

    await waitForHealth(port);
    await stopProcess(child);

    await expect(fetch(`http://127.0.0.1:${port}/health`)).rejects.toThrow();
  });
});
