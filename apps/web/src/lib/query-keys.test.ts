import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("keeps list inputs and detail IDs under stable prefixes", () => {
    const query = { page: 2, pageSize: 5, query: "core" };

    expect(queryKeys.notes.list(query)).toEqual(["notes", "list", query]);
    expect(queryKeys.notes.detail("note-1")).toEqual(["notes", "detail", "note-1"]);
    expect(queryKeys.files.all).toEqual(["files"]);
    expect(queryKeys.health.all).toEqual(["health"]);
  });
});
