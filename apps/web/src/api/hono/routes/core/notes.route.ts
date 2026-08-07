import { Hono } from "hono";
import { requireAuth } from "~/api/hono/middleware/auth.middleware";
import type { NoteService } from "~/api/hono/service/core/notes.service";
import type { HonoEnv } from "~/api/hono/types";

export function createNotesRouter() {
  const app = new Hono<HonoEnv & { noteService: NoteService }>();

  app.use("*", requireAuth);

  app.get("/notes", async (c) => {
    const user = c.var.user;
  });
}
