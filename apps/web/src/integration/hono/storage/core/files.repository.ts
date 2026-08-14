import { type UploadedFile, uploadedFileSchema } from "@zomlab/contracts";

function getPrefix(userId: string) {
  return `${userId}/`;
}

function getKey(userId: string, id: string) {
  return `${getPrefix(userId)}${id}`;
}

function toUploadedFile(object: R2Object): UploadedFile {
  const name = object.customMetadata?.name;
  const type = object.customMetadata?.type;

  if (!name || !type) {
    throw new Error(`Missing file metadata for ${object.key}`);
  }

  return uploadedFileSchema.parse({
    id: object.key.slice(object.key.lastIndexOf("/") + 1),
    name,
    type,
    size: object.size,
    createdAt: object.uploaded.toISOString(),
  });
}

export interface FileRepository {
  list(userId: string): Promise<UploadedFile[]>;
  put(userId: string, id: string, file: File): Promise<UploadedFile>;
  get(userId: string, id: string): Promise<R2ObjectBody | null>;
  delete(userId: string, id: string): Promise<boolean>;
  toUploadedFile(object: R2Object): UploadedFile;
}

export function createFileRepository(bucket: R2Bucket): FileRepository {
  return {
    async list(userId) {
      const objects: R2Object[] = [];
      let cursor: string | undefined;
      let truncated = true;

      while (truncated) {
        const result = await bucket.list({
          prefix: getPrefix(userId),
          cursor,
          include: ["customMetadata"],
        });
        objects.push(...result.objects);
        truncated = result.truncated;
        cursor = result.truncated ? result.cursor : undefined;
      }

      return objects
        .sort((left, right) => right.uploaded.getTime() - left.uploaded.getTime())
        .map(toUploadedFile);
    },

    async put(userId, id, file) {
      const object = await bucket.put(getKey(userId, id), await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          name: file.name,
          type: file.type,
        },
      });

      if (!object) {
        throw new Error("R2 did not return the uploaded object");
      }

      return toUploadedFile(object);
    },

    get(userId, id) {
      return bucket.get(getKey(userId, id));
    },

    async delete(userId, id) {
      const key = getKey(userId, id);
      const object = await bucket.head(key);
      if (!object) return false;

      await bucket.delete(key);
      return true;
    },

    toUploadedFile,
  };
}
