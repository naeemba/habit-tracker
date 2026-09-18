/**
 * Turning a submitted form into an item, and describing one in words.
 *
 * Nothing here touches the database or React, so `items.test.ts` can run it
 * under `node --test`. The queries live in `item-queries.ts`.
 */
import { intervalDays, isWeekday, weekdayList, weeklyCount, type Schedule } from "./dates.ts"

/** A chore is "every N days since last done"; a habit has a fixed schedule. */
export type ItemKind = "habit" | "chore"

/** Everything a form can set. `id`, `archivedAt` and `createdAt` are not here. */
export type ItemInput = {
  kind: ItemKind
  name: string
  icon: string
  color: string
  points: number
  schedule: Schedule
  reminderTime: string | null
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Item ids come out of the URL, so they are as untrusted as form fields.
 * Postgres rejects a non-uuid with an error that reaches the user as a 500,
 * which reads like the app is broken rather than like a bad link.
 */
export function isItemId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value)
}

/**
 * The same guard for the queries, which have an id and no way to refuse it
 * politely. Nothing shows this message: every screen posts ids it just
 * rendered, so getting here means a replayed request, and a server error is
 * the right answer to that. The pages are where a missing item is turned into
 * something a user reads.
 */
export function assertItemId(value: unknown): string {
  if (!isItemId(value)) throw new RangeError(`Not an item id: ${value}`)
  return value
}

/**
 * Read a submitted item, or throw a message fit to show the user.
 *
 * Every field is checked here because this is the only door into the table.
 * The browser's own `required`, `min` and `max` attributes are a convenience,
 * not a guarantee: a form can be replayed with anything in it.
 */
export function parseItemForm(form: FormData): ItemInput {
  const schedule = parseSchedule(form)
  const reminderTime = form.get("reminderTime")
  return {
    // Not asked for on the form. The four schedule types already split the two
    // kinds, so deriving it is what stops an item claiming to be a chore while
    // carrying a habit's schedule.
    kind: schedule.type === "interval" ? "chore" : "habit",
    name: text(form, "name", "A name", 80),
    icon: text(form, "icon", "An icon", 16),
    color: match(form, "color", HEX_COLOR, "Colour must look like #a1b2c3."),
    points: wholeNumber(form, "points", "Points", 0, 999),
    schedule,
    reminderTime: reminderTime === "" || reminderTime === null
      ? null
      : match(form, "reminderTime", CLOCK_TIME, "Reminder time must look like 07:30."),
  }
}

function parseSchedule(form: FormData): Schedule {
  const type = form.get("scheduleType")
  switch (type) {
    case "daily":
      return { type: "daily" }
    case "weekdays": {
      // 0 = Sunday, matching the `weekdays` shape in dates.ts. An empty list
      // would match no day and hide the habit from Today for good.
      const days = form.getAll("weekdays").map(Number)
      if (days.length === 0 || !days.every(isWeekday)) {
        throw new RangeError("Pick at least one weekday.")
      }
      return { type: "weekdays", days: [...new Set(days)].sort((a, b) => a - b) }
    }
    case "per_week":
      return { type: "per_week", count: wholeNumber(form, "timesPerWeek", "Times a week", 1, 7) }
    case "interval":
      return { type: "interval", days: wholeNumber(form, "intervalDays", "The number of days", 1, 365) }
    default:
      throw new RangeError("Pick a schedule.")
  }
}

function text(form: FormData, field: string, label: string, maximumLength: number): string {
  const value = form.get(field)
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (trimmed === "") throw new RangeError(`${label} is required.`)
  if (trimmed.length > maximumLength) throw new RangeError(`${label} can be at most ${maximumLength} characters.`)
  return trimmed
}

function match(form: FormData, field: string, pattern: RegExp, message: string): string {
  const value = form.get(field)
  if (typeof value !== "string" || !pattern.test(value.trim())) throw new RangeError(message)
  return value.trim()
}

/**
 * `Number("")` and `Number(null)` are both 0, so a missing field lands below
 * any minimum of 1 and is caught here rather than saved as a zero.
 */
function wholeNumber(form: FormData, field: string, label: string, minimum: number, maximum: number): number {
  const value = Number(form.get(field))
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be a whole number from ${minimum} to ${maximum}.`)
  }
  return value
}

/**
 * What was typed, in the shape the form posted it.
 *
 * React empties an uncontrolled form as soon as its action returns, so a save
 * refused over one bad field would otherwise wipe every other field with it —
 * on a phone that is the whole item typed again. Handing the raw strings back
 * lets the form redraw itself as the user left it.
 */
export type SubmittedFields = {
  name: string
  icon: string
  color: string
  points: string
  scheduleType: string
  weekdays: string[]
  timesPerWeek: string
  intervalDays: string
  reminderTime: string
}

export function readSubmittedFields(form: FormData): SubmittedFields {
  const one = (field: string) => {
    const value = form.get(field)
    return typeof value === "string" ? value : ""
  }
  return {
    name: one("name"),
    icon: one("icon"),
    color: one("color"),
    points: one("points"),
    scheduleType: one("scheduleType"),
    weekdays: form.getAll("weekdays").filter(value => typeof value === "string"),
    timesPerWeek: one("timesPerWeek"),
    intervalDays: one("intervalDays"),
    reminderTime: one("reminderTime"),
  }
}

/**
 * 0 = Sunday, the order the `weekdays` schedule numbers its days. The form
 * shows the same seven, shortened, so a week that starts on a different day
 * cannot mean one thing in the list and another in the checkboxes.
 */
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/**
 * One line for the list: what this item's schedule asks of you.
 *
 * `schedule` is jsonb with no CHECK constraint, so a row typed into psql or
 * restored from a backup can hold anything. Throwing here would 500 the list,
 * and the list is the only way to reach the bad row and fix it — so a schedule
 * that makes no sense says so and stays clickable.
 */
export function describeSchedule(schedule: Schedule): string {
  try {
    switch (schedule.type) {
      case "daily":
        return "Every day"
      case "weekdays":
        return weekdayList(schedule).map(day => WEEKDAY_NAMES[day]).join(", ")
      case "per_week": {
        const count = weeklyCount(schedule)
        return count === 1 ? "Once a week" : `${count} times a week`
      }
      case "interval": {
        const days = intervalDays(schedule)
        return days === 1 ? "Every day since last done" : `Every ${days} days since last done`
      }
      default:
        throw new RangeError(`Unknown schedule type: ${JSON.stringify(schedule)}`)
    }
  } catch (error) {
    console.warn("Unreadable schedule", error)
    return "Schedule needs fixing"
  }
}
