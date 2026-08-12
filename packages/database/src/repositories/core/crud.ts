import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../client";
import { type Note, notes, type SerializedNote } from "../../db/schema/core";
import { serializeDates } from "../util";

export function createNoteRepository() {
  return {
    async findByAuthor(
      authorId: string,
      options: {
        query?: string;
        page: number;
        pageSize: number;
        sortBy?: "title" | "createdAt" | "updatedAt";
        sortDirection?: "asc" | "desc";
      },
    ): Promise<{ items: SerializedNote[]; total: number }> {
      const { query, page, pageSize, sortBy = "createdAt", sortDirection = "desc" } = options;
      const sortColumn = {
        createdAt: notes.createdAt,
        title: notes.title,
        updatedAt: notes.updatedAt,
      }[sortBy];
      const sort = sortDirection === "asc" ? asc : desc;
      const where = query
        ? and(
            eq(notes.authorId, authorId),
            or(ilike(notes.title, `%${query}%`), ilike(notes.content, `%${query}%`)),
          )
        : eq(notes.authorId, authorId);
      const [rows, totalRows] = await Promise.all([
        db
          .select()
          .from(notes)
          .where(where)
          .orderBy(sort(sortColumn), sort(notes.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db.select({ value: count() }).from(notes).where(where),
      ]);

      return {
        items: serializeDates<Note[]>(rows),
        total: totalRows[0]?.value ?? 0,
      };
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
