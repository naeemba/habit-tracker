import Link from "next/link"
import { requireSession } from "@/lib/auth-server"
import { listCheckIns } from "@/lib/checkin-queries"
import { today } from "@/lib/dates"
import { listItems } from "@/lib/item-queries"
import { pointsOn } from "@/lib/ledger-queries"
import { describeSchedule } from "@/lib/items"
import { timezone } from "@/lib/settings"
import { NOTE_MAXIMUM_LENGTH, todayRows } from "@/lib/today"
import { saveTodayNote, toggleToday } from "./actions"

export const metadata = { title: "Today" }

// Live data, and the build image has no database to read it from. Without this
// `next build` inside Docker dies on `relation "items" does not exist` against
// the placeholder DATABASE_URL.
export const dynamic = "force-dynamic"

export default async function TodayPage() {
  // The proxy sees only that a cookie exists; this is the real gate.
  await requireSession()

  const localDate = today(timezone())
  // The day's points are read from the ledger, not summed here. The check-off
  // wrote them, so the header shows what the day actually paid — including the
  // daily bonus, which appears the moment the last owed item is tapped.
  const [items, checkIns, points] = await Promise.all([listItems(), listCheckIns(), pointsOn(localDate)])
  const rows = todayRows(items, localDate, checkIns)
  // Listed is not owed. A `per_week` habit keeps its row every day of its
  // week, so counting the undone rows would say "1 left" on a day the user
  // owes nothing; `required` is the same question the daily bonus asks.
  const left = rows.filter(row => row.required && !row.done).length

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
      <h1 className="flex items-baseline justify-between gap-3 text-2xl font-semibold tracking-tight">
        Today
        <span className="text-base font-normal tabular-nums opacity-70">
          {rows.length === 0 ? "" : `${left === 0 ? "all done" : `${left} left`} · ${points}p`}
        </span>
      </h1>

      {rows.length === 0 ? (
        <p className="text-sm opacity-70">Nothing due today.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ item, done, note }) => (
            <li key={item.id} className="rounded-xl border border-black/10 dark:border-white/15">
              {/* The whole row is the button: one tap anywhere on it, and a
                  target big enough to hit with a thumb. */}
              <form action={toggleToday}>
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  aria-pressed={done}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  {/* No fill when it is done: a ✓ in the page's own text colour on a
                      mid-tone item colour is about 3:1, and the circle is what the
                      thumb aims at. The ring carries the item's colour either way. */}
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full border-2 text-2xl"
                    style={{ borderColor: item.color }}
                  >
                    {done ? "✓" : item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-medium ${done ? "line-through opacity-60" : ""}`}>
                      {item.name}
                    </span>
                    <span className="block truncate text-sm opacity-70">{describeSchedule(item.schedule)}</span>
                  </span>
                  <span className="text-sm tabular-nums opacity-70">{item.points}p</span>
                </button>
              </form>

              {/* Only once it is done: the note belongs to the check-in, and
                  folded away so it never sits between a thumb and the tap. */}
              {done && (
                <details className="border-t border-black/10 px-4 py-2 dark:border-white/15">
                  <summary className="cursor-pointer text-sm opacity-70">{note ?? "Add a note"}</summary>
                  <form action={saveTodayNote} className="mt-2 flex gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input
                      name="note"
                      defaultValue={note ?? ""}
                      maxLength={NOTE_MAXIMUM_LENGTH}
                      placeholder="What happened?"
                      className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
                    />
                    <button type="submit" className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
                      Save
                    </button>
                  </form>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/items"
        className="block rounded-xl border border-black/10 p-3 text-center font-medium dark:border-white/15"
      >
        Items
      </Link>
    </main>
  )
}
