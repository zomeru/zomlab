import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createFileRepository } from "./files.repository";

describe("FileRepository in workerd", () => {
  it("round-trips a private R2 object and isolates user prefixes", async () => {
    const repository = createFileRepository(env.FILE_UPLOADS);
    const file = new File(["Core worker test"], "worker.txt", { type: "text/plain" });
    const fileId = "00000000-0000-4000-8000-000000000001";

    const uploaded = await repository.put("user-a", fileId, file);

    expect(uploaded).toMatchObject({
      id: fileId,
      name: "worker.txt",
      size: file.size,
      type: "text/plain",
    });
    expect(await repository.list("user-b")).toEqual([]);
    expect(await repository.list("user-a")).toEqual([uploaded]);

    const stored = await repository.get("user-a", fileId);
    expect(stored).not.toBeNull();
    expect(await stored?.text()).toBe("Core worker test");

    expect(await repository.delete("user-a", fileId)).toBe(true);
    expect(await repository.delete("user-a", fileId)).toBe(false);
  });
});
