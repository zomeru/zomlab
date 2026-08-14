import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { signUpThroughApi } from "../helpers/auth-session";

interface FileContract {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

async function signUpFileUser(request: APIRequestContext, label: string, origin: string) {
  const response = await signUpThroughApi(
    request,
    {
      name: `Files Contract ${label}`,
      email: `files-contract-${label}-${randomUUID()}@test.local`,
      password: "contract-password-123",
    },
    { Origin: origin },
  );

  expect(response.status()).toBe(200);
}

test("files API preserves authentication, validation, ownership, and lifecycle contracts", async ({
  baseURL,
  playwright,
  request,
}) => {
  const anonymousList = await request.get("/api/files");
  expect(anonymousList.status()).toBe(401);

  const extraHTTPHeaders = { Origin: baseURL as string };
  const userA = await playwright.request.newContext({ baseURL, extraHTTPHeaders });
  const userB = await playwright.request.newContext({ baseURL, extraHTTPHeaders });

  try {
    await signUpFileUser(userA, "A", baseURL as string);
    await signUpFileUser(userB, "B", baseURL as string);

    const invalidUpload = await userA.post("/api/files", {
      multipart: {
        file: { name: "script.js", mimeType: "application/javascript", buffer: Buffer.from("x") },
      },
    });
    expect(invalidUpload.status()).toBe(422);
    expect(await invalidUpload.json()).toMatchObject({ error: { code: "VALIDATION" } });

    const oversizedUpload = await userA.post("/api/files", {
      multipart: {
        file: {
          name: "too-large.txt",
          mimeType: "text/plain",
          buffer: Buffer.alloc(500 * 1024 + 1, "x"),
        },
      },
    });
    expect(oversizedUpload.status()).toBe(422);
    expect(await oversizedUpload.json()).toMatchObject({
      error: {
        code: "VALIDATION",
        detail: [
          {
            message: "Files must be 500 KB or smaller",
            path: "file",
          },
        ],
      },
    });

    const maximumUpload = await userA.post("/api/files", {
      multipart: {
        file: {
          name: "maximum-size.txt",
          mimeType: "text/plain",
          buffer: Buffer.alloc(500 * 1024, "x"),
        },
      },
    });
    expect(maximumUpload.status()).toBe(201);
    const maximumFile = (await maximumUpload.json()) as FileContract;
    expect(maximumFile.size).toBe(500 * 1024);
    expect((await userA.delete(`/api/files/${maximumFile.id}`)).status()).toBe(200);

    const upload = await userA.post("/api/files", {
      multipart: {
        file: {
          name: "release-notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Ready to ship"),
        },
      },
    });
    expect(upload.status()).toBe(201);
    const created = (await upload.json()) as FileContract;
    expect(created).toEqual({
      id: expect.any(String),
      name: "release-notes.txt",
      type: "text/plain",
      size: 13,
      createdAt: expect.any(String),
    });
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);

    const list = await userA.get("/api/files");
    expect(list.status()).toBe(200);
    expect(list.headers()["cache-control"]).toContain("private");
    expect(list.headers().vary).toContain("Cookie");
    expect(await list.json()).toEqual({ items: [created], total: 1 });

    const otherUserList = await userB.get("/api/files");
    expect(otherUserList.status()).toBe(200);
    expect(await otherUserList.json()).toEqual({ items: [], total: 0 });

    const download = await userA.get(`/api/files/${created.id}`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toContain("text/plain");
    expect(download.headers()["content-disposition"]).toContain("release-notes.txt");
    expect(await download.text()).toBe("Ready to ship");

    const otherUserDownload = await userB.get(`/api/files/${created.id}`);
    expect(otherUserDownload.status()).toBe(404);
    expect(await otherUserDownload.json()).toMatchObject({ error: { code: "FILE_NOT_FOUND" } });

    const otherUserDelete = await userB.delete(`/api/files/${created.id}`);
    expect(otherUserDelete.status()).toBe(404);

    const deleted = await userA.delete(`/api/files/${created.id}`);
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toEqual({ success: true });

    const deletedDownload = await userA.get(`/api/files/${created.id}`);
    expect(deletedDownload.status()).toBe(404);
  } finally {
    await Promise.all([userA.dispose(), userB.dispose()]);
  }
});
