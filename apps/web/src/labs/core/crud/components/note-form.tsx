"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Textarea } from "@zomlab/ui/components/textarea";
import { useEffect, useRef, useState } from "react";
import { useCreateNote } from "../hooks/use-create-note";

export function NoteForm() {
  const createNote = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [titleError, setTitleError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Enter a title for your note.");
      titleInputRef.current?.focus();
      return;
    }

    setTitleError("");

    try {
      await createNote.mutateAsync({ title: title.trim(), content: content.trim() || undefined });

      setTitle("");
      setContent("");
    } catch {
      // The mutation error remains rendered next to the form.
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">New note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} aria-busy={createNote.isPending}>
          <fieldset disabled={!hydrated || createNote.isPending} className="contents">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-note-title">Title</FieldLabel>
                <Input
                  aria-describedby={
                    titleError
                      ? "new-note-title-description new-note-title-error"
                      : "new-note-title-description"
                  }
                  aria-invalid={titleError ? true : undefined}
                  id="new-note-title"
                  name="title"
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError("");
                  }}
                  placeholder="What's on your mind?"
                  ref={titleInputRef}
                  type="text"
                  value={title}
                />
                <p className="text-sm text-muted-foreground" id="new-note-title-description">
                  Give your note a concise, recognizable title.
                </p>
                {titleError ? (
                  <FieldError id="new-note-title-error">{titleError}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="new-note-content">Content</FieldLabel>
                <Textarea
                  id="new-note-content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something…"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">Optional details for your note.</p>
              </Field>
            </FieldGroup>

            {createNote.error && (
              <Alert className="mt-4" variant="destructive" role="alert">
                {createNote.error.message}
              </Alert>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="submit">{createNote.isPending ? "Creating…" : "Create note"}</Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
