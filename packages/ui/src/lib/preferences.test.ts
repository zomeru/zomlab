import { describe, expect, test } from "vitest";
import { parseSidebarPreference, resolveThemePreference } from "./preferences";

describe("resolveThemePreference", () => {
  test("uses explicit light and dark preferences", () => {
    expect(resolveThemePreference("light", true)).toBe("light");
    expect(resolveThemePreference("dark", false)).toBe("dark");
  });

  test("resolves system and invalid preferences from the color scheme", () => {
    expect(resolveThemePreference("system", true)).toBe("dark");
    expect(resolveThemePreference("system", false)).toBe("light");
    expect(resolveThemePreference("unexpected", true)).toBe("dark");
    expect(resolveThemePreference(null, false)).toBe("light");
  });
});

describe("parseSidebarPreference", () => {
  test("reads the persisted sidebar cookie", () => {
    expect(parseSidebarPreference("session=abc; zomlab_sidebar=false; theme=dark")).toBe(false);
    expect(parseSidebarPreference("zomlab_sidebar=true")).toBe(true);
  });

  test("defaults to open for missing or invalid values", () => {
    expect(parseSidebarPreference(undefined)).toBe(true);
    expect(parseSidebarPreference("zomlab_sidebar=maybe")).toBe(true);
  });
});
