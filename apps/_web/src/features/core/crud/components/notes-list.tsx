"use client";

import type { Note } from "@zomlab/database";
import { NoteCard } from "@/features/core/crud/components/note-card";

export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id}>
          <NoteCard note={note} />
        </li>
      ))}
    </ul>
  );
}
