"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Input } from "@zomlab/ui/components/input";
import { Label } from "@zomlab/ui/components/label";
import { Textarea } from "@zomlab/ui/components/textarea";
import { useEffect, useState } from "react";
import { useCreateNote } from "../hooks/use-create-note";

export function NoteForm() {
  const createNote = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createNote.mutateAsync({ title: title.trim(), content: content.trim() || undefined });

    setTitle("");
    setContent("");
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">New note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} aria-busy={createNote.isPending}>
          <fieldset disabled={!hydrated || createNote.isPending} className="contents">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-note-title">Title</Label>
                <Input
                  id="new-note-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's on your mind?"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-note-content">Content</Label>
                <Textarea
                  id="new-note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something…"
                  rows={3}
                />
              </div>
            </div>

            {createNote.error && (
              <Alert className="mt-4" variant="destructive" role="alert">
                {createNote.error.message}
              </Alert>
            )}

            <Button type="submit" className="mt-5">
              {createNote.isPending ? "Creating…" : "Create note"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
