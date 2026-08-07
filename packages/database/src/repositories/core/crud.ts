import { and, desc, eq } from "drizzle-orm";
import { db } from "../../client";
import { type Note, notes } from "../../db/schema/core/index";

export function createNoteRepository() {
  return {
    async findByAuthor(authorId: string): Promise<Note[]> {
      return db
        .select()
        .from(notes)
        .where(eq(notes.authorId, authorId))
        .orderBy(desc(notes.createdAt));
    },

    async findById(id: string): Promise<Note | undefined> {
      const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
      return rows[0];
    },

    async findByAuthorAndId(authorId: string, id: string): Promise<Note | undefined> {
      const rows = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
        .limit(1);
      return rows[0];
    },

    async create(data: {
      id: string;
      title: string;
      content?: string | null;
      authorId: string;
    }): Promise<Note> {
      const rows = await db.insert(notes).values(data).returning();

      return rows[0] as Note;
    },

    async update(
      id: string,
      authorId: string,
      data: { title?: string; content?: string | null },
    ): Promise<Note | undefined> {
      const rows = await db
        .update(notes)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
        .returning();
      return rows[0];
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
