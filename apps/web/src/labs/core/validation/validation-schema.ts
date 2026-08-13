import { z } from "zod";

export const validationNoteSchema = z.strictObject({
  content: z.string().trim().min(10, "Write at least 10 characters.").max(300),
  title: z.string().trim().min(1, "Enter a title.").max(200),
});
