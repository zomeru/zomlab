import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  createNoteBodySchema,
  deleteNoteResponseSchema,
  noteListQuerySchema,
  noteListResponseSchema,
  noteParamsSchema,
  noteSchema,
  updateNoteBodySchema,
} from "@zomlab/contracts";
import { createNoteRepository } from "@zomlab/database";
import { NoteNotFoundError } from "~/integration/hono/errors/api-error";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import { createNoteService } from "~/integration/hono/service/core/notes.service";
import type { HonoEnv } from "~/integration/hono/types";

const noteService = createNoteService(createNoteRepository());

const app = new OpenAPIHono<HonoEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return apiErrorHandler(result.error, c);
    }
  },
})
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/{id}",
      request: {
        params: noteParamsSchema,
      },
      responses: {
        200: {
          description: "Note details",
          content: {
            "application/json": {
              schema: noteSchema,
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user.id;
      const { id } = c.req.valid("param");
      const note = await noteService.getById(userId, id);
      if (!note) throw new NoteNotFoundError();
      return c.json(note, 200);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/",
      request: {
        query: noteListQuerySchema,
      },
      responses: {
        200: {
          description: "List of notes",
          content: {
            "application/json": {
              schema: noteListResponseSchema,
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user.id;
      const query = c.req.valid("query");
      const notes = await noteService.listByAuthor(userId, query);
      return c.json(notes);
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      middleware: [requireAuth] as const,
      request: {
        body: {
          content: {
            "application/json": {
              schema: createNoteBodySchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Note created",
          content: {
            "application/json": {
              schema: noteSchema,
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user.id;
      const data = c.req.valid("json");
      const note = await noteService.create(userId, data);
      return c.json(note, 201);
    },
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/{id}",
      middleware: [requireAuth] as const,
      request: {
        params: noteParamsSchema,
        body: {
          content: {
            "application/json": {
              schema: updateNoteBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Note updated",
          content: {
            "application/json": {
              schema: noteSchema,
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user.id;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const note = await noteService.update(userId, id, data);
      if (!note) throw new NoteNotFoundError();
      return c.json(note, 200);
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      middleware: [requireAuth] as const,
      request: {
        params: noteParamsSchema,
      },
      responses: {
        200: {
          description: "Note deleted",
          content: {
            "application/json": {
              schema: deleteNoteResponseSchema,
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user.id;
      const { id } = c.req.valid("param");
      const note = await noteService.delete(userId, id);
      if (!note) throw new NoteNotFoundError();
      return c.json(note);
    },
  )
  .doc31("/docs", {
    openapi: "3.1.0",
    info: {
      title: "Notes",
      version: "1",
    },
  });

export default app;
