import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createFileRepository } from "./files.repository";
import { isolationFileId, isolationUserId } from "./files.repository.worker-fixtures";

describe("FileRepository in workerd", () => {
  it("round-trips a private R2 object and isolates user prefixes", async () => {
    const repository = createFileRepository(env.FILE_UPLOADS);
    const file = new File(["Core worker test"], "worker.txt", { type: "text/plain" });

    const uploaded = await repository.put(isolationUserId, isolationFileId, file);

    expect(uploaded).toMatchObject({
      id: isolationFileId,
      name: "worker.txt",
      size: file.size,
      type: "text/plain",
    });
    expect(await repository.list("user-b")).toEqual([]);
    expect(await repository.list(isolationUserId)).toEqual([uploaded]);

    const stored = await repository.get(isolationUserId, isolationFileId);
    expect(stored).not.toBeNull();
    expect(await stored?.text()).toBe("Core worker test");

    const deletableFileId = "00000000-0000-4000-8000-000000000002";
    await repository.put(isolationUserId, deletableFileId, file);
    expect(await repository.delete(isolationUserId, deletableFileId)).toBe(true);
    expect(await repository.delete(isolationUserId, deletableFileId)).toBe(false);
  });
});
