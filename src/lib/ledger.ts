/**
 * What a day earns. No database and no React, so `ledger.test.ts` can run it
 * under `node --test`; the reads and writes live in `ledger-queries.ts`.
 *
 * The result is written down rather than recomputed on read. Points already
 * earned are never taken back — raising an item's points or changing its
 * schedule today must not rewrite what last month paid out — and a stored row
 * is the only way to keep that true.
 */
import { requiredItems, type CheckIn, type Schedule } from "./dates.ts"
import { DAILY_BONUS } from "./settings.ts"

/** The least an item must carry to be paid for. */
export type LedgerItem = {
  id: string
  points: number
  schedule: Schedule
  /** Set once the item is archived. Archived items are still paid for the
      days they were done; they just stop being owed. */
  archivedAt: Date | null
}

/** One day's row of the `ledger` table. */
export type LedgerDay = { localDate: string; itemPoints: number; bonus: number }

/**
 * What a local date earned, from every item and every check-in.
 *
 * The bonus asks `requiredItems`, not `dueItems`. A `per_week` habit is listed
 * every day of its week but only owed once the count left no longer fits in
 * the days left after today, so a Monday gym skipped to go on Tuesday costs
 * nothing. Counting the listed rows instead would charge the user for a day
 * they got right.
 *
 * A day that owes nothing pays no bonus. Vacuously "everything owed is done"
 * would hand out five points a day to someone with no items at all, and turn
 * a rest day into the same reward as a day the user cleared.
 */
export function ledgerDay(items: LedgerItem[], localDate: string, checkIns: CheckIn[]): LedgerDay {
  const points = new Map(items.map(item => [item.id, item.points]))
  const doneToday = new Set(
    checkIns.filter(checkIn => checkIn.localDate === localDate).map(checkIn => checkIn.itemId),
  )

  let itemPoints = 0
  for (const itemId of doneToday) itemPoints += points.get(itemId) ?? 0

  // Archived items keep the points of the days they were done, but stop being
  // owed: card efd1ae35 archives instead of deleting so history stays intact,
  // and a bonus that an archived item could still block would never be earned
  // again.
  const owed = requiredItems(items.filter(item => item.archivedAt === null), localDate, checkIns)
  const bonus = owed.length > 0 && owed.every(item => doneToday.has(item.id)) ? DAILY_BONUS : 0

  return { localDate, itemPoints, bonus }
}
