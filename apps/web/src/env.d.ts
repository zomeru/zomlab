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
      readonly BETTER_AUTH_GITHUB_CLIENT_ID: string | undefined;
      readonly BETTER_AUTH_GITHUB_CLIENT_SECRET: string | undefined;
      readonly BETTER_AUTH_GOOGLE_CLIENT_ID: string | undefined;
      readonly BETTER_AUTH_GOOGLE_CLIENT_SECRET: string | undefined;
      readonly STRIPE_SECRET_KEY: string | undefined;
      readonly STRIPE_WEBHOOK_SECRET: string | undefined;
      readonly PAYMONGO_SECRET_KEY: string | undefined;
      readonly PAYMONGO_WEBHOOK_SECRET: string | undefined;
      readonly PAYPAL_CLIENT_ID: string | undefined;
      readonly PAYPAL_CLIENT_SECRET: string | undefined;
      readonly PAYPAL_WEBHOOK_ID: string | undefined;
      readonly APP_ENV: "staging" | "production";
    }
  }
}

export {};
