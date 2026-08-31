import type { RealtimeChatMessage } from "@zomlab/contracts";
import { describe, expect, test } from "vitest";
import { toChronologicalMessages } from "./realtime";

describe("realtime repository helpers", () => {
  test("presents a newest-first bounded database page in chronological order", () => {
    const newer = {
      id: "20000000-0000-4000-8000-000000000000",
      roomId: "general",
      senderId: "user-1",
      senderName: "Ada",
      content: "second",
      createdAt: "2026-08-31T08:00:02.000Z",
    } satisfies RealtimeChatMessage;
    const older = {
      ...newer,
      id: "10000000-0000-4000-8000-000000000000",
      content: "first",
      createdAt: "2026-08-31T08:00:01.000Z",
    } satisfies RealtimeChatMessage;

    expect(toChronologicalMessages([newer, older]).map((message) => message.content)).toEqual([
      "first",
      "second",
    ]);
  });
});
