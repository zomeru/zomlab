import type { Preview } from "@storybook/react";
import { createElement, useEffect } from "react";
import "../src/styles/storybook.css";

function ThemeRoot({ children, theme }: { children: React.ReactNode; theme: "dark" | "light" }) {
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;

    return () => {
      document.documentElement.classList.remove(theme);
      document.documentElement.style.removeProperty("color-scheme");
    };
  }, [theme]);

  return children;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      return createElement(
        ThemeRoot,
        { theme },
        createElement(
          "div",
          { className: "min-h-screen bg-background p-6 text-foreground" },
          createElement(Story),
        ),
      );
    },
  ],
  globalTypes: {
    theme: {
      description: "Design-system theme",
      toolbar: {
        dynamicTitle: true,
        icon: "paintbrush",
        items: [
          { title: "Light", value: "light" },
          { title: "Dark", value: "dark" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "error" },
    backgrounds: { disable: true },
    layout: "centered",
    viewport: {
      options: {
        mobile: { name: "Mobile · 375", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet · 768", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop · 1280", styles: { width: "1280px", height: "800px" } },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
