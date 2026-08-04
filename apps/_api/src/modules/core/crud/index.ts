import { Elysia } from "elysia";
import { authPlugin } from "../../../plugins/auth";
import { NoteModel } from "./model";
import { noteRepository } from "./repository";
import { NoteService } from "./service";

export const notes = new Elysia({ prefix: "/notes", tags: ["Notes"] })
  .use(authPlugin)
  .model(NoteModel)
  .prefix("model", "notes.")
  .get(
    "/",
    async ({ user }) => {
      const service = new NoteService(noteRepository);
      return service.listByAuthor(user.id);
    },
    { auth: true, response: "notes.NoteListResponse" },
  )
  .post(
    "/",
    async ({ user, body }) => {
      const service = new NoteService(noteRepository);
      return service.create(user.id, body);
    },
    { auth: true, body: "notes.CreateNoteBody", response: "notes.NoteResponse" },
  )
  .get(
    "/:id",
    async ({ user, params }) => {
      const service = new NoteService(noteRepository);
      return service.getOwned(user.id, params.id);
    },
    { auth: true, params: "notes.NoteParams", response: "notes.NoteResponse" },
  )
  .patch(
    "/:id",
    async ({ user, params, body }) => {
      const service = new NoteService(noteRepository);
      return service.update(user.id, params.id, body);
    },
    {
      auth: true,
      params: "notes.NoteParams",
      body: "notes.UpdateNoteBody",
      response: "notes.NoteResponse",
    },
  )
  .delete(
    "/:id",
    async ({ user, params }) => {
      const service = new NoteService(noteRepository);
      await service.delete(user.id, params.id);
      return { success: true };
    },
    { auth: true, params: "notes.NoteParams", response: "notes.DeleteResponse" },
  );
