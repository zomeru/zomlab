import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "../auth";

export const notes = pgTable(
  "notes",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    authorId: varchar("author_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    authorIdIdx: index("notes_author_id_idx").on(table.authorId),
  }),
);

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, {
    fields: [notes.authorId],
    references: [users.id],
  }),
}));

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type SerializedNote = Omit<Note, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
export type NoteDto = Omit<SerializedNote, "authorId">;
