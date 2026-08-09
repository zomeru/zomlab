/// <reference types="vitest/config" />

import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
    mdx({ remarkPlugins: [remarkGfm] }),
    tailwindcss(),
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
