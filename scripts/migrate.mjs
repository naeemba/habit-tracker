// Applies this app's migrations from `drizzle/`. The auth tables are not here;
// `next-starter migrate` owns those and runs first.
//
// drizzle-kit would do this too, but it is a dev dependency and carries esbuild
// with it, so it is not in the production image. drizzle-orm's own migrator is,
// which makes this the whole of what the container needs.
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL is not set. See .env.example.")

const sql = postgres(databaseUrl, { max: 1 })
try {
  await migrate(drizzle(sql), {
    migrationsFolder: join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle"),
  })
} finally {
  await sql.end()
}
