import { describe, expect, it, vi } from "vitest";

import { runSetup } from "./setup.js";

describe("runSetup", () => {
  it("installs with pnpm before generating the Prisma client", async () => {
    const runCommand = vi
      .fn<(command: string, args: readonly string[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await runSetup({
      copyEnvironment: () => undefined,
      environmentExists: () => true,
      exampleExists: () => true,
      runCommand,
      write: () => undefined,
    });

    expect(runCommand).toHaveBeenNthCalledWith(1, "pnpm", ["install"]);
    expect(runCommand).toHaveBeenNthCalledWith(2, "pnpm", ["db:generate"]);
  });

  it("fails fast when a command fails", async () => {
    const failure = new Error("install failed");
    const runCommand = vi
      .fn<(command: string, args: readonly string[]) => Promise<void>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValue(undefined);

    await expect(
      runSetup({
        copyEnvironment: () => undefined,
        environmentExists: () => true,
        exampleExists: () => true,
        runCommand,
        write: () => undefined,
      }),
    ).rejects.toThrow(failure);

    expect(runCommand).toHaveBeenCalledTimes(1);
  });

  it("copies the example environment only when .env is missing", async () => {
    const copyEnvironment = vi.fn();

    await runSetup({
      copyEnvironment,
      environmentExists: () => false,
      exampleExists: () => true,
      runCommand: async () => undefined,
      write: () => undefined,
    });

    expect(copyEnvironment).toHaveBeenCalledOnce();
  });
});
