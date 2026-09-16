/**
 * This app's own tables. The auth tables are not here: the starter owns them
 * and migrates them through its own CLI and its own journal table, so the two
 * tracks never collide. See docs/stack.md.
 */
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import type { Schedule } from "./dates"

/**
 * Columns follow docs/data-model.md. `schedule` is jsonb rather than text so
 * nothing has to parse it on the way out; the shape is still untrusted, which
 * is why `dates.ts` guards every field it reads.
 */
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind", { enum: ["habit", "chore"] }).notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  points: integer("points").notNull().default(1),
  schedule: jsonb("schedule").$type<Schedule>().notNull(),
  reminderTime: text("reminder_time"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Item = typeof items.$inferSelect
