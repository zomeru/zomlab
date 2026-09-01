import type { RealtimeChatMessage } from "@zomlab/contracts";
import { describe, expect, test } from "vitest";
import { realtimeRoomScopeKey, toChronologicalMessages } from "./realtime";

describe("realtime repository helpers", () => {
  test("isolates identical room names between authenticated users", async () => {
    const first = await realtimeRoomScopeKey("user-1", "general");
    const second = await realtimeRoomScopeKey("user-2", "general");

    expect(first).toHaveLength(48);
    expect(second).toHaveLength(48);
    expect(first).not.toBe(second);
    await expect(realtimeRoomScopeKey("user-1", "general")).resolves.toBe(first);
  });

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
