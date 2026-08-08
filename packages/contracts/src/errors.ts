import { z } from "zod";

export const validationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    detail: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
