/**
 * This app's own tables. The auth tables are not here: the starter owns them
 * and migrates them through its own CLI and its own journal table, so the two
 * tracks never collide. See docs/stack.md.
 */
import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
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

/**
 * One tap, one row. `local_date` is the day it counts for in the user's
 * timezone, `done_at` the instant it happened; docs/research.md section 6 says
 * why both.
 *
 * The unique pair is what makes a check-off idempotent: tapping twice, or an
 * offline queue replaying the same tap, cannot earn the points twice.
 *
 * Deleting an item takes its history with it. Nothing else would: the delete
 * on the item page would fail on the foreign key instead, and the user would
 * read "something went wrong" with no way to tell why. Card efd1ae35 replaces
 * that delete with an archive, which keeps the history.
 */
export const checkIns = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  localDate: text("local_date").notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  note: text("note"),
}, table => [unique("checkins_item_id_local_date").on(table.itemId, table.localDate)])

export type CheckInRow = typeof checkIns.$inferSelect
