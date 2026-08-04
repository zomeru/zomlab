import { t } from "elysia";
import { NotFoundError } from "../../../errors";

const noteObject = t.Object({
  id: t.String(),
  title: t.String(),
  content: t.Nullable(t.String()),
  authorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const NoteModel = {
  noteResponse: noteObject,
  noteListResponse: t.Array(noteObject),
  createNoteBody: t.Object({
    title: t.String({ minLength: 1, maxLength: 200 }),
    content: t.Optional(t.String({ maxLength: 10_000 })),
  }),
  updateNoteBody: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
    content: t.Optional(t.String({ maxLength: 10_000 })),
  }),
  noteParams: t.Object({
    id: t.String({ minLength: 1 }),
  }),
  deleteResponse: t.Object({
    success: t.Boolean(),
  }),
} as const;

export type CreateNoteInput = typeof NoteModel.createNoteBody.static;
export type UpdateNoteInput = typeof NoteModel.updateNoteBody.static;

export class NoteNotFoundError extends NotFoundError {
  constructor() {
    super("Note not found", "NOTE_NOT_FOUND");
  }
}
