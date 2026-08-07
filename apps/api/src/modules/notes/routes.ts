import { zValidator } from "@hono/zod-validator";
import { createNoteBodySchema, noteParamsSchema, updateNoteBodySchema } from "@zomlab/contracts";
import { Hono } from "hono";
import { NoteNotFoundError } from "../../errors/api-error";
import { createZodErrorEnvelope } from "../../errors/error-handler";
import type { AuthVariables } from "../../middleware/auth";
import type { NoteService } from "./service";

export function createNotesRouter() {
  const app = new Hono<{
    Variables: AuthVariables & { noteService: NoteService };
  }>();

  app.get("/api/notes", async (c) => {
    const user = c.var.user;
    if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

    const noteService = c.var.noteService;
    const notes = await noteService.listByAuthor(user.id);
    return c.json(notes);
  });

  app.post(
    "/api/notes",
    zValidator("json", createNoteBodySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "VALIDATION",
              message: "Validation failed",
              detail: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    }),
    async (c) => {
      const user = c.var.user;
      if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

      const noteService = c.var.noteService;
      const data = c.req.valid("json");
      const note = await noteService.create(user.id, data);
      return c.json(note, 201);
    },
  );

  app.get(
    "/api/notes/:id",
    zValidator("param", noteParamsSchema, (result, c) => {
      if (!result.success) {
        return createZodErrorEnvelope(result.error, c);
      }
    }),
    async (c) => {
      const user = c.var.user;
      if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      try {
        const note = await noteService.getById(user.id, id);
        return c.json(note);
      } catch {
        throw new NoteNotFoundError();
      }
    },
  );

  app.patch(
    "/api/notes/:id",
    zValidator("param", noteParamsSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "VALIDATION",
              message: "Validation failed",
              detail: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    }),
    zValidator("json", updateNoteBodySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "VALIDATION",
              message: "Validation failed",
              detail: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    }),
    async (c) => {
      const user = c.var.user;
      if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      try {
        const note = await noteService.update(user.id, id, data);
        return c.json(note);
      } catch {
        throw new NoteNotFoundError();
      }
    },
  );

  app.delete(
    "/api/notes/:id",
    zValidator("param", noteParamsSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "VALIDATION",
              message: "Validation failed",
              detail: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    }),
    async (c) => {
      const user = c.var.user;
      if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

      const noteService = c.var.noteService;
      const { id } = c.req.valid("param");
      const deleted = await noteService.delete(user.id, id);
      if (!deleted) {
        throw new NoteNotFoundError();
      }
      return c.json({ success: true });
    },
  );

  return app;
}
