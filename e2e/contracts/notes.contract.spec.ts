import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { signUpThroughApi } from "../helpers/auth-session";

interface NoteContract {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteListContract {
  items: NoteContract[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

function expectIsoTimestamp(value: string) {
  expect(new Date(value).toISOString()).toBe(value);
}

function expectNoteContract(
  note: NoteContract,
  expected: { title: string; content: string | null },
) {
  expect(note).toEqual({
    id: expect.any(String),
    title: expected.title,
    content: expected.content,
    authorId: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });
  expectIsoTimestamp(note.createdAt);
  expectIsoTimestamp(note.updatedAt);
}

async function signUpContractUser(request: APIRequestContext, label: string, origin: string) {
  const email = `notes-contract-${label}-${randomUUID()}@test.local`;
  const response = await signUpThroughApi(
    request,
    {
      name: `Notes Contract ${label}`,
      email,
      password: "contract-password-123",
    },
    { Origin: origin },
  );

  expect(response.status()).toBe(200);
}

test("notes API preserves authentication, validation, ownership, and CRUD contracts", async ({
  baseURL,
  playwright,
  request,
}) => {
  const anonymousList = await request.get("/api/notes");
  expect(anonymousList.status()).toBe(401);
  expect(await anonymousList.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });

  const extraHTTPHeaders = { Origin: baseURL as string };
  const userA = await playwright.request.newContext({ baseURL, extraHTTPHeaders });
  const userB = await playwright.request.newContext({ baseURL, extraHTTPHeaders });

  try {
    await signUpContractUser(userA, "A", baseURL as string);
    await signUpContractUser(userB, "B", baseURL as string);

    const invalidCreate = await userA.post("/api/notes", {
      data: { title: "", content: "Invalid note" },
    });
    expect(invalidCreate.status()).toBe(422);
    const invalidBody = (await invalidCreate.json()) as {
      error: { code: string; detail: Array<{ path: string; message: string }> };
    };
    expect(invalidBody.error.code).toBe("VALIDATION");
    expect(invalidBody.error.detail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.any(String), message: expect.any(String) }),
      ]),
    );
    expect(invalidBody.error.detail.length).toBeGreaterThan(0);

    const create = await userA.post("/api/notes", {
      data: { title: "Contract note", content: "Original content" },
    });
    expect(create.status()).toBe(201);
    const created = (await create.json()) as NoteContract;
    expectNoteContract(created, { title: "Contract note", content: "Original content" });

    const searchable = await userA.post("/api/notes", {
      data: { title: "Roadmap", content: "Release checklist" },
    });
    expect(searchable.status()).toBe(201);
    const searchableNote = (await searchable.json()) as NoteContract;
    expectNoteContract(searchableNote, { title: "Roadmap", content: "Release checklist" });

    const search = await userA.get("/api/notes?query=checklist");
    expect(search.status()).toBe(200);
    expect(await search.json()).toEqual({
      items: [searchableNote],
      page: 1,
      pageCount: 1,
      pageSize: 20,
      total: 1,
    });

    const sorted = await userA.get("/api/notes?sortBy=title&sortDirection=asc&page=1&pageSize=20");
    expect(sorted.status()).toBe(200);
    const sortedBody = (await sorted.json()) as NoteListContract;
    expect(sortedBody.items.map((note) => note.title)).toEqual(["Contract note", "Roadmap"]);

    const invalidSort = await userA.get("/api/notes?sortBy=unknown");
    expect(invalidSort.status()).toBe(422);

    const invalidPage = await userA.get("/api/notes?page=0");
    expect(invalidPage.status()).toBe(422);

    const firstPage = await userA.get("/api/notes?page=1&pageSize=1");
    expect(firstPage.status()).toBe(200);
    const firstPageBody = (await firstPage.json()) as NoteListContract;
    expect(firstPageBody).toMatchObject({ page: 1, pageCount: 2, pageSize: 1, total: 2 });
    expect(firstPageBody.items).toHaveLength(1);

    const secondPage = await userA.get("/api/notes?page=2&pageSize=1");
    expect(secondPage.status()).toBe(200);
    const secondPageBody = (await secondPage.json()) as NoteListContract;
    expect(secondPageBody).toMatchObject({ page: 2, pageCount: 2, pageSize: 1, total: 2 });
    expect(secondPageBody.items).toHaveLength(1);
    expect(
      new Set([...firstPageBody.items, ...secondPageBody.items].map((note) => note.id)),
    ).toEqual(new Set([created.id, searchableNote.id]));

    const list = await userA.get("/api/notes");
    expect(list.status()).toBe(200);
    expect(list.headers()["cache-control"]).toContain("private");
    expect(list.headers()["cache-control"]).toContain("no-store");
    expect(list.headers().vary).toContain("Cookie");
    const listed = (await list.json()) as NoteListContract;
    expect(listed).toMatchObject({ page: 1, pageCount: 1, pageSize: 20, total: 2 });
    expect(listed.items).toHaveLength(2);
    expect(listed.items).toEqual(expect.arrayContaining([created, searchableNote]));
    expectNoteContract(created, {
      title: "Contract note",
      content: "Original content",
    });

    const get = await userA.get(`/api/notes/${created.id}`);
    expect(get.status()).toBe(200);
    const fetched = (await get.json()) as NoteContract;
    expect(fetched).toEqual(created);
    expectNoteContract(fetched, { title: "Contract note", content: "Original content" });

    const update = await userA.patch(`/api/notes/${created.id}`, {
      data: { title: "Updated contract note", content: "Updated content" },
    });
    expect(update.status()).toBe(200);
    const updated = (await update.json()) as NoteContract;
    expectNoteContract(updated, {
      title: "Updated contract note",
      content: "Updated content",
    });
    expect(updated.id).toBe(created.id);
    expect(updated.authorId).toBe(created.authorId);
    expect(updated.createdAt).toBe(created.createdAt);

    const otherUserGet = await userB.get(`/api/notes/${created.id}`);
    expect(otherUserGet.status()).toBe(404);
    expect(await otherUserGet.json()).toMatchObject({ error: { code: "NOTE_NOT_FOUND" } });

    const deleted = await userA.delete(`/api/notes/${created.id}`);
    const deletedBody = await deleted.json();
    expect(deleted.status(), JSON.stringify(deletedBody)).toBe(200);
    expect(deletedBody).toEqual({ success: true });

    const deletedGet = await userA.get(`/api/notes/${created.id}`);
    expect(deletedGet.status()).toBe(404);
    const deletedGetBody = await deletedGet.json();
    expect(deletedGetBody).toMatchObject({ error: { code: "NOTE_NOT_FOUND" } });
  } finally {
    await Promise.all([userA.dispose(), userB.dispose()]);
  }
});
