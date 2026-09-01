/// <reference types="vitest/config" />

import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import type { RehypeShikiOptions } from "@shikijs/rehype";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";
import { performanceBundleReport } from "./src/build/performance-bundle-report";

const syntaxHighlightingOptions = {
  defaultColor: "light-dark()",
  fallbackLanguage: "text",
  themes: {
    dark: "github-dark",
    light: "github-light",
  },
  transformers: [
    {
      name: "semantic-code-background",
      pre(node) {
        const style = node.properties.style;

        if (typeof style === "string") {
          node.properties.style = style.replace(
            /background-color:[^;]+;?/u,
            "background-color:transparent;",
          );
        }
      },
    },
  ],
} satisfies RehypeShikiOptions;

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
    mdx({
      rehypePlugins: [[rehypeShiki, syntaxHighlightingOptions]],
      remarkPlugins: [remarkGfm],
    }),
    tailwindcss(),
    performanceBundleReport(),
  ],
  resolve: {
    alias: {
      "~": resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: Number(process.env.E2E_PORT ?? 3000),
    strictPort: true,
  },
  preview: {
    port: Number(process.env.E2E_PORT ?? 3000),
    strictPort: true,
  },
});
