# Schedules: decisions

Settled questions. Read the entry before re-litigating it.

## schedules-decision-1: One dates module, no date library

All day maths lives in `src/lib/dates.ts`, and `Intl.DateTimeFormat` with
`en-CA` produces the local date, so there is no date library. `dueItems`
derives last-done and the week count itself, so the Today view, the bonus, the
badge and the reminder scheduler cannot each pick their own week start;
`weekStart` and `dayOfWeek` stay private for the same reason. The
[research notes](../research.md) section 6 asked for one module owning "what day
is it", a `local_date` beside the UTC instant, and streaks and scores
recomputed on read. (2026-09-16, #2)

## schedules-decision-2: A `per_week` habit is owed only once the week runs out

Listed every day of its week, owed only once the count still left no longer
fits in the days left after today. The first wording, "fits in the days left",
contradicted its own example and the code, and was corrected to "after today".
(2026-09-16, #2)

## schedules-decision-3: The week's count stops at the day before

`doneEarlierThisWeek` counts check-ins before the day asked about, not on it,
so a `per_week` habit keeps its row on the tap that completes its week and
leaves on the next day. Renamed from `doneThisWeek` so the name says what it
counts. (2026-09-16, #2)
