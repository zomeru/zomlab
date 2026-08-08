"use client";

import { useState } from "react";
import { useCreateNote } from "../hooks/use-create-note";

const INPUT_CLASSES =
  "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm";

export function NoteForm() {
  const createNote = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createNote.mutateAsync({ title: title.trim(), content: content.trim() || undefined });

    setTitle("");
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Title</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className={INPUT_CLASSES}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Content</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            rows={3}
            className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm"
          />
        </label>
      </div>

      {createNote.error && (
        <p
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {createNote.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={createNote.isPending}
        className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createNote.isPending ? "Creating…" : "Create note"}
      </button>
    </form>
  );
}
