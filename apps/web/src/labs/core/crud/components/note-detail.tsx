"use client";

import { useNavigate } from "@tanstack/react-router";
import { Alert } from "@zomlab/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zomlab/ui/components/alert-dialog";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { Textarea } from "@zomlab/ui/components/textarea";
import { useRef, useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { CoreLoadingState } from "~/labs/core/shared/core-loading-state";
import { formatDateTime } from "~/labs/core/shared/formatters";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [titleError, setTitleError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <CoreDemoShell description="Loading your private note." title="Note">
        <CoreLoadingState className="space-y-4" label="Loading note">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-8 h-52" />
        </CoreLoadingState>
      </CoreDemoShell>
    );
  }

  if (error || !note) {
    return (
      <CoreDemoShell description="Open and update a private note." title="Note">
        <Alert variant="destructive" role="alert">
          {error?.message ?? "Note not found"}
        </Alert>
      </CoreDemoShell>
    );
  }

  const currentNote = note;

  function startEdit() {
    setTitle(currentNote.title);
    setContent(currentNote.content ?? "");
    setTitleError("");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Enter a title for your note.");
      titleInputRef.current?.focus();
      return;
    }

    setTitleError("");

    try {
      await updateNote.mutateAsync({
        title: title.trim(),
        content: content.trim() || undefined,
      });

      setEditing(false);
    } catch {
      // The mutation error remains rendered next to the form.
    }
  }

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (deleteNote.isPending) return;

    try {
      await deleteNote.mutateAsync(id);
      navigate({ to: "/core/crud-demo" });
    } catch {
      // Keep the controlled dialog open so its error can be read and retried.
    }
  }

  return (
    <CoreDemoShell
      description={`Updated ${formatDateTime(currentNote.updatedAt)}`}
      title={currentNote.title}
    >
      <article>
        {!editing && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={startEdit}>
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                deleteNote.reset();
                setDeleteDialogOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        )}

        {editing ? (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <form aria-busy={updateNote.isPending} onSubmit={handleSave}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="note-title">Title</FieldLabel>
                    <Input
                      aria-describedby={
                        titleError
                          ? "note-title-description note-title-error"
                          : "note-title-description"
                      }
                      aria-invalid={titleError ? true : undefined}
                      id="note-title"
                      name="title"
                      onChange={(event) => {
                        setTitle(event.target.value);
                        if (titleError) setTitleError("");
                      }}
                      ref={titleInputRef}
                      type="text"
                      value={title}
                    />
                    <p className="text-sm text-muted-foreground" id="note-title-description">
                      Give your note a concise, recognizable title.
                    </p>
                    {titleError ? (
                      <FieldError id="note-title-error">{titleError}</FieldError>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="note-content">Content</FieldLabel>
                    <Textarea
                      id="note-content"
                      name="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                    />
                    <p className="text-sm text-muted-foreground">Optional details for your note.</p>
                  </Field>
                </FieldGroup>

                {updateNote.error && (
                  <Alert variant="destructive" role="alert">
                    {updateNote.error.message}
                  </Alert>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
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
            <div className="text-prose mt-8 whitespace-pre-wrap leading-7">
              {currentNote.content}
            </div>
          )
        )}

        <AlertDialog
          onOpenChange={(open) => {
            if (!deleteNote.isPending) setDeleteDialogOpen(open);
          }}
          open={deleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete note?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete “{currentNote.title}”? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteNote.error ? (
              <Alert variant="destructive" role="alert">
                Could not delete this note. {deleteNote.error.message} You can try again.
              </Alert>
            ) : null}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteNote.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleteNote.isPending} onClick={handleDelete}>
                {deleteNote.isPending ? "Deleting…" : "Delete note"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </article>
    </CoreDemoShell>
  );
}
