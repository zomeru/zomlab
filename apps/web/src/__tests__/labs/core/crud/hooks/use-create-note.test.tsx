// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CreateNoteBody, Note } from "@zomlab/contracts";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useCreateNote } from "~/labs/core/crud/hooks/use-create-note";
import { queryKeys } from "~/lib/query-keys";

const { postNote } = vi.hoisted(() => ({ postNote: vi.fn() }));

vi.mock("~/lib/api", () => ({
  client: {
    api: {
      notes: {
        $post: postNote,
      },
    },
  },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const createInput = {
  content: "Rendered with care.",
  title: "A beautifully styled note",
} satisfies CreateNoteBody;
const createdNote: Note = {
  authorId: "user-a",
  ...createInput,
  createdAt: "2026-08-14T00:00:00.000Z",
  id: "00000000-0000-4000-8000-000000000101",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

describe("useCreateNote", () => {
  let container: HTMLDivElement;
  let queryClient: QueryClient;
  let root: Root;
  let createNote: ReturnType<typeof useCreateNote>;

  function Harness() {
    createNote = useCreateNote();
    return null;
  }

  afterEach(async () => {
    await act(async () => root?.unmount());
    queryClient?.clear();
    container?.remove();
    root = undefined as never;
    queryClient = undefined as never;
    container = undefined as never;
    createNote = undefined as never;
    vi.restoreAllMocks();
    postNote.mockReset();
  });

  test("cancels an in-flight list before creating and then refetches it", async () => {
    postNote.mockResolvedValue(Response.json(createdNote));
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries").mockResolvedValue();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    container = document.createElement("div");
    root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await createNote.mutateAsync(createInput);
    });

    expect(cancelQueries).toHaveBeenCalledWith({ queryKey: queryKeys.notes.lists });
    expect(cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(
      postNote.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.notes.lists });
  });
});
