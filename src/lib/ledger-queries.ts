/**
 * Every read and write of the `ledger` table, and the one place a day's row is
 * worked out and stored. Server only: the only importers are server components
 * and server actions.
 *
 * This is the layer above the daos: it asks `item-queries` and `checkin-queries`
 * for their tables rather than selecting from them itself, so there is one
 * spelling of "every check-in" and one of "every item" in the app.
 */
import { eq } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { listCheckIns } from "./checkin-queries.ts"
import { today } from "./dates.ts"
import { listAllItems } from "./item-queries.ts"
import { ledgerDay } from "./ledger.ts"
import { ledger } from "./schema/ledger.ts"
import { timezone } from "./settings.ts"

/**
 * Work out what a day earned and store it.
 *
 * Called on every change to a day's check-ins, which is the only thing that
 * moves the number. Editing an item's points or its schedule leaves the days
 * already written alone, which is the point of a ledger: a day that paid out
 * eight points paid out eight points.
 *
 * The whole of both tables is read for one day, because the bonus needs a
 * chore's last-done date, which can be months back, and a `per_week` habit's
 * whole week. `listCheckIns` carries the ponytail note on that bet, and a floor
 * added there covers this too now that there is only one copy of the select.
 */
export async function writeLedgerDay(localDate: string): Promise<void> {
  const [allItems, allCheckIns] = await Promise.all([listAllItems(), listCheckIns()])

  const day = ledgerDay(allItems, localDate, allCheckIns)
  await db.insert(ledger).values(day).onConflictDoUpdate({
    target: ledger.localDate,
    set: { itemPoints: day.itemPoints, bonus: day.bonus },
  })
}

/**
 * Today's ledger row again, because an item write moves what today owes.
 *
 * Only today. Yesterday is history and keeps what it paid; today is still
 * being written. Without this, tapping three of four items and then deleting
 * the fourth leaves the bonus unpaid until something else is tapped, and
 * adding a new item after clearing the day leaves a bonus paid for a day that
 * is no longer clear.
 *
 * A throw is swallowed on purpose. One item row holding an unreadable schedule
 * makes `ledgerDay` throw, and the item write it follows has already committed:
 * without the catch, adding an item saves the row and then shows an error, and
 * pressing Add again makes a second copy. `describeSchedule` in `items.ts`
 * makes the same trade for the same reason — the list has to stay reachable so
 * the bad row can be fixed. Today's row is stale until the next write; every
 * earlier day keeps what it paid.
 */
export async function rewriteToday(): Promise<void> {
  try {
    await writeLedgerDay(today(timezone()))
  } catch (error) {
    console.warn("Could not rewrite today's ledger", error)
  }
}

/** What one day earned, for the Today header. Zero on a day with no row yet. */
export async function pointsOn(localDate: string): Promise<number> {
  const [row] = await db
    .select({ itemPoints: ledger.itemPoints, bonus: ledger.bonus })
    .from(ledger)
    .where(eq(ledger.localDate, localDate))
    .limit(1)
  return row ? row.itemPoints + row.bonus : 0
}
