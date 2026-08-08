"use client";

import { Link } from "@tanstack/react-router";
import type { Note } from "@zomlab/contracts";

export function NoteCard({ note }: { note: Note }) {
  const date = new Date(note.updatedAt);

  return (
    <Link
      to="/core/crud/demo/$id"
      params={{ id: note.id }}
      className="group block rounded-xl border border-border bg-card p-5 transition-[background-color,border-color] hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="truncate font-medium text-foreground transition-colors group-hover:text-link">
          {note.title}
        </h2>
        <time
          dateTime={date.toISOString()}
          className="shrink-0 text-xs tabular-nums text-muted-foreground"
        >
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </time>
      </div>
      {note.content && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content}</p>
      )}
    </Link>
  );
}
