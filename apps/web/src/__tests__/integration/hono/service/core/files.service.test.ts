import type { UploadedFile } from "@zomlab/contracts";
import { describe, expect, it } from "vitest";
import { createFileService } from "~/integration/hono/service/core/files.service";
import type { FileRepository } from "~/integration/hono/storage/core/files.repository";

const uploadedFile: UploadedFile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "service-boundary.txt",
  type: "text/plain",
  size: 16,
  createdAt: "2026-08-13T00:00:00.000Z",
};

function createRepositoryFake(): FileRepository {
  return {
    async list() {
      return [uploadedFile];
    },
    async put() {
      return uploadedFile;
    },
    async get() {
      return null;
    },
    async delete() {
      return false;
    },
    toUploadedFile() {
      return uploadedFile;
    },
  };
}

describe("FileService", () => {
  it("returns a list total from the injected repository", async () => {
    const service = createFileService(createRepositoryFake());

    await expect(service.list("user-1")).resolves.toEqual({ items: [uploadedFile], total: 1 });
  });

  it("delegates uploads to the injected repository", async () => {
    const repository = createRepositoryFake();
    const calls: Array<[string, string, File]> = [];
    repository.put = async (...args) => {
      calls.push(args);
      return uploadedFile;
    };
    const service = createFileService(repository);
    const file = new File(["service boundary"], uploadedFile.name, { type: uploadedFile.type });

    await expect(service.upload("user-1", file)).resolves.toEqual(uploadedFile);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe("user-1");
    expect(calls[0]?.[1]).toEqual(expect.any(String));
    expect(calls[0]?.[2]).toBe(file);
  });

  it("returns null for missing downloads and deletes", async () => {
    const service = createFileService(createRepositoryFake());

    await expect(service.download("user-1", uploadedFile.id)).resolves.toBeNull();
    await expect(service.delete("user-1", uploadedFile.id)).resolves.toBeNull();
  });
});
