import type { Note } from "@zomlab/contracts";
import type { NoteRepository } from "@zomlab/database";
import { describe, expect, it } from "vitest";
import { createNoteService } from "~/integration/hono/service/core/notes.service";

const note: Note = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Service boundary",
  content: "Repository-backed service",
  authorId: "user-1",
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
};

function createRepositoryFake(): NoteRepository {
  return {
    async findByAuthor() {
      return { items: [], total: 0 };
    },
    async findById() {
      return undefined;
    },
    async findByAuthorAndId() {
      return undefined;
    },
    async create() {
      return note;
    },
    async update() {
      return undefined;
    },
    async delete() {
      return false;
    },
  };
}

describe("NoteService", () => {
  it("returns null when a note is missing during reads or writes", async () => {
    const service = createNoteService(createRepositoryFake());

    await expect(service.getById("user-1", note.id)).resolves.toBeNull();
    await expect(service.update("user-1", note.id, { title: "Updated" })).resolves.toBeNull();
    await expect(service.delete("user-1", note.id)).resolves.toBeNull();
  });

  it("lets repository failures escape unchanged", async () => {
    const expected = new Error("database unavailable");
    const repository = createRepositoryFake();
    repository.findByAuthorAndId = async () => {
      throw expected;
    };
    const service = createNoteService(repository);

    await expect(service.getById("user-1", note.id)).rejects.toBe(expected);
  });
});
