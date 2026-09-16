"use client"

import { useActionState } from "react"
import { WEEKDAY_NAMES } from "@/lib/items"
import type { Item } from "@/lib/schema"
import { saveItem, type SaveResult } from "./actions"

const fieldClassName = "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-base"
const labelClassName = "block text-sm font-medium mb-1"

/**
 * The add form and the edit form are the same form; `item` is what makes it an
 * edit. Every schedule's own fields stay on screen whatever is selected, so the
 * form needs no JavaScript of its own to show and hide them — the action reads
 * only the fields belonging to the schedule that was picked.
 *
 * That is also why the two schedule numbers carry no `min`/`max`: the browser
 * validates every mounted control, so a stale `0` in a box the chosen schedule
 * ignores would block the submit with a bubble the user never looks at.
 * `parseItemForm` enforces both ranges and says so in a sentence instead.
 */
export function ItemForm({ item }: { item?: Item }) {
  const [result, action, pending] = useActionState<SaveResult, FormData>(
    saveItem.bind(null, item?.id ?? null),
    null,
  )

  const schedule = item?.schedule
  // A refused save wins over the stored item: it is what the user last typed.
  const typed = result?.fields
  const scheduleType = typed?.scheduleType ?? schedule?.type ?? "daily"
  const checkedWeekdays = typed
    ? typed.weekdays.map(Number)
    : schedule?.type === "weekdays" && Array.isArray(schedule.days)
      ? schedule.days
      : []

  return (
    // Remounting on every refusal is what puts the typed values back: React
    // resets the form once the action returns, and a reset restores whatever
    // the inputs were mounted with. Keying on the attempt count rather than on
    // the message means two tries that fail the same way still redraw.
    <form key={result?.attempt ?? 0} action={action} className="space-y-4">
      {result && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {result.error}
        </p>
      )}

      <div>
        <label className={labelClassName} htmlFor="name">Name</label>
        <input className={fieldClassName} id="name" name="name" defaultValue={typed?.name ?? item?.name ?? ""} maxLength={80} required autoComplete="off" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClassName} htmlFor="icon">Icon</label>
          <input className={fieldClassName} id="icon" name="icon" defaultValue={typed?.icon ?? item?.icon ?? "✅"} maxLength={16} required autoComplete="off" />
        </div>
        <div>
          <label className={labelClassName} htmlFor="color">Colour</label>
          <input className={`${fieldClassName} h-11 w-16 p-1`} id="color" name="color" type="color" defaultValue={typed?.color || item?.color || "#4f46e5"} />
        </div>
        <div className="w-24">
          <label className={labelClassName} htmlFor="points">Points</label>
          <input className={fieldClassName} id="points" name="points" type="number" inputMode="numeric" min={0} max={999} defaultValue={typed?.points ?? item?.points ?? 1} required />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClassName}>Schedule</legend>

        <label className="flex items-center gap-2 py-1">
          <input type="radio" name="scheduleType" value="daily" defaultChecked={scheduleType === "daily"} />
          <span>Every day</span>
        </label>

        <label className="flex items-center gap-2 py-1">
          <input type="radio" name="scheduleType" value="weekdays" defaultChecked={scheduleType === "weekdays"} />
          <span>Certain weekdays</span>
        </label>
        <div className="flex flex-wrap gap-2 pl-6">
          {/* One list of days, shared with the list page, so the boxes ticked
              here and the names shown there can never mean different days. */}
          {WEEKDAY_NAMES.map((name, day) => (
            <label key={day} className="flex items-center gap-1 rounded-lg border border-black/15 dark:border-white/20 px-2 py-1 text-sm">
              <input type="checkbox" name="weekdays" value={day} defaultChecked={checkedWeekdays.includes(day)} />
              <span>{name.slice(0, 3)}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 py-1">
          <input type="radio" name="scheduleType" value="per_week" defaultChecked={scheduleType === "per_week"} />
          <span>Times a week</span>
        </label>
        <input
          className={`${fieldClassName} ml-6 w-24`}
          name="timesPerWeek"
          type="number"
          inputMode="numeric"
          aria-label="Times a week"
          defaultValue={typed?.timesPerWeek ?? (schedule?.type === "per_week" ? schedule.count : 3)}
        />

        <label className="flex items-center gap-2 py-1">
          <input type="radio" name="scheduleType" value="interval" defaultChecked={scheduleType === "interval"} />
          <span>Every N days since last done (a chore)</span>
        </label>
        <input
          className={`${fieldClassName} ml-6 w-24`}
          name="intervalDays"
          type="number"
          inputMode="numeric"
          aria-label="Days between chores"
          defaultValue={typed?.intervalDays ?? (schedule?.type === "interval" ? schedule.days : 7)}
        />
      </fieldset>

      <div>
        <label className={labelClassName} htmlFor="reminderTime">Reminder (optional)</label>
        <input className={fieldClassName} id="reminderTime" name="reminderTime" type="time" defaultValue={typed?.reminderTime ?? item?.reminderTime ?? ""} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background disabled:opacity-50"
      >
        {pending ? "Saving…" : item ? "Save changes" : "Add item"}
      </button>
    </form>
  )
}
