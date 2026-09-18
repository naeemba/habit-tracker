/**
 * What the Today view lists, and in what order.
 *
 * Nothing here touches the database or React, so `today.test.ts` can run it
 * under `node --test`. The reads and writes live in `checkin-queries.ts`.
 */
import { dueContexts, dueItems, dueness, intervalDays, NO_HISTORY, type CheckIn, type Schedule } from "./dates.ts"

/** A check-in as Today needs it: the day it counts for, and what was typed. */
export type TodayCheckIn = CheckIn & { note: string | null }

/** The least an item must carry to get a row. */
export type TodayItem = { id: string; name: string; schedule: Schedule }

export type TodayRow<ItemType extends TodayItem> = {
  item: ItemType
  /** Checked off today. The row stays on the list either way, to untap. */
  done: boolean
  /** The note on today's check-in, if there is one. */
  note: string | null
  /** How overdue, for chores. Null for habits, which have no interval. */
  dueness: number | null
}

/**
 * Every row the Today view shows, riper first.
 *
 * `dueItems` is not the whole list. A chore leaves it the moment it is done,
 * because its interval restarts that day — so a chore tapped by mistake would
 * vanish off the screen with no row left to untap. Anything checked off today
 * is kept in the list for the rest of the day, whatever its schedule says.
 *
 * Order is what the card asks for: overdue chores at the top, then the habits
 * due today, then everything already done. Chores are sorted by how far past
 * due they are, so the one left longest is the first thing on the screen; ties
 * and habits go by name, so the list does not reshuffle between taps.
 */
export function todayRows<ItemType extends TodayItem>(
  items: ItemType[],
  localDate: string,
  checkIns: TodayCheckIn[],
): TodayRow<ItemType>[] {
  const due = new Set(dueItems(items, localDate, checkIns).map(item => item.id))
  const doneToday = new Map(
    checkIns.filter(checkIn => checkIn.localDate === localDate).map(checkIn => [checkIn.itemId, checkIn.note]),
  )
  const contexts = dueContexts(checkIns, localDate)

  return items
    .filter(item => due.has(item.id) || doneToday.has(item.id))
    .map(item => ({
      item,
      done: doneToday.has(item.id),
      note: doneToday.get(item.id) ?? null,
      dueness: item.schedule.type !== "interval"
        ? null
        : dueness(
            (contexts.get(item.id) ?? NO_HISTORY).lastDoneDate,
            localDate,
            intervalDays(item.schedule),
          ),
    }))
    .sort(compareRows)
}

function compareRows(left: TodayRow<TodayItem>, right: TodayRow<TodayItem>): number {
  if (left.done !== right.done) return left.done ? 1 : -1
  // A chore has a dueness and a habit does not, which is what puts the chores
  // above the habits.
  if ((left.dueness === null) !== (right.dueness === null)) return left.dueness === null ? 1 : -1
  // Two chores never done are both Infinity, and `Infinity - Infinity` is NaN,
  // which sorts them at random. The inequality drops them through to the name.
  if (left.dueness !== null && right.dueness !== null && left.dueness !== right.dueness) {
    return right.dueness - left.dueness
  }
  return left.item.name.localeCompare(right.item.name)
}
