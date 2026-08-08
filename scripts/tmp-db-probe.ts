// @ts-nocheck

import { createNoteRepository } from "../../packages/database/src/repositories/core/crud";

async function main() {
  const repo = createNoteRepository();
  try {
    const notes = await repo.findByAuthor("does-not-exist");
    console.log("OK, notes length:", notes.length);
  } catch (err) {
    console.error("REPO ERROR:", err instanceof Error ? err.message : err);
    console.error((err as Error)?.stack);
    process.exitCode = 1;
  }
}

main();
