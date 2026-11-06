# Schedules

What an item asks of a given day. Every day-boundary calculation in the app
lives in one module, `src/lib/dates.ts`: what day it is for the user, the four
schedule shapes, how ripe a chore is, which items are due, and which of those
the daily bonus is owed. Nowhere else parses a date, adds days, or decides what
is due. No date library: `Intl.DateTimeFormat` does the one conversion.

## Local dates

A local date is a `YYYY-MM-DD` string in the user's timezone. It is what a
check-in counts for, and the only day identity the rest of the app uses.
`toLocalDate(instant, timezone)` formats with `en-CA`, which is exactly that
shape; `today(timezone)` is the same for now. The timezone is one setting (see
[settings](../settings/README.md)).

Local dates are parsed as UTC midnight and sort as strings, so `<` and `>`
compare them as calendar days. `addDays` and `daysBetween` are the day
arithmetic. A week starts on Sunday, the same 0 = Sunday the `weekdays`
schedule numbers its days with.

## The four schedules

| Shape | Kind | Due on a day when |
|---|---|---|
| `{ "type": "daily" }` | habit | always |
| `{ "type": "weekdays", "days": [1, 3, 5] }` | habit | the day's number is in `days` (0 = Sunday) |
| `{ "type": "per_week", "count": 3 }` | habit | fewer than `count` check-ins on earlier days of this week |
| `{ "type": "interval", "days": 14 }` | chore | `dueness >= 1` |

`dueness = daysSinceLastDone / intervalDays`: 0 just done, 1 due, above 1
overdue. A chore never done is `Infinity`, so it sorts to the top. Chores use
"every N days since last done" and habits a fixed schedule; the two are never
one schedule type. The formulas and where they come from are in
[research notes](../research.md) sections 1 and 3.

## Due and owed

Two questions, two pairs of functions, one pass over the check-ins:

- **Due** (`isDue`, `dueItems`) — what the Today view lists. A `per_week` habit
  stays due every day until earlier days meet the week's count, so the tap that
  completes the week does not remove the row under it. An `interval` chore
  leaves the list the moment it is done, because its interval restarts; a
  habit done today stays listed. Callers that want "still outstanding"
  subtract today's check-ins themselves.
- **Owed** (`requiredToday`, `requiredItems`) — what the daily bonus checks.
  The same as due, except a `per_week` habit is owed only once the count still
  left no longer fits in the days left after today
  ([schedules-rule-3](hard-rules.md#schedules-rule-3-owed-is-not-listed)).
  Gym 3 per week, nothing done: not owed on Monday with six days to go, owed on
  Friday because Friday and Saturday are two days and three are owed.

`dueContexts` derives each item's last-done date and its count earlier this
week from raw check-ins, and is exported so the Today view's chore hint reads
the same derivation. Callers pass raw check-ins, so the Today view, the daily
bonus, the badge count and the reminder scheduler cannot each invent their own
week window.

## Guards

`schedule` is jsonb and `local_date` is text, so nothing upstream guarantees
either shape. Every field is read through a guard that throws a `RangeError`
naming the bad value ([schedules-rule-1](hard-rules.md#schedules-rule-1-bad-data-throws-it-never-reads-as-not-due)):
`weeklyCount`, `intervalDays`, `weekdayList`, the date parser (which also
rejects `2026-02-31`), `dueness` (interval at least one day), and
`toLocalDate` (a bad instant and a bad timezone get different messages).
`isWeekday` is exported so the item form refuses exactly what the guards would
later throw on.

## Files

- The module and its tests: `src/lib/dates.ts`, `src/lib/dates.test.ts`

## Scenarios

- Given 2026-09-16 23:30 UTC, when the timezone is Europe/Berlin, then the
  local date is 2026-09-17; in UTC and America/New_York it is 2026-09-16.
- Given the same UTC clock time in July and December, when converted for
  Berlin, then the local day follows daylight saving.
- Given a 14-day chore last done 14 days ago, when asked its dueness, then it is
  1 and the chore is due; never done, it is `Infinity`.
- Given a weekdays habit on Monday, Wednesday and Friday, when the day is a
  Thursday, then it is not due.
- Given gym 3 per week done Sunday, Monday and Tuesday, when asked on
  Wednesday, then gym is not due.
- Given gym done Monday and Tuesday and tapped on Wednesday, when asked on
  Wednesday, then gym is still due; on Thursday it is not, and the next Sunday
  it is back.
- Given a 2-day chore done today, when asked today, then it is not due, while a
  daily habit done today still is.
- Given a check-in dated after the day asked about, when deriving due items,
  then it is ignored.
- Given a check-in dated `2026-9-01`, when deriving due items, then it throws
  `Not a local date: 2026-9-01`.
- Given a `per_week` count of 0, a weekday list of `["1", "3", "5"]`, `[]` or
  `[7]`, or an interval of 0, when read, then it throws rather than hiding the
  item.
- Given pushups daily and gym 3 per week with nothing done, when asked on
  Monday, then both are due and only pushups is owed; on Friday with one gym
  done both are owed; on Friday with two done only pushups is owed.

## Open questions

- `dueItems` does not filter archived items; callers pass active ones (#2).
- [data-model.md](../data-model.md) asks for `date` columns, but `local_date` is
  `text` in the schema, which is why every reader has to guard it.
- Time of day (`HH:MM` in the user's timezone) for the reminder scheduler
  should land here rather than roll its own `Intl`, or it formats `"9:00 AM"`
  and compares it to a stored `"09:00"` (#2).
- No `Intl.DateTimeFormat` cache; add one if a history view stutters (#2).
