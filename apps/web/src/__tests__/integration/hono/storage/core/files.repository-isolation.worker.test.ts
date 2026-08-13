import { env } from "cloudflare:workers";
import { expect, test } from "vitest";
import { createFileRepository } from "~/integration/hono/storage/core/files.repository";
import { isolationFileId, isolationUserId } from "./files.repository.worker-fixtures";

test("isolates R2 storage between worker test files", async () => {
  const repository = createFileRepository(env.FILE_UPLOADS);

  expect(await repository.get(isolationUserId, isolationFileId)).toBeNull();
  expect(await repository.list(isolationUserId)).toEqual([]);
});
