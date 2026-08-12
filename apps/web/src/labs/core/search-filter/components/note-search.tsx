"use client";

import { Button } from "@zomlab/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zomlab/ui/components/input-group";
import { SearchIcon, XIcon } from "lucide-react";

interface NoteSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function NoteSearch({ query, onQueryChange }: NoteSearchProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <label className="text-sm font-medium text-foreground" htmlFor="note-search">
        Search notes
      </label>
      <p className="mt-1 text-sm text-muted-foreground" id="note-search-description">
        Find text in a note title or its content.
      </p>
      <InputGroup className="mt-3">
        <InputGroupAddon aria-hidden="true">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          aria-describedby="note-search-description"
          className="pl-9 pr-10"
          id="note-search"
          maxLength={200}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search your notes"
          type="text"
          value={query}
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <Button
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}
