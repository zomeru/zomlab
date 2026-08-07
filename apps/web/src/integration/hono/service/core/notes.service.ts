import { createNoteRepository } from "@zomlab/database";
import type { CreateNoteBody, Note, UpdateNoteBody } from "@zomlab/contracts";

export interface NoteService {
  getById(userId: string, id: string): Promise<Note>;
  listByAuthor(userId: string): Promise<Note[]>;
  create(userId: string, data: CreateNoteBody): Promise<Note>;
  update(userId: string, id: string, data: UpdateNoteBody): Promise<Note>;
  delete(userId: string, id: string): Promise<{ success: boolean }>;
}

function serializeNote(note: {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    authorId: note.authorId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function createNoteService(): NoteService {
  const repository = createNoteRepository();

  return {
    async getById(userId: string, id: string) {
      const note = await repository.findByAuthorAndId(userId, id);
      if (!note) {
        throw new Error("Note not found");
      }
      return serializeNote(note);
    },

    async listByAuthor(userId: string) {
      const notes = await repository.findByAuthor(userId);
      return notes.map(serializeNote);
    },

    async create(userId: string, data: CreateNoteBody) {
      const id = crypto.randomUUID();
      const note = await repository.create({
        id,
        title: data.title,
        content: data.content ?? null,
        authorId: userId,
      });
      return serializeNote(note);
    },

    async update(userId: string, id: string, data: UpdateNoteBody) {
      const note = await repository.update(id, userId, {
        title: data.title,
        content: data.content ?? null,
      });
      if (!note) {
        throw new Error("Note not found");
      }
      return serializeNote(note);
    },

    async delete(userId: string, id: string) {
      const success = await repository.delete(id, userId);
      if (!success) {
        throw new Error("Note not found");
      }
      return { success };
    },
  };
}
