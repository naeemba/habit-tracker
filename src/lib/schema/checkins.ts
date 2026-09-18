/**
 * The `checkins` table: one tap, one row. `local_date` is the day it counts
 * for in the user's timezone, `done_at` the instant it happened;
 * docs/research.md section 6 says why both.
 *
 * The unique pair is what makes a check-off idempotent: tapping twice, or an
 * offline queue replaying the same tap, cannot earn the points twice.
 *
 * Deleting an item takes its history with it. Nothing else would: the delete
 * on the item page would fail on the foreign key instead, and the user would
 * read "something went wrong" with no way to tell why. Card efd1ae35 replaces
 * that delete with an archive, which keeps the history.
 */
import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { items } from "./items.ts"

export const checkIns = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  localDate: text("local_date").notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  note: text("note"),
}, table => [unique("checkins_item_id_local_date").on(table.itemId, table.localDate)])
