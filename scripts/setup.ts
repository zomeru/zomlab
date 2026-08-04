import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

type CommandRunner = (command: string, args: readonly string[]) => Promise<void>;

export type SetupOptions = {
  copyEnvironment: () => void;
  environmentExists: () => boolean;
  exampleExists: () => boolean;
  runCommand: CommandRunner;
  write: (message: string) => void;
};

function runCommand(command: string, args: readonly string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}.`));
    });
  });
}

export async function runSetup(options: SetupOptions): Promise<void> {
  const steps: { label: string; run: () => Promise<void> }[] = [
    {
      label: "Installing dependencies",
      run: () => options.runCommand("pnpm", ["install"]),
    },
    {
      label: "Setting up environment variables",
      run: async () => {
        if (options.environmentExists()) {
          options.write("  .env already exists, skipping.");
          return;
        }
        if (!options.exampleExists()) {
          options.write("  No .env.example found, skipping.");
          return;
        }
        options.copyEnvironment();
        options.write("  Created .env from .env.example.");
      },
    },
    {
      label: "Generating Prisma client",
      run: () => options.runCommand("pnpm", ["db:generate"]),
    },
  ];

  options.write("Setting up ZomLab...\n");

  for (const step of steps) {
    try {
      await step.run();
      options.write(`${step.label}... ✓`);
    } catch (error) {
      options.write(`${step.label}... ✗`);
      throw error;
    }
  }

  options.write("\n✓ Setup complete. Run \x1b[1mpnpm dev\x1b[22m to start.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup({
    copyEnvironment: () => copyFileSync(".env.example", ".env"),
    environmentExists: () => existsSync(".env"),
    exampleExists: () => existsSync(".env.example"),
    runCommand,
    write: (message) => console.log(message),
  }).catch((error: unknown) => {
    console.error(`  Failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
