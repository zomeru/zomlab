#!/usr/bin/env bun
import { copyFileSync, existsSync } from "node:fs";
import { $ } from "bun";

const steps: { label: string; run: () => Promise<unknown> }[] = [];

steps.push({
  label: "Installing dependencies",
  run: () => $`bun install`,
});

steps.push({
  label: "Setting up environment variables",
  run: async () => {
    if (existsSync(".env")) {
      console.log("  .env already exists, skipping.");
      return;
    }
    if (!existsSync(".env.example")) {
      console.log("  No .env.example found, skipping.");
      return;
    }
    copyFileSync(".env.example", ".env");
    console.log("  Created .env from .env.example.");
  },
});

steps.push({
  label: "Generating Prisma client",
  run: () => $`bun run db:generate`,
});

console.log("Setting up ZomLab...\n");

for (const step of steps) {
  process.stdout.write(`${step.label}... `);
  try {
    await step.run();
    console.log("✓");
  } catch (error) {
    console.log("✗");
    console.error(`  Failed: ${error}`);
    process.exit(1);
  }
}

console.log("\n✓ Setup complete. Run \x1b[1mbun run dev\x1b[22m to start.");
