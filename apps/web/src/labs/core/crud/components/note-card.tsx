"use client";

import { Link } from "@tanstack/react-router";
import type { Note } from "@zomlab/contracts";
import { Card } from "@zomlab/ui/components/card";
import { formatDate } from "~/labs/core/shared/formatters";

export function NoteCard({ note }: { note: Note }) {
  return (
    <Card className="group transition-[background-color,border-color,box-shadow] hover:border-border-strong hover:bg-surface-elevated hover:shadow-surface">
      <Link
        to="/core/crud-demo/$id"
        params={{ id: note.id }}
        className="block rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="truncate font-medium text-foreground transition-colors group-hover:text-link">
            {note.title}
          </h2>
          <time
            dateTime={note.updatedAt}
            className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
          >
            {formatDate(note.updatedAt)}
          </time>
        </div>
        {note.content && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content}</p>
        )}
      </Link>
    </Card>
  );
}
