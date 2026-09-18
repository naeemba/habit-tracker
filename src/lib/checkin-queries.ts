/**
 * Every read and write of the `checkins` table. Server only: the only
 * importers are server components and server actions.
 *
 * The ordering and filtering these feed is in `today.ts`, which has no
 * database and can be tested without one.
 */
import { and, eq } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { assertItemId } from "./items.ts"
import { checkIns } from "./schema/checkins.ts"
import type { TodayCheckIn } from "./today.ts"

/**
 * Every check-in there is.
 *
 * Today needs more than today's rows: a chore's dueness is measured from the
 * last time it was done, which can be months back, and a `per_week` habit
 * counts its week. ponytail: one user tapping a handful of items a day is a
 * few thousand rows a year, so the whole table is cheaper than working out how
 * far back to look. Give it a floor if it ever gets slow.
 */
export function listCheckIns(): Promise<TodayCheckIn[]> {
  return db.select({ itemId: checkIns.itemId, localDate: checkIns.localDate, note: checkIns.note }).from(checkIns)
}

/**
 * Check an item off for a day, or take the check-off back.
 *
 * The delete runs first and reports what it removed, so the tap that untaps
 * and the tap that taps are one round of the same statement pair — nothing
 * reads the row and then acts on a stale answer.
 *
 * Two taps landing at once both delete nothing and both insert; the unique
 * pair on (item, day) means the second insert is dropped rather than earning
 * the points twice. The same is what will make an offline queue safe to
 * replay.
 *
 * ponytail: a toggle is not order-free. Two overlapping taps on an already
 * checked row can leave it checked with its note gone — A deletes, B finds
 * nothing to delete and inserts a fresh row. One user on one phone has to tap
 * twice inside one round trip to hit it, and the worst case is one lost note.
 * The fix is for the button to post the state it saw instead of a toggle,
 * which is also what makes an offline queue safe to replay in any order; do it
 * when the offline queue lands.
 */
export async function toggleCheckIn(itemId: string, localDate: string): Promise<void> {
  const removed = await db.delete(checkIns).where(whereCheckIn(itemId, localDate)).returning({ id: checkIns.id })
  if (removed.length > 0) return
  await db.insert(checkIns).values({ itemId, localDate }).onConflictDoNothing()
}

/** Write the note on a day's check-in. Does nothing when there is no check-in. */
export async function saveCheckInNote(itemId: string, localDate: string, note: string | null): Promise<void> {
  await db.update(checkIns).set({ note }).where(whereCheckIn(itemId, localDate))
}

/**
 * Item ids arrive in a form field, so they are as untrusted as the ones the
 * item pages take from a URL, and get the same guard.
 */
function whereCheckIn(itemId: string, localDate: string) {
  return and(eq(checkIns.itemId, assertItemId(itemId)), eq(checkIns.localDate, localDate))
}
