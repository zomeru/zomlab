"use client";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDeleteNote } from "../hooks/use-delete-note";
import { useNote } from "../hooks/use-note";
import { useUpdateNote } from "../hooks/use-update-note";

const INPUT_CLASSES =
  "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm";

const SECONDARY_BUTTON_CLASSES =
  "h-9 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-[background-color,transform] hover:bg-muted active:scale-[0.96]";

export function NoteDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data: note, isLoading, error } = useNote(id);
  const updateNote = useUpdateNote(id);
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading note…
      </p>
    );
  }

  if (error || !note) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error?.message ?? "Note not found"}
      </p>
    );
  }

  const currentNote = note;

  function startEdit() {
    setTitle(currentNote.title);
    setContent(currentNote.content ?? "");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await updateNote.mutateAsync({
      title: title.trim(),
      content: content.trim() || undefined,
    });

    setEditing(false);
  }

  async function handleDelete() {
    await deleteNote.mutateAsync(id);
    navigate({ to: "/core/crud/demo" });
  }

  return (
    <article className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {currentNote.title}
          </h1>
          <p className="mt-2 text-sm tabular-nums text-muted-foreground">
            Updated {new Date(currentNote.updatedAt).toLocaleString()}
          </p>
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={startEdit} className={SECONDARY_BUTTON_CLASSES}>
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className="h-9 rounded-md border border-destructive/40 bg-background px-4 text-sm font-medium text-destructive transition-[background-color,transform] hover:bg-destructive/5 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteNote.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Content</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm"
            />
          </label>

          {updateNote.error && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {updateNote.error.message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateNote.isPending}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateNote.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={SECONDARY_BUTTON_CLASSES}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        currentNote.content && (
          <div className="mt-8 whitespace-pre-wrap leading-7 text-foreground">
            {currentNote.content}
          </div>
        )
      )}
    </article>
  );
}
