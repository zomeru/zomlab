import { describe, expect, test } from "vitest";
import { validateNoteDraft } from "./note-form-validation";

describe("validateNoteDraft", () => {
  test("reports both contract maximum violations", () => {
    expect(
      validateNoteDraft({
        content: "c".repeat(301),
        title: "t".repeat(201),
      }),
    ).toEqual({
      content: "Use 300 characters or fewer for the content.",
      title: "Use 200 characters or fewer for the title.",
    });
  });

  test("reports an empty trimmed title", () => {
    expect(validateNoteDraft({ content: "", title: "   " })).toEqual({
      title: "Enter a title for your note.",
    });
  });
});
