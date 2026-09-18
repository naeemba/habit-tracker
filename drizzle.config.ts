import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL is not set. See .env.example.")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/schema/*.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
})
