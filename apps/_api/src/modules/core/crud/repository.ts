import type { Note } from "@zomlab/database";
import { db } from "@zomlab/database";
import type { CreateNoteInput, UpdateNoteInput } from "./model";

export interface NoteRepository {
  create(data: CreateNoteInput & { authorId: string }): Promise<Note>;
  findById(id: string): Promise<Note | null>;
  findByAuthor(authorId: string): Promise<Note[]>;
  update(id: string, data: UpdateNoteInput): Promise<Note>;
  delete(id: string): Promise<void>;
}

export const noteRepository: NoteRepository = {
  create: (data) => db.note.create({ data }),
  findById: (id) => db.note.findUnique({ where: { id } }),
  findByAuthor: (authorId) =>
    db.note.findMany({ where: { authorId }, orderBy: { createdAt: "desc" } }),
  update: (id, data) => db.note.update({ where: { id }, data }),
  delete: (id) => db.note.delete({ where: { id } }).then(() => undefined),
};
