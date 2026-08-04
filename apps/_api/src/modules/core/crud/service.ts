import type { Note } from "@zomlab/database";
import type { CreateNoteInput, UpdateNoteInput } from "./model";
import { NoteNotFoundError } from "./model";
import type { NoteRepository } from "./repository";

export class NoteService {
  constructor(private readonly repository: NoteRepository) {}

  async listByAuthor(authorId: string): Promise<Note[]> {
    return this.repository.findByAuthor(authorId);
  }

  async create(authorId: string, input: CreateNoteInput): Promise<Note> {
    return this.repository.create({ ...input, authorId });
  }

  async getOwned(authorId: string, id: string): Promise<Note> {
    const note = await this.repository.findById(id);
    if (!note || note.authorId !== authorId) {
      throw new NoteNotFoundError();
    }
    return note;
  }

  async update(authorId: string, id: string, input: UpdateNoteInput): Promise<Note> {
    await this.getOwned(authorId, id);
    return this.repository.update(id, input);
  }

  async delete(authorId: string, id: string): Promise<void> {
    await this.getOwned(authorId, id);
    await this.repository.delete(id);
  }
}
