export interface MermaidThemeTokens {
  background: string;
  border: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
}

export function createMermaidThemeVariables(tokens: MermaidThemeTokens) {
  return {
    background: tokens.background,
    edgeLabelBackground: tokens.background,
    fontFamily: "var(--font-mono)",
    lineColor: tokens.mutedForeground,
    mainBkg: tokens.muted,
    nodeBorder: tokens.border,
    primaryBorderColor: tokens.border,
    primaryColor: tokens.muted,
    primaryTextColor: tokens.foreground,
    secondaryBorderColor: tokens.border,
    secondaryColor: tokens.background,
    secondaryTextColor: tokens.foreground,
    tertiaryBorderColor: tokens.primary,
    tertiaryColor: tokens.primary,
    tertiaryTextColor: tokens.primaryForeground,
    textColor: tokens.foreground,
  };
}
