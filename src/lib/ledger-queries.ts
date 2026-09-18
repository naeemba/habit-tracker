/**
 * Every read and write of the `ledger` table. Server only: the only importers
 * are server components and `checkin-queries.ts`.
 *
 * It reads the items and check-ins tables directly rather than through the
 * other query modules, so that check-in writes can call in here without the
 * two files importing each other.
 */
import { eq } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { ledgerDay } from "./ledger.ts"
import { checkIns } from "./schema/checkins.ts"
import { items } from "./schema/items.ts"
import { ledger } from "./schema/ledger.ts"

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
 * whole week. ponytail: one user is a few thousand rows a year, the same bet
 * `listCheckIns` makes; give both a floor together if it ever gets slow.
 */
export async function writeLedgerDay(localDate: string): Promise<void> {
  const [allItems, allCheckIns] = await Promise.all([
    db.select({
      id: items.id,
      points: items.points,
      schedule: items.schedule,
      archivedAt: items.archivedAt,
    }).from(items),
    db.select({ itemId: checkIns.itemId, localDate: checkIns.localDate }).from(checkIns),
  ])

  const day = ledgerDay(allItems, localDate, allCheckIns)
  await db.insert(ledger).values(day).onConflictDoUpdate({
    target: ledger.localDate,
    set: { itemPoints: day.itemPoints, bonus: day.bonus },
  })
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
