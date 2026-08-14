"use client";

import type { Note } from "@zomlab/contracts";
import { NoteCard } from "./note-card";

export function NotesList({ notes, ...props }: { notes: Note[] } & React.ComponentProps<"ul">) {
  return (
    <ul className="space-y-3" {...props}>
      {notes.map((note) => (
        <li key={note.id}>
          <NoteCard note={note} />
        </li>
      ))}
    </ul>
  );
}
