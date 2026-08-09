import { neon } from "@neondatabase/serverless";
import { env } from "@zomlab/env";
import { drizzle } from "drizzle-orm/neon-http";

export function createDatabase() {
  const sql = neon(env.DATABASE_URL);

  return drizzle({
    client: sql,
    logger: env.APP_ENV === "development",
  });
}

type Db = ReturnType<typeof createDatabase>;

let _db: Db | undefined;

function getDatabase(): Db {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, key: string) {
    return getDatabase()[key as keyof Db];
  },
});

export type Database = Db;
