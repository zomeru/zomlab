"use client";

import { useNavigate } from "@tanstack/react-router";
import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent } from "@zomlab/ui/components/card";
import { Input } from "@zomlab/ui/components/input";
import { Label } from "@zomlab/ui/components/label";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { Textarea } from "@zomlab/ui/components/textarea";
import { useState } from "react";
import { useDeleteNote } from "../hooks/use-delete-note";
import { useNote } from "../hooks/use-note";
import { useUpdateNote } from "../hooks/use-update-note";

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
      <div className="mx-auto max-w-3xl space-y-4" role="status" aria-label="Loading note">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-8 h-52" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <Alert className="mx-auto max-w-3xl" variant="destructive" role="alert">
        {error?.message ?? "Note not found"}
      </Alert>
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
    try {
      await deleteNote.mutateAsync(id);
      navigate({ to: "/core/crud/demo" });
    } catch {
      // The mutation exposes the actionable error beside the destructive control.
    }
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
            <Button type="button" variant="outline" onClick={startEdit}>
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {deleteNote.error && !editing ? (
        <Alert className="mt-4" variant="destructive" role="alert">
          Could not delete this note. {deleteNote.error.message} You can try again.
        </Alert>
      ) : null}

      {editing ? (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>

              {updateNote.error && (
                <Alert variant="destructive" role="alert">
                  {updateNote.error.message}
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={updateNote.isPending}>
                  {updateNote.isPending ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        currentNote.content && (
          <div className="text-prose mt-8 whitespace-pre-wrap leading-7">{currentNote.content}</div>
        )
      )}
    </article>
  );
}
