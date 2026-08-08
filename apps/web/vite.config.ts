/// <reference types="vitest/config" />

import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: resolve(__dirname, "..", ".."),
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8787",
    //     changeOrigin: true,
    //   },
    // },
  },
});
