import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  deleteFileResponseSchema,
  FILE_UPLOAD_ACCEPTED_TYPES,
  FILE_UPLOAD_MAX_BYTES,
  fileListResponseSchema,
  fileParamsSchema,
  uploadedFileSchema,
} from "@zomlab/contracts";
import { FileNotFoundError } from "~/integration/hono/errors/api-error";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import { createFileService } from "~/integration/hono/service/core/files.service";
import { createFileRepository } from "~/integration/hono/storage/core/files.repository";
import type { HonoEnv } from "~/integration/hono/types";

const fileService = createFileService(createFileRepository(env.FILE_UPLOADS));

const uploadFileBodySchema = z.strictObject({
  file: z
    .instanceof(File, { message: "Choose a file to upload" })
    .refine((file: File) => file.name.length > 0 && file.name.length <= 180, {
      message: "File names must be between 1 and 180 characters",
    })
    .refine((file: File) => file.size > 0, { message: "Files cannot be empty" })
    .refine((file: File) => file.size <= FILE_UPLOAD_MAX_BYTES, {
      message: "Files must be 500 KB or smaller",
    })
    .refine(
      (file: File) => FILE_UPLOAD_ACCEPTED_TYPES.some((acceptedType) => acceptedType === file.type),
      { message: "Only PDF, JPEG, PNG, and plain text files are supported" },
    ),
});

const app = new OpenAPIHono<HonoEnv>({
  defaultHook: (result, c) => {
    if (!result.success) return apiErrorHandler(result.error, c);
  },
})
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      middleware: [requireAuth] as const,
      responses: {
        200: {
          description: "Authenticated user's files",
          content: { "application/json": { schema: fileListResponseSchema } },
        },
      },
    }),
    async (c) => c.json(await fileService.list(c.var.user.id)),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      middleware: [requireAuth] as const,
      request: {
        body: {
          content: {
            "multipart/form-data": { schema: uploadFileBodySchema },
          },
        },
      },
      responses: {
        201: {
          description: "File uploaded",
          content: { "application/json": { schema: uploadedFileSchema } },
        },
      },
    }),
    async (c) => {
      const { file } = c.req.valid("form");
      return c.json(await fileService.upload(c.var.user.id, file), 201);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      middleware: [requireAuth] as const,
      request: { params: fileParamsSchema },
      responses: {
        200: {
          description: "File download",
          content: {
            "application/octet-stream": {
              schema: z.string().openapi({ format: "binary" }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const download = await fileService.download(c.var.user.id, id);
      if (!download) throw new FileNotFoundError();

      return new Response(download.body, {
        headers: {
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(download.file.name)}`,
          "Content-Length": download.file.size.toString(),
          "Content-Type": download.file.type,
          ETag: download.etag,
        },
      });
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      middleware: [requireAuth] as const,
      request: { params: fileParamsSchema },
      responses: {
        200: {
          description: "File deleted",
          content: { "application/json": { schema: deleteFileResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const result = await fileService.delete(c.var.user.id, id);
      if (!result) throw new FileNotFoundError();
      return c.json(result);
    },
  )
  .doc31("/docs", {
    openapi: "3.1.0",
    info: { title: "Files", version: "1" },
  });

export default app;
