import type { Note } from "@zomlab/database";
import { beforeEach, describe, expect, it } from "vitest";
import { NoteNotFoundError } from "./model";
import type { NoteRepository } from "./repository";
import { NoteService } from "./service";

const note = (id: string, authorId: string): Note => ({
  id,
  title: "Title",
  content: null,
  authorId,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function createFakeRepo(): NoteRepository & { notes: Note[] } {
  let notes: Note[] = [];
  return {
    notes,
    create: async (data) => {
      const n = note(String(notes.length + 1), data.authorId);
      n.title = data.title;
      n.content = data.content ?? null;
      notes = [n, ...notes];
      return n;
    },
    findById: async (id) => notes.find((n) => n.id === id) ?? null,
    findByAuthor: async (authorId) => notes.filter((n) => n.authorId === authorId),
    update: async (id, data) => {
      const idx = notes.findIndex((n) => n.id === id);
      const existing = notes[idx];
      if (!existing) throw new Error("not found");
      const updated = { ...existing, ...data, content: data.content ?? existing.content };
      notes[idx] = updated;
      return updated;
    },
    delete: async (id) => {
      notes = notes.filter((n) => n.id !== id);
    },
  };
}

describe("NoteService", () => {
  let repo: NoteRepository & { notes: Note[] };
  let service: NoteService;

  beforeEach(() => {
    repo = createFakeRepo();
    service = new NoteService(repo);
  });

  it("creates a note owned by the author", async () => {
    const created = await service.create("u1", { title: "Hello" });

    expect(created.authorId).toBe("u1");
    expect(created.title).toBe("Hello");
  });

  it("lists only the author's notes", async () => {
    await service.create("u1", { title: "Mine" });
    await service.create("u2", { title: "Theirs" });

    const mine = await service.listByAuthor("u1");

    expect(mine).toHaveLength(1);
    expect(mine[0]?.title).toBe("Mine");
  });

  it("throws NoteNotFoundError when a note does not exist", async () => {
    await expect(service.getOwned("u1", "nope")).rejects.toBeInstanceOf(NoteNotFoundError);
  });

  it("throws NoteNotFoundError when the note belongs to someone else", async () => {
    const created = await service.create("u1", { title: "Secret" });

    await expect(service.getOwned("u2", created.id)).rejects.toBeInstanceOf(NoteNotFoundError);
  });

  it("updates an owned note", async () => {
    const created = await service.create("u1", { title: "Before" });

    const updated = await service.update("u1", created.id, { title: "After" });

    expect(updated.title).toBe("After");
  });

  it("refuses to update someone else's note", async () => {
    const created = await service.create("u1", { title: "Mine" });

    await expect(service.update("u2", created.id, { title: "Hacked" })).rejects.toBeInstanceOf(
      NoteNotFoundError,
    );
  });

  it("deletes an owned note", async () => {
    const created = await service.create("u1", { title: "Gone" });

    await service.delete("u1", created.id);

    await expect(service.getOwned("u1", created.id)).rejects.toBeInstanceOf(NoteNotFoundError);
  });
});
