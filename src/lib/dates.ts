/**
 * Every day-boundary calculation in the app lives here.
 *
 * A "local date" is a `YYYY-MM-DD` string in the user's timezone. It is what
 * a check-in counts for, and the only day identity the rest of the app uses.
 * Nowhere else should parse a date, add days, or decide what is due.
 *
 * Local dates sort as strings, so `<` and `>` compare them as calendar days.
 */

/** Schedule shapes from docs/data-model.md. `interval` is chores only. */
export type Schedule =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] }
  | { type: "per_week"; count: number }
  | { type: "interval"; days: number }

const MILLISECONDS_PER_DAY = 86_400_000

/**
 * The calendar day a UTC instant falls on for the user.
 * `en-CA` formats as `YYYY-MM-DD`, which is exactly the local date shape.
 */
export function toLocalDate(instant: Date, timezone: string): string {
  // Checked before the try so the catch below can only mean a bad timezone.
  // `format` throws on an invalid Date too, and blaming a timezone that turns
  // out to be perfectly correct sends you looking in the wrong place.
  if (Number.isNaN(instant.getTime())) throw new RangeError(`Not a valid instant: ${instant}`)
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(instant)
  } catch {
    throw new RangeError(`Unknown timezone in settings.timezone: ${timezone}`)
  }
}

export function today(timezone: string): string {
  return toLocalDate(new Date(), timezone)
}

/**
 * Local dates are plain calendar days, so parse them as UTC midnight.
 *
 * `local_date` is a text column, so nothing upstream guarantees the shape.
 * Throwing beats returning NaN: NaN reads as "not due" everywhere and the item
 * just stops appearing, with nothing logged and nobody told. The round-trip
 * check also rejects dates that exist as a string but not on a calendar, like
 * `2026-02-31`, which `Date.parse` quietly rolls forward to March.
 */
function parse(localDate: string): number {
  const time = Date.parse(`${localDate}T00:00:00Z`)
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== localDate) {
    throw new RangeError(`Not a local date: ${localDate}`)
  }
  return time
}

export function addDays(localDate: string, days: number): string {
  return new Date(parse(localDate) + days * MILLISECONDS_PER_DAY).toISOString().slice(0, 10)
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / MILLISECONDS_PER_DAY)
}

/**
 * A day number as the `weekdays` schedule writes them: 0 = Sunday, 6 =
 * Saturday. Exported because the form that writes a schedule has to refuse
 * exactly what the guards here would later throw on; two copies of the range
 * would drift and let the form save a day that then reads as corrupt.
 */
export function isWeekday(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6
}

/** 0 = Sunday, matching the `weekdays` schedule shape. */
function dayOfWeek(localDate: string): number {
  return new Date(parse(localDate)).getUTCDay()
}

/** The Sunday that starts the week containing this date. */
function weekStart(localDate: string): string {
  return addDays(localDate, -dayOfWeek(localDate))
}

/**
 * How ripe a chore is: 0 just done, 1 due, above 1 overdue.
 * A chore never done is infinitely overdue, so it sorts to the top.
 *
 * An interval of 0 divides to Infinity on every day but the one it was done,
 * so the chore would be due forever and never leave the list. It throws
 * instead.
 */
export function dueness(lastDoneDate: string | null, localDate: string, intervalDays: number): number {
  if (!(intervalDays > 0)) throw new RangeError(`Interval must be at least one day: ${intervalDays}`)
  if (lastDoneDate === null) return Infinity
  return daysBetween(lastDoneDate, localDate) / intervalDays
}

/**
 * Times per week, guarded. `schedule` is a text column holding JSON, so this
 * number is as untrusted as a check-in date. A `0`, a missing field or a
 * `"three"` makes `isDue` false and `requiredToday` false on every day of
 * every week: the habit vanishes from Today and stops costing the bonus, with
 * nothing thrown and nothing logged. Both Today readers go through here because
 * `requiredToday` returns early for `per_week` and never reaches `isDue`.
 */
