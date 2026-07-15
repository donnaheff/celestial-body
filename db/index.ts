import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Deliberately does NOT throw at import time when DATABASE_URL is unset.
// This module is pulled in by auth.ts, which every route/page touches —
// throwing here would take down pages that never actually query the DB
// (e.g. marketing pages) in an environment where the DB isn't wired up yet.
// A missing connection string still fails loudly, just at the first real
// query instead of at module load.

// Reuse the pool across hot reloads in dev so we don't exhaust connections.
const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

export const db = drizzle(pool, { schema });
