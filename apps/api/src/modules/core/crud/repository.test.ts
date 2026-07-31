import { beforeEach, describe, expect, it, vi } from "vitest";
import { noteRepository } from "./repository";

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

const noteRow = {
  id: "n1",
  title: "Hello",
  content: null,
  authorId: "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("noteRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a note", async () => {
    dbMock.note.create.mockResolvedValue(noteRow);

    const result = await noteRepository.create({ title: "Hello", authorId: "u1" });

    expect(result).toEqual(noteRow);
    expect(dbMock.note.create).toHaveBeenCalledWith({
      data: { title: "Hello", authorId: "u1" },
    });
  });

  it("finds a note by id", async () => {
    dbMock.note.findUnique.mockResolvedValue(noteRow);

    const result = await noteRepository.findById("n1");

    expect(result).toEqual(noteRow);
    expect(dbMock.note.findUnique).toHaveBeenCalledWith({ where: { id: "n1" } });
  });

  it("lists notes by author ordered by createdAt desc", async () => {
    dbMock.note.findMany.mockResolvedValue([noteRow]);

    const result = await noteRepository.findByAuthor("u1");

    expect(result).toEqual([noteRow]);
    expect(dbMock.note.findMany).toHaveBeenCalledWith({
      where: { authorId: "u1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("updates a note", async () => {
    dbMock.note.update.mockResolvedValue({ ...noteRow, title: "Updated" });

    const result = await noteRepository.update("n1", { title: "Updated" });

    expect(result.title).toBe("Updated");
    expect(dbMock.note.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { title: "Updated" },
    });
  });

  it("deletes a note", async () => {
    dbMock.note.delete.mockResolvedValue(noteRow);

    const result = await noteRepository.delete("n1");

    expect(result).toBeUndefined();
    expect(dbMock.note.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });
});
