import { z } from "zod";

export const noteSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().max(300).nullable(),
  authorId: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const noteListResponseSchema = z.array(noteSchema);

export const createNoteBodySchema = z.strictObject({
  title: z.string().min(1).max(200),
  content: z.string().max(300).optional(),
});

export const updateNoteBodySchema = z.strictObject({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(300).optional(),
});

export const noteParamsSchema = z.strictObject({
  id: z.string().min(1),
});

export const deleteNoteResponseSchema = z.strictObject({
  success: z.boolean(),
});

export type Note = z.infer<typeof noteSchema>;
export type NoteListResponse = z.infer<typeof noteListResponseSchema>;
export type CreateNoteBody = z.infer<typeof createNoteBodySchema>;
export type UpdateNoteBody = z.infer<typeof updateNoteBodySchema>;
export type NoteParams = z.infer<typeof noteParamsSchema>;
export type DeleteNoteResponse = z.infer<typeof deleteNoteResponseSchema>;
