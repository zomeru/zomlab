import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  createNoteBodySchema,
  deleteNoteResponseSchema,
  noteListResponseSchema,
  noteParamsSchema,
  noteSchema,
  updateNoteBodySchema,
} from "@zomlab/contracts";
import { NoteNotFoundError } from "~/integration/hono/errors/api-error";
import { apiErrorHandler } from "~/integration/hono/errors/error-handler";
import { requireAuth } from "~/integration/hono/middleware/auth.middleware";
import type { HonoEnv } from "~/integration/hono/types";

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
      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      try {
        const note = await noteService.getById(userId, id);
        return c.json(note, 200);
      } catch {
        throw new NoteNotFoundError();
      }
    },
  )
  .openapi(
    createRoute({
      method: "get",
      middleware: [requireAuth] as const,
      path: "/",
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
      const noteService = c.var.noteService;
      const notes = await noteService.listByAuthor(userId);
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
      const noteService = c.var.noteService;
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
      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      try {
        const note = await noteService.update(userId, id, data);
        return c.json(note, 200);
      } catch {
        throw new NoteNotFoundError();
      }
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
      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      try {
        const note = await noteService.delete(userId, id);
        return c.json(note);
      } catch {
        throw new NoteNotFoundError();
      }
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
