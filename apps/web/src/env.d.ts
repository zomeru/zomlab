/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-side environment variables
  readonly VITE_SITE_URL: string;
}

// biome-ignore lint/correctness/noUnusedVariables: ImportMeta is a global Vite type augmentation used by TypeScript.
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Server-side environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string;
      readonly BETTER_AUTH_SECRET: string;
      readonly BETTER_AUTH_URL: string;
      readonly GITHUB_CLIENT_ID: string | undefined;
      readonly GITHUB_CLIENT_SECRET: string | undefined;
      readonly GOOGLE_CLIENT_ID: string | undefined;
      readonly GOOGLE_CLIENT_SECRET: string | undefined;
      readonly NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
