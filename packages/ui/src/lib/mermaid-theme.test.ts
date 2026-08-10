import { describe, expect, test } from "vitest";
import { createMermaidThemeVariables } from "./mermaid-theme";

const LIGHT_TOKENS = {
  background: "oklch(0.985 0.002 247)",
  border: "oklch(0.892 0.012 250)",
  foreground: "oklch(0.205 0.018 255)",
  muted: "oklch(0.955 0.006 250)",
  mutedForeground: "oklch(0.462 0.028 254)",
  primary: "oklch(0.42 0.098 256)",
  primaryForeground: "oklch(0.985 0.002 247)",
};

describe("createMermaidThemeVariables", () => {
  test("maps semantic tokens to readable Mermaid variables", () => {
    expect(createMermaidThemeVariables(LIGHT_TOKENS)).toEqual({
      background: LIGHT_TOKENS.background,
      edgeLabelBackground: LIGHT_TOKENS.background,
      fontFamily: "var(--font-mono)",
      lineColor: LIGHT_TOKENS.mutedForeground,
      mainBkg: LIGHT_TOKENS.muted,
      nodeBorder: LIGHT_TOKENS.border,
      primaryBorderColor: LIGHT_TOKENS.border,
      primaryColor: LIGHT_TOKENS.muted,
      primaryTextColor: LIGHT_TOKENS.foreground,
      secondaryBorderColor: LIGHT_TOKENS.border,
      secondaryColor: LIGHT_TOKENS.background,
      secondaryTextColor: LIGHT_TOKENS.foreground,
      tertiaryBorderColor: LIGHT_TOKENS.primary,
      tertiaryColor: LIGHT_TOKENS.primary,
      tertiaryTextColor: LIGHT_TOKENS.primaryForeground,
      textColor: LIGHT_TOKENS.foreground,
    });
  });
});
