import { and, desc, eq } from "drizzle-orm";
import { db } from "../../client";
import { type Note, notes, type SerializedNote } from "../../db/schema/core";
import { serializeDates } from "../util";

export function createNoteRepository() {
  return {
    async findByAuthor(authorId: string): Promise<SerializedNote[]> {
      const _notes = await db
        .select()
        .from(notes)
        .where(eq(notes.authorId, authorId))
        .orderBy(desc(notes.createdAt));

      return serializeDates<Note[]>(_notes);
    },

    async findById(id: string): Promise<SerializedNote | undefined> {
      const [row] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);

      return row ? serializeDates<Note>(row) : undefined;
    },

    async findByAuthorAndId(authorId: string, id: string): Promise<SerializedNote | undefined> {
      const [row] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
        .limit(1);
      return row ? serializeDates<Note>(row) : undefined;
    },

    async create(data: {
      id: string;
      title: string;
      content?: string | null;
      authorId: string;
    }): Promise<SerializedNote> {
      const [row] = await db.insert(notes).values(data).returning();

      // biome-ignore lint/style/noNonNullAssertion: A successful INSERT ... RETURNING always returns the inserted row.
      return serializeDates<Note>(row!);
    },

    async update(
      id: string,
      authorId: string,
      data: { title?: string; content?: string | null },
    ): Promise<SerializedNote | undefined> {
      const [row] = await db
        .update(notes)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
        .returning();
      return row ? serializeDates<Note>(row) : undefined;
    },

    async delete(id: string, authorId: string): Promise<boolean> {
      const rows = await db
        .delete(notes)
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
        .returning({ id: notes.id });
      return rows.length > 0;
    },
  };
}

export type NoteRepository = ReturnType<typeof createNoteRepository>;
