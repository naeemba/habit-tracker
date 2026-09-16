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
 * What an item's own history says about the date being asked about.
 * Both fields are required: a forgotten one would silently read as "never
 * done", which looks exactly like "due", and every item would show up due.
 */
export type DueContext = {
  /** Last local date this item was checked off, null if never. */
  lastDoneDate: string | null
  /** Check-ins already logged in the week containing the date. */
  doneThisWeek: number
}

/**
 * Whether an item wants doing on a given local date.
 * A `per_week` habit stays due every day until the week's count is met.
 */
export function isDue(schedule: Schedule, localDate: string, context: DueContext): boolean {
  switch (schedule.type) {
    case "daily":
      return true
    case "weekdays":
      return schedule.days.includes(dayOfWeek(localDate))
    case "per_week":
      return context.doneThisWeek < schedule.count
    case "interval":
      return dueness(context.lastDoneDate, localDate, schedule.days) >= 1
  }
}

/**
 * The items due on a local date, given every check-in for them.
 *
 * Callers pass raw check-ins and get a list back; deriving "last done" and
 * "done this week" happens here so the Today view, the daily bonus, the badge
 * count and the reminder scheduler cannot each invent their own week window.
 *
 * Doing an item today does not mean the same thing for both types. An
 * `interval` chore drops out of the list the moment it is done, because its
 * interval restarts. A `daily`, `weekdays` or `per_week` habit stays in the
 * list after being done today, because its schedule does not move; the Today
 * view needs it listed so the checkmark has a row to sit on. Callers that want
 * "still outstanding" must subtract today's check-ins themselves.
 */
export function dueItems<ItemType extends { id: string; schedule: Schedule }>(
  items: ItemType[],
  localDate: string,
  checkIns: { itemId: string; localDate: string }[],
): ItemType[] {
  const firstDayOfWeek = weekStart(localDate)
  const lastDoneDates = new Map<string, string>()
  const weeklyCounts = new Map<string, number>()

  for (const checkIn of checkIns) {
    // These are compared as strings, and a malformed one compares wrong rather
    // than failing: "2026-9-16" sorts after "2026-09-16", so a bad row reads as
    // a future check-in and is dropped. Parse it first so the guard sees it.
    parse(checkIn.localDate)
    if (checkIn.localDate > localDate) continue
    const lastDoneDate = lastDoneDates.get(checkIn.itemId)
    if (lastDoneDate === undefined || checkIn.localDate > lastDoneDate) {
      lastDoneDates.set(checkIn.itemId, checkIn.localDate)
    }
    if (checkIn.localDate >= firstDayOfWeek) {
      weeklyCounts.set(checkIn.itemId, (weeklyCounts.get(checkIn.itemId) ?? 0) + 1)
    }
  }

  return items.filter(item =>
    isDue(item.schedule, localDate, {
      lastDoneDate: lastDoneDates.get(item.id) ?? null,
      doneThisWeek: weeklyCounts.get(item.id) ?? 0,
    }),
  )
}
