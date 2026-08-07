import { neon } from "@neondatabase/serverless";
import { env } from "@zomlab/env";
import { drizzle } from "drizzle-orm/neon-http";

export function createDatabase() {
  const sql = neon(env.DATABASE_URL);

  return drizzle({
    client: sql,
    logger: env.NODE_ENV === "development",
  });
}

export const db = createDatabase();

export type Database = typeof db;
