import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../errors";
import { errorPlugin } from "../../../plugins/error";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@zomlab/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSessionMock(...args) } },
}));

const dbMock = vi.hoisted(() => ({
  note: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@zomlab/database", () => ({ db: dbMock }));

import { notes } from "./index";

function testApp() {
  return new Elysia().use(errorPlugin).use(notes);
}

const validSession = {
  session: { id: "s1" },
  user: { id: "u1", email: "a@b.com" },
};

const noteRow = {
  id: "n1",
  title: "Hello",
  content: null,
  authorId: "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("notes routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue(validSession);
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);

    const res = await testApp().handle(new Request("http://localhost/notes"));

    expect(res.status).toBe(401);
  });

  it("lists the user's notes", async () => {
    dbMock.note.findMany.mockResolvedValue([noteRow]);

    const res = await testApp().handle(new Request("http://localhost/notes"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ title: string }>;
    expect(body).toHaveLength(1);
    expect(body[0]?.title).toBe("Hello");
  });

  it("creates a note", async () => {
    dbMock.note.create.mockImplementation(({ data }: { data: { title: string } }) =>
      Promise.resolve({ ...noteRow, title: data.title }),
    );

    const res = await testApp().handle(
      new Request("http://localhost/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "New" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe("New");
    expect(dbMock.note.create).toHaveBeenCalledWith({
      data: { title: "New", authorId: "u1" },
    });
  });

  it("rejects invalid create payloads with a structured 422", async () => {
    const res = await testApp().handle(
      new Request("http://localhost/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }),
    );

    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      error: { code: string; message: string; detail: Array<{ path: string; message: string }> };
    };
    expect(body.error.code).toBe("VALIDATION");
    expect(body.error.detail.length).toBeGreaterThan(0);
  });

  it("returns 404 for a missing note", async () => {
    dbMock.note.findUnique.mockResolvedValue(null);

    const res = await testApp().handle(new Request("http://localhost/notes/nope"));

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOTE_NOT_FOUND");
  });

  it("returns 404 when the note belongs to someone else", async () => {
    dbMock.note.findUnique.mockResolvedValue({ ...noteRow, authorId: "u2" });

    const res = await testApp().handle(new Request("http://localhost/notes/n1"));

    expect(res.status).toBe(404);
  });

  it("deletes a note", async () => {
    dbMock.note.findUnique.mockResolvedValue(noteRow);
    dbMock.note.delete.mockResolvedValue({});

    const res = await testApp().handle(
      new Request("http://localhost/notes/n1", { method: "DELETE" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

describe("error plugin", () => {
  it("maps unknown routes to a structured 404", async () => {
    const res = await new Elysia()
      .use(errorPlugin)
      .handle(new Request("http://localhost/does-not-exist"));

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("masks unhandled errors as 500 with a generic message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = new Elysia().use(errorPlugin).get("/boom", () => {
      throw new Error("secret detail");
    });

    try {
      const res = await app.handle(new Request("http://localhost/boom"));

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).not.toContain("secret detail");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("maps ApiError subclasses to their status and code", async () => {
    const app = new Elysia().use(errorPlugin).get("/conflict", () => {
      throw new ApiError(409, "CONFLICT", "Already exists");
    });

    const res = await app.handle(new Request("http://localhost/conflict"));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.message).toBe("Already exists");
  });
});
