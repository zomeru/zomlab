import { createDatabase, type Database } from "@zomlab/database";
import type { Bindings } from "../bindings";

export function createDatabaseFromBindings(bindings: Bindings): Database {
  return createDatabase({ connectionString: bindings.DATABASE_URL });
}
