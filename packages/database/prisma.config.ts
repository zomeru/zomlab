import { defineConfig } from "@prisma/config";
import { env } from "@zomlab/env";

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env.DIRECT_URL,
  },
});
