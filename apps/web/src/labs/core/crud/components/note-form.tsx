"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Textarea } from "@zomlab/ui/components/textarea";
import { useEffect, useRef, useState } from "react";
import { useCreateNote } from "../hooks/use-create-note";
import { type NoteDraftErrors, validateNoteDraft } from "./note-form-validation";

export function NoteForm() {
  const createNote = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<NoteDraftErrors>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateNoteDraft({ content, title });
    setErrors(nextErrors);

    if (nextErrors.title) {
      titleInputRef.current?.focus();
      return;
    }
    if (nextErrors.content) {
      contentInputRef.current?.focus();
      return;
    }

    try {
      await createNote.mutateAsync({ title: title.trim(), content: content.trim() || undefined });

      setErrors({});
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
                    errors.title
                      ? "new-note-title-description new-note-title-error"
                      : "new-note-title-description"
                  }
                  aria-invalid={errors.title ? true : undefined}
                  autoComplete="off"
                  id="new-note-title"
                  name="title"
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
                  }}
                  placeholder="What's on your mind?"
                  ref={titleInputRef}
                  type="text"
                  value={title}
                />
                <p className="text-sm text-muted-foreground" id="new-note-title-description">
                  Give your note a concise, recognizable title.
                </p>
                {errors.title ? (
                  <FieldError id="new-note-title-error">{errors.title}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="new-note-content">Content</FieldLabel>
                <Textarea
                  aria-describedby={
                    errors.content
                      ? "new-note-content-description new-note-content-error"
                      : "new-note-content-description"
                  }
                  aria-invalid={errors.content ? true : undefined}
                  autoComplete="off"
                  id="new-note-content"
                  name="content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content) {
                      setErrors((current) => ({ ...current, content: undefined }));
                    }
                  }}
                  placeholder="Write something…"
                  ref={contentInputRef}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground" id="new-note-content-description">
                  Optional details for your note.
                </p>
                {errors.content ? (
                  <FieldError id="new-note-content-error">{errors.content}</FieldError>
                ) : null}
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
