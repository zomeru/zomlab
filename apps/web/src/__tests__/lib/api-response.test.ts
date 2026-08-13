import { describe, expect, it } from "vitest";
import { type ApiResponseError, readJsonResponse } from "~/lib/api-response";

describe("readJsonResponse", () => {
  it("returns successful typed JSON", async () => {
    const response = Response.json({ status: "ok" });
    await expect(readJsonResponse(response, "Request failed")).resolves.toEqual({ status: "ok" });
  });

  it("throws the public API message for an unsuccessful response", async () => {
    const response = Response.json(
      { error: { code: "NOTE_NOT_FOUND", message: "Note not found" } },
      { status: 404 },
    );

    await expect(readJsonResponse(response, "Request failed")).rejects.toMatchObject({
      code: "NOTE_NOT_FOUND",
      message: "Note not found",
      status: 404,
    } satisfies Partial<ApiResponseError>);
  });

  it("rejects a failed delete response before a mutation success handler can run", async () => {
    const response = Response.json(
      { error: { code: "NOTE_NOT_FOUND", message: "Note not found" } },
      { status: 404 },
    );
    let successHandlerCalled = false;

    await expect(
      readJsonResponse(response, "The note could not be deleted").then(() => {
        successHandlerCalled = true;
      }),
    ).rejects.toMatchObject({
      code: "NOTE_NOT_FOUND",
      message: "Note not found",
      status: 404,
    } satisfies Partial<ApiResponseError>);

    expect(successHandlerCalled).toBe(false);
  });

  it("uses stable fallback copy for malformed failures", async () => {
    const response = new Response(null, { status: 503 });
    await expect(readJsonResponse(response, "Files are unavailable")).rejects.toThrow(
      "Files are unavailable",
    );
  });
});
