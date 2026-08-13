import type { DeleteFileResponse, FileListResponse, UploadedFile } from "@zomlab/contracts";
import type { FileRepository } from "~/integration/hono/storage/core/files.repository";

interface FileDownload {
  body: ReadableStream;
  etag: string;
  file: UploadedFile;
}

export interface FileService {
  list(userId: string): Promise<FileListResponse>;
  upload(userId: string, file: File): Promise<UploadedFile>;
  download(userId: string, id: string): Promise<FileDownload | null>;
  delete(userId: string, id: string): Promise<DeleteFileResponse | null>;
}

export function createFileService(repository: FileRepository): FileService {
  return {
    async list(userId) {
      const items = await repository.list(userId);
      return { items, total: items.length };
    },

    upload(userId, file) {
      return repository.put(userId, crypto.randomUUID(), file);
    },

    async download(userId, id) {
      const object = await repository.get(userId, id);
      if (!object) return null;

      return {
        body: object.body,
        etag: object.httpEtag,
        file: repository.toUploadedFile(object),
      };
    },

    async delete(userId, id) {
      const success = await repository.delete(userId, id);
      return success ? { success } : null;
    },
  };
}
