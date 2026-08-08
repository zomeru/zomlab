import { createMiddleware } from "hono/factory";
import { createNoteService } from "~/integration/hono/service/core/notes.service";
import type { HonoEnv } from "~/integration/hono/types";

const noteService = createNoteService();

export const noteServiceMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  c.set("noteService", noteService);
  await next();
});