export function weeklyCount(schedule: Extract<Schedule, { type: "per_week" }>): number {
  if (!(schedule.count > 0)) throw new RangeError(`Times per week must be at least one: ${schedule.count}`)
  return schedule.count
}

/**
 * The interval, guarded. Twin of `weeklyCount`, for the same untrusted jsonb:
 * a row with no `days` prints `Every undefined days since last done` on the
 * list, and a `0` prints `Every 0 days since last done` as if it were a real
 * schedule while the Today view throws on it. `dueness` rejects the same
 * values for the day it is asked about.
 */
export function intervalDays(schedule: Extract<Schedule, { type: "interval" }>): number {
  if (!(schedule.days > 0)) throw new RangeError(`Interval must be at least one day: ${schedule.days}`)
  return schedule.days
}

/**
 * The weekday list, guarded. Without it a schedule missing `days` throws a
 * TypeError from inside `includes` that names neither the item nor the field,
 * and a `days` that is a string quietly matches nothing at all.
 *
 * Being an array is not enough. `dayOfWeek` returns a number, so the `["1",
 * "3", "5"]` an HTML form posts matches nothing on any day, and so does `[7]`
 * or an empty list from a form with no boxes checked. Every one of those makes
 * the habit disappear from Today for good, with nothing thrown and nothing
 * logged — the same failure a bare `Array.isArray` was written to stop.
 */
export function weekdayList(schedule: Extract<Schedule, { type: "weekdays" }>): number[] {
  const days = schedule.days
  if (!Array.isArray(days) || days.length === 0 || !days.every(isWeekday)) {
    throw new RangeError(`Weekdays must be a non-empty list of days 0-6: ${JSON.stringify(days)}`)
  }
  return days
}

/** One tap: the day an item was checked off, as stored. */
export type CheckIn = { itemId: string; localDate: string }

/**
 * What an item's own history says about the date being asked about.
 * Both fields are required: a forgotten one would silently read as "never
 * done", which looks exactly like "due", and every item would show up due.
 */
export type DueContext = {
  /** Last local date this item was checked off, null if never. */
  lastDoneDate: string | null
  /**
   * Check-ins logged in the week containing the date, before that date.
   * Today's own check-ins are left out so a `per_week` habit keeps its row on
   * the day it is tapped; see `dueItems` for why.
   */
  doneEarlierThisWeek: number
}

/**
 * Whether an item wants doing on a given local date — what the Today view
 * lists. A `per_week` habit stays due every day until the week's count is met
 * by earlier days, so the last tap of the week does not remove the row under
 * it. "Listed today" is not "must be done today": see `requiredToday`.
 */
export function isDue(schedule: Schedule, localDate: string, context: DueContext): boolean {
  switch (schedule.type) {
    case "daily":
      return true
    case "weekdays":
      return weekdayList(schedule).includes(dayOfWeek(localDate))
    case "per_week":
      return context.doneEarlierThisWeek < weeklyCount(schedule)
    case "interval":
      return dueness(context.lastDoneDate, localDate, schedule.days) >= 1
  }
}

/**
 * Whether missing an item today costs the daily bonus.
 *
 * For everything with a fixed day this is the same question as `isDue`. A
 * `per_week` habit is different: it is listed every day of its week, but the
 * user only owes it today once the count still left no longer fits in the days
 * left after today. Gym 3 per week, nothing done: not required on Monday with
 * six days to go, required on Friday because Friday and Saturday are two days
 * and three are owed.
 *
 * Without this the bonus would read "listed" as "owed" and charge the user for
 * a Monday they got right. The week window stays here so the bonus does not
 * have to rebuild it; see `dueItems`.
 */
