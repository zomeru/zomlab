import { z } from "zod";

export const FILE_UPLOAD_MAX_BYTES = 500 * 1024;

export const FILE_UPLOAD_ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
] as const;

export const uploadedFileSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1).max(180),
  type: z.enum(FILE_UPLOAD_ACCEPTED_TYPES),
  size: z.number().int().positive().max(FILE_UPLOAD_MAX_BYTES),
  createdAt: z.iso.datetime(),
});

export const fileListResponseSchema = z.strictObject({
  items: z.array(uploadedFileSchema),
  total: z.number().int().nonnegative(),
});

export const fileParamsSchema = z.strictObject({
  id: z.uuid(),
});

export const deleteFileResponseSchema = z.strictObject({
  success: z.literal(true),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;
export type FileListResponse = z.infer<typeof fileListResponseSchema>;
export type DeleteFileResponse = z.infer<typeof deleteFileResponseSchema>;
