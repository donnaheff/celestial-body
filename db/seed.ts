import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

/**
 * Seeds (or promotes) an admin user for local development.
 * Usage: ADMIN_SEED_EMAIL=you@acmebids.co.uk ADMIN_SEED_PASSWORD=changeme npm run db:seed
 */
async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log(
      "Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD env vars to seed an admin user. Skipping."
    );
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });

  if (existing) {
    await db
      .update(schema.users)
      .set({ role: "admin", passwordHash })
      .where(eq(schema.users.id, existing.id));
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    await db.insert(schema.users).values({
      email,
      name: "Admin",
      role: "admin",
      passwordHash,
    });
    console.log(`Created admin user ${email}.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
