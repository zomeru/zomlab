import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("keeps an internal application path", () => {
    expect(getSafeRedirect("/core/crud-demo?view=list#notes")).toBe(
      "/core/crud-demo?view=list#notes",
    );
  });

  it.each([undefined, "", "https://attacker.example", "//attacker.example", "javascript:alert(1)"])(
    "falls back for an unsafe redirect: %s",
    (redirect) => {
      expect(getSafeRedirect(redirect)).toBe("/");
    },
  );
});
