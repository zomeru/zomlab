import { randomBytes } from "node:crypto";
import type { Note, NoteRepository } from "@zomlab/database";

function generateId(): string {
  return randomBytes(12).toString("hex");
}

export function createNoteService(repository: NoteRepository) {
  return {
    async listByAuthor(authorId: string): Promise<Note[]> {
      const notes = await repository.findByAuthor(authorId);
      return notes;
    },

    async getById(authorId: string, id: string): Promise<Note> {
      const note = await repository.findByAuthorAndId(authorId, id);
      if (!note) {
        throw new Error("NOTE_NOT_FOUND");
      }
      return note;
    },

    async create(
      authorId: string,
      data: { title: string; content?: string | null },
    ): Promise<Note> {
      const note = await repository.create({
        id: generateId(),
        title: data.title,
        content: data.content ?? null,
        authorId,
      });
      return note;
    },

    async update(
      authorId: string,
      id: string,
      data: { title?: string; content?: string | null },
    ): Promise<Note> {
      const note = await repository.update(id, authorId, data);
      if (!note) {
        throw new Error("NOTE_NOT_FOUND");
      }
      return note;
    },

    async delete(authorId: string, id: string): Promise<boolean> {
      return repository.delete(id, authorId);
    },
  };
}

export type NoteService = ReturnType<typeof createNoteService>;