export function requiredToday(schedule: Schedule, localDate: string, context: DueContext): boolean {
  if (schedule.type !== "per_week") return isDue(schedule, localDate, context)
  const daysLeftInWeek = 7 - dayOfWeek(localDate)
  return weeklyCount(schedule) - context.doneEarlierThisWeek >= daysLeftInWeek
}

/**
 * The items due on a local date, given every check-in for them.
 *
 * Callers pass raw check-ins and get a list back; deriving "last done" and the
 * week count happens here so the Today view, the daily bonus, the badge count
 * and the reminder scheduler cannot each invent their own week window.
 *
 * Doing an item today does not mean the same thing for both types. An
 * `interval` chore drops out of the list the moment it is done, because its
 * interval restarts. A `daily`, `weekdays` or `per_week` habit stays in the
 * list after being done today, because its schedule does not move; the Today
 * view needs it listed so the checkmark has a row to sit on. Callers that want
 * "still outstanding" must subtract today's check-ins themselves.
 *
 * That is why the week count below stops at the day before. A gym habit of 3
 * per week done Monday and Tuesday is due on Wednesday; counting Wednesday's
 * own tap would delete the row on the tap that made it, leaving nothing to
 * untap after a mistap. It drops out on Thursday, when the three are all
 * earlier days.
 */
export function dueItems<ItemType extends { id: string; schedule: Schedule }>(
  items: ItemType[],
  localDate: string,
  checkIns: CheckIn[],
): ItemType[] {
  return selectItems(items, localDate, checkIns, isDue)
}

/**
 * The items the daily bonus requires on a local date, given every check-in.
 *
 * `dueItems` minus the `per_week` habits that still have room left in the week
 * — the rows a user can leave untapped today without losing the bonus. Callers
 * still subtract today's own check-ins to get what is outstanding.
 */
export function requiredItems<ItemType extends { id: string; schedule: Schedule }>(
  items: ItemType[],
  localDate: string,
  checkIns: CheckIn[],
): ItemType[] {
  return selectItems(items, localDate, checkIns, requiredToday)
}

function selectItems<ItemType extends { id: string; schedule: Schedule }>(
  items: ItemType[],
  localDate: string,
  checkIns: CheckIn[],
  wanted: (schedule: Schedule, localDate: string, context: DueContext) => boolean,
): ItemType[] {
  const contexts = dueContexts(checkIns, localDate)
  return items.filter(item => wanted(item.schedule, localDate, contexts.get(item.id) ?? NO_HISTORY))
}

/** An item nothing has ever been logged against. Frozen: callers share it. */
export const NO_HISTORY: DueContext = Object.freeze({ lastDoneDate: null, doneEarlierThisWeek: 0 })

/**
 * What every item's own check-ins say about a local date, keyed by item id.
 *
 * Exported because the Today view needs one item's last-done date to show how
 * overdue a chore is, and a second derivation of "last done" would be a second
 * answer to it. An item with no check-ins is absent from the map, not
 * `NO_HISTORY` — callers fall back themselves.
 */
export function dueContexts(checkIns: CheckIn[], localDate: string): Map<string, DueContext> {
  const firstDayOfWeek = weekStart(localDate)
  const contexts = new Map<string, DueContext>()

  for (const checkIn of checkIns) {
    // These are compared as strings, and a malformed one compares wrong rather
    // than failing: "2026-9-16" sorts after "2026-09-16", so a bad row reads as
    // a future check-in and is dropped. Parse it first so the guard sees it.
    parse(checkIn.localDate)
    if (checkIn.localDate > localDate) continue

    const context = contexts.get(checkIn.itemId) ?? { lastDoneDate: null, doneEarlierThisWeek: 0 }
    if (context.lastDoneDate === null || checkIn.localDate > context.lastDoneDate) {
      context.lastDoneDate = checkIn.localDate
    }
    if (checkIn.localDate >= firstDayOfWeek && checkIn.localDate < localDate) {
      context.doneEarlierThisWeek += 1
    }
    contexts.set(checkIn.itemId, context)
  }

  return contexts
}
