import type {
  CreateNoteBody,
  DeleteNoteResponse,
  Note,
  NoteListQuery,
  NoteListResponse,
  UpdateNoteBody,
} from "@zomlab/contracts";
import type { NoteRepository } from "@zomlab/database";

export interface NoteService {
  getById(userId: string, id: string): Promise<Note | null>;
  listByAuthor(userId: string, query?: NoteListQuery): Promise<NoteListResponse>;
  create(userId: string, data: CreateNoteBody): Promise<Note>;
  update(userId: string, id: string, data: UpdateNoteBody): Promise<Note | null>;
  delete(userId: string, id: string): Promise<DeleteNoteResponse | null>;
}

export function createNoteService(repository: NoteRepository): NoteService {
  return {
    async getById(userId: string, id: string) {
      return (await repository.findByAuthorAndId(userId, id)) ?? null;
    },

    async listByAuthor(userId: string, query?: NoteListQuery) {
      const page = query?.page ?? 1;
      const pageSize = query?.pageSize ?? 20;
      const result = await repository.findByAuthor(userId, {
        query: query?.query,
        page,
        pageSize,
        sortBy: query?.sortBy,
        sortDirection: query?.sortDirection,
      });

      return {
        ...result,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(result.total / pageSize)),
      };
    },

    async create(userId: string, data: CreateNoteBody) {
      const id = crypto.randomUUID();
      const note = await repository.create({
        id,
        title: data.title,
        content: data.content ?? null,
        authorId: userId,
      });
      return note;
    },

    async update(userId: string, id: string, data: UpdateNoteBody) {
      return (
        (await repository.update(id, userId, {
          title: data.title,
          content: data.content ?? null,
        })) ?? null
      );
    },

    async delete(userId: string, id: string) {
      const success = await repository.delete(id, userId);
      return success ? { success } : null;
    },
  };
}
