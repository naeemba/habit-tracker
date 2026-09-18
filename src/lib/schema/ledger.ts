/**
 * The `ledger` table: one row per day, holding what that day earned.
 *
 * Points are a fact, not a sum recomputed on every read. A day's row is
 * rewritten whenever a check-in on it changes, so editing an item's points or
 * its schedule today never quietly rewrites what last month paid out.
 *
 * `local_date` is the key, the same `YYYY-MM-DD` string the check-ins carry.
 */
import { integer, pgTable, text } from "drizzle-orm/pg-core"

export const ledger = pgTable("ledger", {
  localDate: text("local_date").primaryKey(),
  itemPoints: integer("item_points").notNull(),
  bonus: integer("bonus").notNull(),
})
