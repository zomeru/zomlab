// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Note, UpdateNoteBody } from "@zomlab/contracts";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { queryKeys } from "~/lib/query-keys";
import { useUpdateNote } from "./use-update-note";

const { patchNote } = vi.hoisted(() => ({ patchNote: vi.fn() }));

vi.mock("~/lib/api", () => ({
  client: {
    api: {
      notes: {
        ":id": {
          $patch: patchNote,
        },
      },
    },
  },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const noteId = "00000000-0000-4000-8000-000000000101";
const updateInput = {
  content: "Fresh content",
  title: "Fresh title",
} satisfies UpdateNoteBody;
const staleNote: Note = {
  authorId: "user-a",
  content: "Old content",
  createdAt: "2026-08-13T00:00:00.000Z",
  id: noteId,
  title: "Old title",
  updatedAt: "2026-08-13T00:00:00.000Z",
};
const updatedNote: Note = {
  ...staleNote,
  ...updateInput,
  updatedAt: "2026-08-14T00:00:00.000Z",
};

describe("useUpdateNote", () => {
  let container: HTMLDivElement;
  let queryClient: QueryClient;
  let root: Root;
  let updateNote: ReturnType<typeof useUpdateNote>;

  function Harness() {
    updateNote = useUpdateNote(noteId);
    return null;
  }

  afterEach(async () => {
    await act(async () => root?.unmount());
    queryClient?.clear();
    container?.remove();
    root = undefined as never;
    queryClient = undefined as never;
    container = undefined as never;
    updateNote = undefined as never;
    vi.restoreAllMocks();
    patchNote.mockReset();
  });

  async function renderHook() {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    container = document.createElement("div");
    root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      );
    });
  }

  test("writes the parsed response to the detail cache before mutateAsync resolves", async () => {
    patchNote.mockResolvedValue(Response.json(updatedNote));
    await renderHook();
    queryClient.setQueryData(queryKeys.notes.detail(noteId), staleNote);

    await act(async () => {
      await updateNote.mutateAsync(updateInput);
    });

    expect(queryClient.getQueryData(queryKeys.notes.detail(noteId))).toEqual(updatedNote);
  });

  test("keeps mutateAsync pending until list invalidation completes", async () => {
    patchNote.mockResolvedValue(Response.json(updatedNote));
    await renderHook();

    let releaseListInvalidation = () => {};
    const listInvalidation = new Promise<void>((resolve) => {
      releaseListInvalidation = resolve;
    });
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation((filters) =>
        filters?.queryKey === queryKeys.notes.lists ? listInvalidation : Promise.resolve(),
      );

    let completed = false;
    let mutationPromise!: Promise<Note>;
    await act(async () => {
      mutationPromise = updateNote.mutateAsync(updateInput).then((note) => {
        completed = true;
        return note;
      });

      await vi.waitFor(() => {
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.notes.lists });
      });
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    try {
      expect(completed).toBe(false);
    } finally {
      releaseListInvalidation();
      await act(async () => mutationPromise);
    }
  });
});
