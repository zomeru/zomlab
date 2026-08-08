"use client";

import type { Note } from "@zomlab/contracts";
import { NoteCard } from "./note-card";

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
